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

var app = require("http").createServer(requestHandler),
    path = require("path"),
    fs = require('fs'),
    io = require('socket.io').listen(app),
    
    www_path = path.join(process.cwd(), '../public_html/'),
    controllers = require('./house-controllers'),
    cache = {},
    cliArgs = require('optimist').argv;

app.listen(8888);
io.sockets.on('connection', function(socket) {
    socket.on('do', function(data) {
        if (!controllers.execute(data.cmd, function(stat) {
            io.sockets.emit('status', stat);
        })) {
            socket.emit('error', data);
        }
    });    
});

function notFound(response, text) {
	response.writeHead(404, {"Content-Type": "text/plain"});
	response.write(text || "404 Not Found\n");
	response.end();
}

function requestHandler(request, response) {
	var uri = require('url').parse(request.url, true).pathname,
	    filename = path.join(www_path, uri);

	if (uri.indexOf('/do') == 0) {
		controllers.do(uri, function(stat) {
			io.sockets.emit('status', stat);
		});
		response.writeHead(200);
		response.end();
	}

    if (cliArgs.cache && cache[uri]) {
        console.log("Serving from Cache: " + uri);
        response.writeHead(200);
        response.write(cache[uri], "binary");
        response.end();
    }

	fs.exists(filename, function(exists) {
		if(!exists) {
		    notFound(response);
	      	return;
	    }

		if (fs.statSync(filename).isDirectory()) filename += '/index.html';

	    fs.readFile(filename, "binary", function(err, file) {
	      	if (err) {
	      	    notFound(response, err + "\n");
	        	return;
	      	}

	      	response.writeHead(200);
	      	response.write(file, "binary");
	      	response.end();
	      	
	      	if (cliArgs.cache) {
	      	    cache[uri] = file;
      	    }
	    });
	});
}

