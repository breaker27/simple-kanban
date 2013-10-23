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
		milestones:{},
		milestoneDescription:{},
		states:{},
		people:{},
		labels:{},
		milestoneCount:0
	};
	
	// flips back end forth to disable other event listener when already editing
	var IN_EDIT_MODE = false;

	var loadData = function() {
		var swimlane_data = init_swimlanes(swimlanes);

		$.ajax({
			type: 'GET',
			url: 'https://api.github.com/repos/breaker27/smarthomatic/issues',
			data: {action:'load'},
			dataType: 'json',
			success: function(data) {
				if (data === null) {
					data = {};
				}
				
				app_data.board = init_board(data);
				app_data.states = possibleStates;
				app_data.swimlanes_order = swimlane_data.swimlanes_order;				

				app_data.rawData = data;

				create_board(app_data);
//				createPeopleList();
			}
		});

		//return rawData;
	};
/*
	var GitHub_setMilestone = function(issueNr, milestone)
	{
		var github = new Github({
			username: "breaker27",
			password: "xxx"
		});
		
		var issues = github.getIssues("breaker27", "smarthomatic");
		
		var updatedIssue = {
			"milestone": 3
		};

		issues.update(issueNr, updatedIssue, function(err, issues2) {
			alert(err);
		});
	}
	*/
	var createPeopleList = function() {
		var peopleList = '<form ><ul class="people-list">';
		for (var i in app_data.people) {
			if (app_data.people.hasOwnProperty(i)) {
				peopleList += '<li><input type="checkbox" name="'+i+'">'+i+'</li>';
			}
		}
		peopleList += '</ul></form>';
		//$('#navigation').append(peopleList);
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

	var init_board = function(issues) {
		var board = {};
		for (var i in issues) {
				var issue = issues[i];
				var myState = "";
				
				// remember milestones
				var milestone = "";
				var milestoneOpen = true;
				
				if (issue.milestone != null)
				{
					milestone = issue.milestone.number;

					if (app_data.milestones[milestone] === undefined) {
						app_data.milestones[milestone] = issue.milestone.title;
						app_data.milestoneDescription[milestone] = issue.milestone.description;
						app_data.milestoneCount++;
					}
					
					milestoneOpen = issue.milestone.state = "open";
				}
				
				// remember labels
				var labels = "";
				var inProgress = false;
				
				if (issue.labels != null)
				{
					for (var l in issue.labels) {
						// remember all labels
						if (app_data.labels[issue.labels[l].name] === undefined) {
							app_data.labels[issue.labels[l].name] = '#' + issue.labels[l].color;
						}
					
						// TODO: remember every label for the issue
						
						// remember color code for issue
						if ($.inArray(issue.labels[l].name, color_labels) != -1)
						{
							issue.color = '#' + issue.labels[l].color;
						}
						
						if (issue.labels[l].name == "In Progress")
						{
							inProgress = true;
						}
					}
				}
				
				// calculate myState depending on original state, milestone state and labels
				if (milestone == "")
				{
					myState = "Unplanned";
				}
				else if (issue.state == "closed") // -> "In Testing" or "Done"
				{
					if (milestoneOpen)
					{
						myState = "Testing";
					}
					else
					{
						myState = "Done";
					}
				}
				else // "Not Started" or "In Progress", depending on "In Processing" label
				{
					if (inProgress)
					{
						myState = "Implementation";
					}
					else
					{
						myState = "Not Started";
					}
				}
				
				issue.id = i; // array index in list of items
				issue.myState = myState; // array index in list of items
				
				var cellKey = milestone + "|" + myState;
				
				if (!board[cellKey]) {
					board[cellKey] = [];
				}
				
				board[cellKey].push(issue);
		}
		
		
		
		return board;
	};
	
	var create_story_li_item2 = function(issue) {
		var assignee = "";
		
		if (issue.assignee != null)
		{
			assignee = '<div class="issue_assignee">' + issue.assignee.login + "</div>";
		}
		
		if (app_data.people[assignee] === undefined) {
			app_data.people[assignee] = [issue.id];
		}
		else {
			app_data.people[assignee].push(issue.id);
		}
		
		var body = issue.body;
		
		if (body.length > body_length_max)
		{
			body = body.substring(0, body_length_max - 3) + '...';
		}
		
		var bgcolor;
		if (issue.color === undefined)
		{
			bgcolor = '';
		}
		else
		{
			bgcolor = ' style="background-color: ' + issue.color + '"';
		}
		
		var issue_element = $('<li data-id="' + issue.id + '"><div class="box"' + bgcolor + '><div class="editable issue_title" data-id="' + issue.id + '">' + issue.title + '</div><div class="editable issue_body" data-id="' + issue.id + '">' + body + '</div>' + assignee + '</div></li>');
		
		return issue_element;
	};

	/*
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
	*/
	
	var create_list = function(board, milestone, state) {
		var list = $("<ul></ul>");
		var cellKey = milestone + "|" + state;
	
		if (board[cellKey]) {
		
		
			for (var i = 0, len = board[cellKey].length; i < len; i++) {
				var id = board[cellKey][i].id;
				
				//if (app_data.rawData[id].milestone == 3)
				//{
			
					var story_element = create_story_li_item2(app_data.rawData[id]);
					list.append(story_element);
				//}
			}
		}
		return "<ul class='state' id='" + id + "'>" + list.html() + "</ul>";
	};

	var create_headline = function() {
		var content = "";
				
		for (var j = 0; j < app_data.states.length; j++) {
			content += '<th WIDTH="18%">' + app_data.states[j] + '</th>';
			
			if (j == 0)
			{
				content += '<th WIDTH="2%" class="spacer"></th>';
				content += '<th WIDTH="8%">Story</th>';
			}
		}
		
		return content;
	};

	var create_column = function(board, state, milestoneNr, colNum) {
		var rowspan = "";
		
		if ((milestoneNr == 0) && (colNum == 0))
		{
			rowspan = ' rowspan="' + app_data.milestoneCount + '"';
		}
		else
		{
			rowspan = '';
		}
	
		var stateClass = state.replace(/\s/g,'');
	
		var content = '<td class="state_' + stateClass + ' col_' + colNum + '"' + rowspan + '>';
		content += create_list(board, milestoneNr, state);
		content += '</td>';
		return content;
	};

	var create_label_list = function()
	{
		var content = "<b>Labels:</b> ";
		
		for (var l in app_data.labels) {
			content += '<font style="background-color: ' + app_data.labels[l] + '">' + l + '</font> ';
		}
		
		return content;
	}
	
	var create_board = function(app_data) {
		$('#board').append("<tr>" + create_headline() + "</tr>");
		
		var content = "";
		
		// add "Unplanned" cell in 1st row
		var state = app_data.states[0];
		var col = create_column(app_data.board, state, "", 0);
		content += col;
			
		// one row per milestone
		for (var m in app_data.milestones) {
			// description column
			content += '<td class="spacer"></td><td><b>' + app_data.milestones[m] + '</b><br/>' + app_data.milestoneDescription[m] + '</td>';
			
			for (var j = 1; j < app_data.states.length; j++) {
				var state = app_data.states[j];
				var col = create_column(app_data.board, state, m, j);
				content += col;
			}

			$('#board').append("<tr swimlane=\"UNDEF\">" + content + "</tr>");
			
			content = "";
		}
		
		$('ul.state').dragsort({dragSelector:'li',dragBetween: true, placeHolderTemplate: "<li class='placeholder'><div>&nbsp</div></li>",dragEnd:droppedElement});
		
		$('#labels').append(create_label_list());
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

		$('#board').on('click','.save', function(){
			$(this).parent().submit();
			return false;
		});

	});

  })();