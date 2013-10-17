/*
* This file is part of Simple Kanban.
* Copyright (c) 2009 Stephan Schmidt
* Copyright (c) 2013 Raphael Schär
* Copyright (c) 2013 Uwe Freese
*
* Simple Kanban is free software: you can redistribute it and/or modify it
* under the terms of the GNU General Public License as published by the
* Free Software Foundation, either version 3 of the License, or (at your
* option) any later version.
*
* Simple Kanban is distributed in the hope that it will be useful, but
* WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
* Public License for more details.
*
* You should have received a copy of the GNU General Public License along
* with Simple Kanban. If not, see <http://www.gnu.org/licenses/>.
*/

(function(){
	"use strict";

	var app_data = {
		people:{}
	};
	
	// flips back end forth to disable other event listener when already editing
	var IN_EDIT_MODE = false;

	var loadData = function() {
		var state_data = init_states(possibleStates);
		var swimlane_data = init_swimlanes(possibleStates);
		$.ajax({
			type: 'POST',
			url: 'server.php',
			data: {action:'load'},
			dataType: 'json',
			success: function(data) {
				if (data === null) {
					data = {};
				}
				app_data.board = init_board(data);
				app_data.states = state_data.states;
				app_data.states_order = state_data.states_order;
				

				app_data.rawData = data;

				create_board(app_data);
				createPeopleList();
			}
		});
		//return rawData;
	};

	var createPeopleList = function() {
		var peopleList = '<form ><ul class="people-list">';
		for (var i in app_data.people) {
			if (app_data.people.hasOwnProperty(i)) {
				peopleList += '<li><input type="checkbox" name="'+i+'">'+i+'</li>';
			}
		}
		peopleList += '</ul></form>';
		$('#navigation').append(peopleList);
	};

	var saveData = function(data) {
		if (data === '') {
			data = {};
		}
		$.ajax({
			type: 'POST',
			url: 'server.php',
			data: {action:'save',data:data},
			dataType:'json'
		});
	};

	var init_states = function(states_input) {
		var states = {};
		var states_order = [];
		for ( var i=0, len=states_input.length; i<len; i++ ) {
			var state = states_input[i].split(",");
			if (state.length === 2) {
				states[state[0]] = state[1];
				states_order.push(state[0]);
			}
		}
		return {states: states, states_order: states_order};
	};
	
	var init_swimlanes = function(swimlanes_input) {
		var swimlanes = {};
		var swimlanes_order = [];
		for (var i = 0, len = swimlanes_input.length; i < len; i++) {
			var swimlane = swimlanes_input[i].split(",");
			if (swimlane.length === 2) {
				swimlanes[swimlane[0]] = swimlane[1];
				swimlanes_order.push(swimlanes[0]);
			}
		}
		return {swimlanes: swimlanes, swimlanes_order: swimlanes_order};
	};

	var init_board = function(stories) {
		var board = {};
		for (var i in stories) {
			if (stories.hasOwnProperty(i)) {
				var story = stories[i];
				story.id = i;
				if (! board[story.state]) {
					board[story.state] = [];
				}
				board[story.state].push(story);
			}
		}
		return board;
	};

	var create_story_li_item = function(story) {
		var story_element = $("<li data-state='"+story.state+"' data-id='"+story.id+"'><div class='box color_"+story.color+"' ><div class='editable' data-id='"+story.id+"'>" + story.title + ", " + story.responsible + "</div></div></li>");
		
		if (app_data.people[story.responsible] === undefined) {
			app_data.people[story.responsible] = [story.id];
		}
		else {
			app_data.people[story.responsible].push(story.id);
		}
		return story_element;
	};

	var create_list = function(board, state, swimlane) {
		var list = $("<ul></ul>");
		if (board[state]) {
			for (var i=0, len=board[state].length; i<len; i++) {
				var id = board[state][i].id;
				
				if ((app_data.rawData[id].swimlane === swimlane) || ((app_data.rawData[id].swimlane === undefined) && (swimlane === "UNDEF")))
				{
					var story_element = create_story_li_item(app_data.rawData[id]);
					list.append(story_element);
				}
			}
		}
		return "<ul class='state' id='" + state + "'>"+list.html()+"</ul>";
	};

	var create_column = function(board, state, headlines, num, swimlane) {
		var content = '<div class="col state_box state_'+state+' col_'+num+'"><h4>'+headlines + '</h4>';
		content += create_list(board, state, swimlane);
		content += '</div>';
		return content;
	};

	var create_board = function(app_data) {
		
		var content = "";
		
		for (var j=0; j< app_data.states_order.length; j++) {
			var state = app_data.states_order[j];
			var col = create_column(app_data.board, state, app_data.states[state],j, "UNDEF");
			content += col;
		}

		$('#board').append("<div swimlane=\"UNDEF\">" + content + "</div>");

		content = "";
		
		for (var j=0; j< app_data.states_order.length; j++) {
			var state = app_data.states_order[j];
			var col = create_column(app_data.board, state, app_data.states[state],j, "2");
			content += col;
		}

		$('#board').append("<div swimlane=\"2\">" + content + "</div>");
		
		$('ul.state').dragsort({dragSelector:'li',dragBetween: true, placeHolderTemplate: "<li class='placeholder'><div>&nbsp</div></li>",dragEnd:droppedElement});
	};

	var createNewStory = function(id, text, state, color, swimlane) {
		if (state === undefined) {
			state = app_data.states_order[0];
		}
		if (color === undefined) {
			color = 0;
		}
		
		if (swimlane === undefined) {
			swimlane = "";
		}

		var arText = text.split(',');
		if (arText.length === 1) {
			arText[1] = 'tbd';
		}
		var story = {
			title:arText[0],
			id:id,
			responsible:arText[1].replace(/^\s+/,''),
			state:state,
			color:color,
			swimlane:swimlane
		};
		return story;
	};

	/**
	* callback when an element has moved
	*/
	var droppedElement = function() {
		var newState = $(this).parent().attr('id');
		var storyId = $(this).attr('data-id');
		
		var newSwimlane = $(this).parent().parent().parent().parent().parent().attr('swimlane');
		
		app_data.rawData[storyId].state = newState;
		app_data.rawData[storyId].swimlane = newSwimlane;
		saveData(app_data.rawData);
	};
	
	function htmlEntities(str) {
		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	function htmlEntityDecode(str) {
		return String(str).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
	}
	
	$(document).ready(function(){
		loadData();

		// ================= Handlers ======================
		
		$('#new').click(function(){
			var id = new Date().getTime();
			var story = createNewStory(id, "New project");
			if (app_data.rawData === undefined) {
				app_data.rawData = {};
			}
			app_data.rawData[id] = story;
			saveData(app_data.rawData);
			var storyHtml = create_story_li_item(story);
			$('#'+story.state).append(storyHtml);
			$(storyHtml).find('.editable').trigger('click');
			return false;
		});

		$('#board').on('click','.editable', function(){
			if (!IN_EDIT_MODE) {
				var value = $(this).html();
				var storyId = $(this).parent().parent().attr('data-id');
				var oldColor = app_data.rawData[storyId].color;
				var form = '<form><textarea class="editBox" data-old-value="' + htmlEntities(value) + '" data-old-color="'+oldColor+'">'+value+'</textarea><br/><a class="save" href="#">save</a> <a class="cancel" href="#">cancel</a> <a href="#" class="delete">delete</a> <a href="#" class="color">color</a></form>';
				$(this).html(form);
				$(this).find('textarea').focus();
				IN_EDIT_MODE = true;
				setTimeout(function(){
					$('html:not(.editable)').bind('click', function(){
						$('.cancel').trigger('click');
					});
				}, 100);
			}
		});

		$('#navigation').on('change', '.people-list li', function(){
			var responsible = $(this).find('textarea').attr('name');
			for (var k in app_data.people[responsible]) {
				if ($('#board li[data-id="'+app_data.people[responsible][k]+'"]').hasClass('highlight')) {
					$('#board li[data-id="'+app_data.people[responsible][k]+'"]').removeClass('highlight');
				}
				else {
					$('#board li[data-id="'+app_data.people[responsible][k]+'"]').addClass('highlight');
				}
			}
		});

		$(document).keyup(function(e) {
			if (e.keyCode === 27) { // ESC
				$('.cancel').trigger('click');
			}
			else if (e.keyCode === 78) { // "n" key
				if (!IN_EDIT_MODE) {
					$('#new').trigger('click');
				}
			}
		});

		$('#board').on('click','.cancel', function(){
			var storyId = $(this).parent().parent().attr('data-id');

			var remove_colors = "";
			for (var i=0;i<possible_colors;i++) {
				remove_colors += "color_"+i+" ";
			}
			var oldColor = $(this).parent().find('textarea').attr('data-old-color');
			app_data.rawData[storyId].color = oldColor;
			$(this).parent().parent().parent().removeClass(remove_colors);
			$(this).parent().parent().parent().addClass('color_'+oldColor);

			var oldContent = $(this).parent().find('textarea').attr('data-old-value');
			$(this).parent().parent().html(htmlEntityDecode(oldContent));

			$('html').unbind('click');
			setTimeout(function(){IN_EDIT_MODE = false;}, 200); // need to release a bit later, else we are right back into edit mode again
      		return false;
		});

		$('#board').on('click','.delete', function(){
			var id = $(this).parent().parent().attr('data-id');
			$(this).parent().parent().parent().parent().remove();
			$('html').unbind('click');
			delete app_data.rawData[id];
			saveData(app_data.rawData);
			setTimeout(function(){IN_EDIT_MODE = false;}, 200); // need to release a bit later, else we are right back into edit mode again
      return false;
		});

		$('#board').on('click', '.color', function() {
			var storyId = $(this).parent().parent().attr('data-id');
			if (app_data.rawData[storyId].color === undefined) {
				app_data.rawData[storyId].color = 0;				
			}
			else {
				$(this).parent().parent().parent().removeClass('color_'+app_data.rawData[storyId].color);
				app_data.rawData[storyId].color++;
				if (app_data.rawData[storyId].color >= possible_colors) {
					app_data.rawData[storyId].color = 0;
				}
			}
			$(this).parent().parent().parent().addClass('color_'+app_data.rawData[storyId].color);
      return false;
		});

		$('#board').on('submit', 'form', function(){
			var title = $(this).find('textarea').val();
			var storyId = $(this).parent().attr('data-id');
			var state = $(this).parent().parent().parent().attr('data-state');
			var swimlane = $(this).parent().parent().parent().parent().parent().parent().attr('swimlane');
			var story = createNewStory(storyId, title, state, app_data.rawData[storyId].color, swimlane);

			app_data.rawData[storyId] = story;
			saveData(app_data.rawData);
			$('html').unbind('click');
			$(this).parent().html( story.title + ", "+story.responsible);
			setTimeout(function(){IN_EDIT_MODE = false;}, 200); // need to release a bit later, else we are right back into edit mode again
			return false;
		});

		$('#board').on('click','.save', function(){
			$(this).parent().submit();
			return false;
		});

	});

  })();