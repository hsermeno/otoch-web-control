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

require('js-yaml');

var net = require('net'), 
    path = require('path'),
    config = require('./config');

config.init();

module.exports = {
	callback: null,
	connection_count: 0,
	
	/**
	 * Executes a string command on a relay controller
	 *
	 * @param Object command The string command to execute
	 * @param String from    The id of the relay controller where the command should be executed
	 */
	connect_and_execute: function(command, from)
	{
		var controlador = config.getController(from),
			hello = false,
			status = '',
			that = this;
			
		console.log('connecting to ' + controlador.host + ":" + controlador.port);
		
		var conn = net.createConnection(controlador.port, controlador.host, function() {
			conn.write("\n", 'ascii');
			that.connection_count++;
		});
		
		conn.on('data', function(data){
			if (!hello) {
				hello = true;
				conn.write(command+"\r\n", 'ascii');
				console.log(data.toString());
				console.log('> ' + command);
			} else {
				status += data.toString();
			}
		});
		
		// connection finished
		conn.on('end', function(){
			console.log('client disconnected');
			var stat = config.translateStatus(status.trim(), controlador);
			if (--that.connection_count === 0) {
				(that.callback || function(){})(stat);
			}
		});
	},
		
	/**
	 * Executes a command in text form. The callback is
	 * called after execution.
	 *
	 * @param String what The command to execute.
	 * @param function callback The function to call after the command is executed
	 *
	 * @return bool true if successful, false otherwise 
	 */
	execute: function(what, callback) {
		this.callback = callback;
		
		console.log('Executing ' + what);
		
		try {
			var toExecute = {};
			
			config.translate(what, toExecute);
			
			for (key in toExecute) {
				this.connect_and_execute(toExecute[key], key);
			}
		} catch (error) {
			console.error("Error: " + error);
			return false;
		}
		
		return true;
	}
};