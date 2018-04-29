'use strict';

var sendMessage = $('#sendMessage');
var ul = $('ul');
var input = $('input');

var modal = document.getElementById('myModal');
var btn = document.getElementById("myBtn");

// Automatically it will connect to the server that is serving
// this file or we can manually connect to `localhost:8080`
var socket = io.connect();
var requestClientId;

/**
 * Send connect request to target peer to establish message tunnel.
 * @params { id } ID of the target peer.
 */
function sendConnectRequest(id) {
  console.log(id, socket);
  socket.emit('connectRequest', id);
}

// Send connection response.
function sendConnectResponse(element, id) {
  var value = element.classList[1];
  modal.style.display = 'none';
  if (value === 'btn-danger') {
    socket.emit('connectResponse', { response: 'decline', id: id });
  } else {
    socket.emit('connectResponse', { response: 'accept', id: id });
  }
}

/**
 * Event handler for new connection request.
 * @params {id} ID of the peer wants to connect.
 * @params {name} name of the peer wants to connect.
 */ 
socket.on('connectRequest', function(id, name) {
  modal.style.display = 'block';
  document.querySelector('#modal-text').textContent = name + ' wants to connect!';

  $('.btn').on('click', function() {
    sendConnectResponse(this, id);
  });
});

// Handle when new user connect to the chat app.
socket.on('newClient', function(onlineClients) {
  console.log('newClient', onlineClients);
  var html = '<div class="sidebar-header"><h3 style="color: #47dd47; margin-left: 10px">Online</h3>';

  for(var client in onlineClients) {
    // Get the username of the current peer from URL.
    var username = window.location.search.split('username=')[1];
    if (onlineClients[client] !== username) {
      html += '<div style="cursor: pointer" onclick=sendConnectRequest(' + '\"' + client + '\"' + ')>' +
        onlineClients[client] + '</div>';
    }
  }

  html += '</div>';

  $('.sidenav').html('');
  $('.sidenav').append(html);
});

// Append message send by the peer in the chat box.
function appendMessage() {
  var text = input.val();
  var li = '<li>' + text + '</li>';
  input.val('');
  ul.append(li);
  socket.emit('message', text);
}

// Append message when `enter` key press or send button clicked.
sendMessage.on('click', appendMessage);
input.keypress(function(evt) {
  if(evt.which === 13) {
    appendMessage();
  }
});
