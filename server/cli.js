/*
	Copyright 2012 Humberto Sermeño
	
	This file is part of Otoch.

    Foobar is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Foobar is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
*/
var config = require(__dirname + '/config'),
    controllers = require(__dirname + '/house-controllers');

config.init().done(function() {
    controllers.execute(process.argv[2], function() {
        console.log('done');
        process.exit(0);
    });
});


