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

var socket = io.connect('/');

socket.on('connect', function(){
   socket.emit('do', {cmd: 'status'});
});

socket.on('status', function(status) {
    for (controllerKey in status) {
        var controllerSwitches = status[controllerKey].switches;
        
        for (switchKey in controllerSwitches) {
            $('select#switch-' + switchKey).val(controllerSwitches[switchKey]).slider('refresh');
        }
    }
    $.mobile.hidePageLoadingMsg();
});

socket.on('error', function(data) {
    alert('Error ejecutando el comando: ' + data.cmd);
    if (data.elem) {
        $('#' + data.elem.id).val(data.elem.oldValue);
    }
    $.mobile.hidePageLoadingMsg();
});

function doSwitch() {
    var $this = $(this);
            
    $.mobile.showPageLoadingMsg();
    
    socket.emit('do', {
        cmd: $this.attr('data-action') + ":" + $this.val(),
        elem: {
            id: $this.attr('id'),
            oldValue: $this.val()
        }
    });
}

function doCommand() {
    var $this = $(this);
            
    $.mobile.showPageLoadingMsg();
    
    socket.emit('do', {
        cmd: $this.attr('data-action'),
    });
}

$(document).ready(function(){
    $.mobile.defaultPageTransition = 'slide';
    $.mobile.page.prototype.options.backBtnText = 'Atras';

    $('select').slider();        
    $('select[data-role=slider]').change(doSwitch);
    $('#comandos a').click(doCommand);
});
