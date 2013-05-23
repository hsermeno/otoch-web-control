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

var fs = require('fs'),
	yaml = require('js-yaml'),
    q = require('q');

var configFilename = __dirname + '/config.yml';

module.exports = {
    config: null,
	cache: {},
    get: function() 
	{
        if (this.config === null)
            this._loadConfig();

        return this.config;
    },

	init: function()
	{
		// monitor config file changes
		fs.watchFile(configFilename, function(curr, prev){
			if (curr.mtime !== prev.mtime) {
                console.log('Reloading configuration file');
				this._loadConfig();
			}
		});
		return this._loadConfig();
	},

	_loadConfig: function()
	{
        var deferred = q.defer();
        
	    var that = this;
		fs.readFile(configFilename, 'utf8', function(err, data) {
			if (err) {
				throw err;
			}
			
			that.config = yaml.load(data);
			
            if (!that.config) console.log('ash!');
            
	        for (var controllerKey in that.config.controladores) {
	            for (var switchKey in that.config.controladores[controllerKey].switches) {
	                var switchNumber = that.config.controladores[controllerKey].switches[switchKey];
	                that.config.controladores[controllerKey].switches[switchNumber] = switchKey;
	            }
	        }

			// invalidate the command cache
			that.cache = {};
            
            deferred.resolve();
		});
        
        return deferred.promise;
	},

	translateControllerSwitch: function(controller, name, value) 
	{
        controller = this.getController(controller);
        
		if (typeof controller.switches[name] == "undefined")
			throw "No switch [" + controller + ":" + name + "] was found!!";
		
		var at = controller.switches[name];
		
		return String.fromCharCode('A'.charCodeAt(0) + at) + 
				(typeof value === 'undefined' ? '' : value == 'on' ? '1' : '0');
	},
	
	translateControllerCommand: function(controller, cmd, conversion)
	{
		// controller::command
		controller = this.getController(controller);
		
		if (!controller.cmd[cmd]) 
			throw "Command [" + sw + "] not found";
			
		conversion[controller.name] = (conversion[controller.name] || '') + controller.cmd[ cmd ];
	},
	
	_translate: function(cmd, conversion)
	{
		var parts = cmd.split(':');

		if (parts.length == 3) {
			// Controller-specific switch action or command
			if (!this.config.controladores[parts[0]]) 
				throw "Controller [" + parts[0] + "] not found.";
			
			if (parts[1] == '') {
				this.translateControllerCommand(parts[0], parts[2], conversion);
				
			} else {
				// controller:switch:state
				conversion[parts[0]] = (conversion[parts[0]] || '') + 
                      	   			   this.translateControllerSwitch(parts[0], parts[1], parts[2]);
			}
		} else if (parts.length == 2) {
			// global, composite switch action
			// switch:state
			this.translateGlobalSwitch(part[0], part[1], conversion);
		} else if (parts.length == 1) {
			// Global command
			this.translateGlobalCommand(cmd, conversion);
		}
	},
	
	translate: function(cmd, conversion)
	{
		if (this.getFromCache(cmd, conversion)) return;
		
		var toExecute = {};
		this._translate(cmd, toExecute);
		
		this.simpleExtend(conversion, toExecute);
		
		this.saveToCache(cmd, toExecute);
	},
	
	translateGlobalCommand: function(cmd, conversion)
	{
		if (!this.config.comandos[cmd])
			throw "Command [" + cmd + "] not found";

		var switches = this.config.comandos[cmd],
			that = this;

		switches.forEach(function(sw){
			that.translate(sw, conversion);
		});
	},
	
	translateGlobalSwitch: function(name, state, conversion)
	{
		if (!this.config.switches[ name ]) 
			throw "Switch [" + name + "] not found.";

		var value = state == 'on' ? '1' : '0',
		    that = this, 
			sw = this.config.switches[ name ];

		for (key in sw) {
			conversion[ key ] = (conversion[ key ] || '');
			
			sw[ key ].forEach( function(elem){
				conversion[ key ] += that.translateControllerSwitch(key, elem) + value;
			});
		}		
	},
	
	translateStatus: function(status, controller)
	{
	    controller = this.getController(controller);
		
		console.log('original status: ', status);
	    
	    var switches = {};
	    
	    for (var i = 0; i < status.length; i++) {
	        var c = parseInt(status.charAt(i));
	        if (controller.switches[i]) {
	            switches[controller.switches[i]] = c == 0 ? 'off' : 'on';
	        }
        }
        
        var stat = {};
        stat[controller.name] = {
            'switches': switches
        };
        
        return stat;
	},
	
	getController: function(name)
	{
	    if (typeof name !== 'string') return name;
	    	    
		if (!this.config.controladores[name])
			throw "Controller name [" + name + "] not found.";
			
		return this.config.controladores[name];
	},
	
	getFromCache: function(cmd, conversion)
	{
		if (this.cache[cmd]) {
			this.simpleExtend(conversion, this.cache[cmd]);
		}
	},
	
	saveToCache: function(cmd, conversion)
	{
		this.cache[cmd] = {};
		
		this.simpleExtend(this.cache[cmd], conversion);
	},
	
	simpleExtend: function(what, from)
	{
		for (key in from) {
		    if (!what[key]) what[key] = '';
		    
			what[key] += from[key];
		}
	}
};
