'use strict';

var sendMessage = $('#sendMessage');
var ul = $('ul');
var input = $('input');

// Automatically it will connect to the server that is serving
// this file or we can manually connect to `localhost:8080`
var socket = io.connect();

// Handle when new user connect to the chat app.
socket.on('newClient', function(onlineClients) {
  console.log('newClient', onlineClients);
  var html = '<div class="sidebar-header"><h3 style="color: #47dd47; margin-left: 10px">Online</h3>';

  for(var client in onlineClients) {
    html += '<a href="#" style="cursor: pointer">' + onlineClients[client] + '</a>';
  }
  html += '</div>';

  $('.sidenav').html('');
  $('.sidenav').append(html);
});

function appendMessage() {
  var text = input.val();
  var li = '<li>' + text + '</li>';
  input.val('');
  ul.append(li);
  socket.emit('message', text);
}

sendMessage.on('click', appendMessage);
input.keypress(function(evt) {
  if(evt.which === 13) {
    appendMessage();
  }
});
