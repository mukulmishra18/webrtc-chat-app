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
var isInitator;
var configuration = null;
var peerConn;
var dataChannel;

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
    //Remove previous chat if peer respond accept to new chat request.
    $('ul').html('');
    socket.emit('connectResponse', { response: 'accept', id: id });
  }
}

/**
 * Create peer connection by sending connection information using singnaling server.
 * @params { isInitiator } Specify if the current peer is initiator of the chat.
 * @params { config } Configuration object for STUN server.
 * @params { id } Id of the other peer.
 */
function createPeerConnection(isInitiator, config, id) {
  console.log('Creating Peer connection as initiator?', isInitiator, 'config:',
              config);
  peerConn = new RTCPeerConnection(config);

  // send any ice candidates to the other peer
  peerConn.onicecandidate = function(event) {
    console.log('icecandidate event:', event);
    if (event.candidate) {
      // Send  message to the other peer about the connection information.
      socket.emit('message', id, {
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log('End of candidates.');
    }
  };

  // Check if the current peer is initiator of the chat session.
  if (isInitiator) {
    console.log('Creating Data Channel');
    dataChannel = peerConn.createDataChannel('photos');
    onDataChannelCreated(dataChannel);

    console.log('Creating an offer');
    peerConn.createOffer(function (desc) {
      onLocalSessionCreated(desc, id);
    }, logError);
  } else {
    peerConn.ondatachannel = function(event) {
      console.log('ondatachannel:', event.channel);
      dataChannel = event.channel;
      onDataChannelCreated(dataChannel);
    };
  }
}

/**
 * Local session handler.
 * @params { desc } local session descriptor.
 * @params { id } Id of the other peer.
 */
function onLocalSessionCreated(desc, id) {
  console.log('local session created:', desc, id);
  peerConn.setLocalDescription(desc, function() {
    console.log('sending local desc:', peerConn.localDescription);
    socket.emit('message', id, peerConn.localDescription);
  }, logError);
}

/**
 * Data channel handler.
 * @params { channel } Newely created data channel.
 */
function onDataChannelCreated(channel) {
  console.log('onDataChannelCreated:', channel);

  channel.onopen = function() {
    console.log('CHANNEL opened!!!');
  };

  channel.onclose = function () {
    console.log('Channel closed.');
  }

  // Handle new incoming message by appending it to the chat box.
  channel.onmessage = function (message) {
    console.log('message', message);
    var li = '<li style="width: 100%"><div style="margin-left: -4%" class="macro flex-container">' + 
      '<p class="flex-text message">' + message.data + '</p>' + '</li>';

    $('ul').append(li);
  }
}

/**
 * Signaling server message handler.
 * @params { id } Id of the other peer.
 * @params { message } Message from the signaling server.
 */
function signalingMessageCallback(id, message) {
  console.log(message);
  if (message.type === 'offer') {
    console.log('Got offer. Sending answer to peer.');
    peerConn.setRemoteDescription(new RTCSessionDescription(message),
      function() {}, logError);
    peerConn.createAnswer(function (desc) {
      onLocalSessionCreated(desc, id);
    }, logError);

  } else if (message.type === 'answer') {
    console.log('Got answer.');
    peerConn.setRemoteDescription(new RTCSessionDescription(message),
      function() {}, logError);

  } else if (message.type === 'candidate') {
    peerConn.addIceCandidate(new RTCIceCandidate({
      candidate: message.candidate
    }));

  }
}

/**
 * Error logging helper.
 * @params { err } Error that needs to be logged.
 */
function logError(err) {
  if (!err) return;
  if (typeof err === 'string') {
    console.warn(err);
  } else {
    console.warn(err.toString(), err);
  }
}

/**
 * Event handler for new connection request.
 * @params {id} ID of the peer wants to connect.
 * @params {name} name of the peer wants to connect.
 */ 
socket.on('connectRequest', function(id, name) {
  // Remove previously attached `click` event from buttons.
  // Each time `connectRequest` event fire, it attach `click` event
  // to the accept/decline button and that will keep growing if we do
  // not unload it and can create problems.
  isInitator = false;
  $('.btn').off('click');
  modal.style.display = 'block';
  document.querySelector('#modal-text').textContent = name + ' wants to connect!';

  createPeerConnection(isInitator, configuration, id);
  $('.btn').on('click', function() {
    sendConnectResponse(this, id);
  });
});


/**
 * Connection response from other peer.
 * @params { id } Id of the other peer.
 * @params { response } Response for connection request.
 */
socket.on('connectResponse', function(id, response, name) {
  isInitator = true;
  console.log('Connection resposen from ' + id + ' is ' + response);
  if (response === 'accept') {
    window.alert('You can chat with ' + name);

    // Prepare the chat box for new conversation(clear previous chat).
    $('ul').html('');
    createPeerConnection(isInitator, configuration, id);
  } else {
    window.alert('Peer with id ' + name + ' respond with ' + response);
  }
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

/**
 * `message` event handler for connection information exchange.
 */
socket.on('message', function(id, message) {
  console.log('Client received message:', message);
  signalingMessageCallback(id, message);
});

// Append message send by the peer in the chat box.
function appendMessage() {
  var text = input.val();
  var li = '<li style="width: 100%; margin-right: 14%; text-align: end"><div style="margin-left: 18%" class="macro flex-container">' + 
      '<p class="flex-text message">' + text + '</p>' + '</li>';

  input.val('');
  $('ul').append(li);

  if (dataChannel) {
    dataChannel.send(text);
  }
}

// Append message when `enter` key press or send button clicked.
sendMessage.on('click', appendMessage);
input.keypress(function(evt) {
  if(evt.which === 13) {
    appendMessage();
  }
});
