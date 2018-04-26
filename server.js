'use strict';
/**
 * Steps for the server.
 *
 * Whenever a user connects send index file for '/' path.
 * This page(index) will ask for a username to connect.
 * Send this `username` to the server using socket.io
 * This useranme will be store in the server and shown to other users to connect.
 * Save above user in usersArray.
 * Send back this usersArray to the user so that it can also connect to rest.
 *
 ************************************************************
 *
 * Events handled by the server:
 * connection
 * disconnect
 * message
 */


/**
 * Steps to perform by the signaling server.
 *
 * Whenever a new user want to connect to a specific user, create a new room for both.
 * Room can be created using concatinating the username of both users.
 * To create a room both users should be agreed to have a personal chat.
 * When user1 wants to connect to user2, send message to user2 for his confirmation.
 * After confirmation room can be created.
 *
 **********************************************************
 *
 * `message` events can carries the information about the users.
 * This events contains the information of the ICE candidate(`peerConne.onicecandidate`).
 * Send it to the other user in the room by broadcasting into the room.
 */


var express = require('express');
var path = require('path');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static('./client/'));

app.get('/', function(req, res) {
  res.sendFile(path.resolve(__dirname, './client/index.html'));
});

io.on('connection', function (socket) {
  socket.on('message', function(message) {
    console.log('Peer says:', message);
    // Use: socket.to('roomName').emit('message', message);
    // To emit the message in particulat room.
    socket.emit('message', message);
  });

  socket.on('disconnect', function(reason) {
    console.log('Peer disconnects', reason);
  });
});

server.listen(8080, function() {
  console.log('App is listening on port', 8080);
});
