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

var possibleStates = [
	'A,Assigned',
	'W,In Work',
	'C,Completed',
	'R,Released'
];

var possible_colors = 4;

// Additional column on the left side for new items not assigned to a swimlane.
// Disable feature by setting empty string ("").
var sideCol = "New w/o version";

var swimlanes = [
	'v0.2.0,Next release',
	'v0.3.0,Another release'
];
