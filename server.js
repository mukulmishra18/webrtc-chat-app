'use strict';

/**
 * Steps for the server.
 *
 * Whenever a user connects, send index file for '/' path.
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

/** 
 * Array to keep track of the online users.
 * `onlineClients = { id: name }` id and name of the online peers.
 * `onlineSockets = { id: name }` id and socket object of online peers.
 */

var onlineClients = {};
var onlineSockets = {};
var userName;

// Use client directory as static.
app.use(express.static('./client/'));

app.get('/', function(req, res) {
  res.sendFile(path.resolve(__dirname, './client/index.html'));
});

app.get('/chat', function(req, res) {
  // req.query = { username: 'man' };
  userName = req.query.username;
  res.sendFile(path.resolve(__dirname, './client/chat.html'))
});

io.on('connection', function (socket) {
  // Broadcast onlineClients array when new peer connects.
  // Every peer get this message and can update their online table.
  console.log('Peer connected', socket.id);
  onlineClients[socket.id] = userName;
  onlineSockets[socket.id] = socket;
  io.emit('newClient', onlineClients);

  // `message` event handler for chat.
  socket.on('message', function(id, message) {
    console.log('Peer says:', id, JSON.stringify(message));
    // Use: socket.to('roomName').emit('message', message);
    // To emit the message in particulat room.
    onlineSockets[id].emit('message', socket.id, message);
  });

  /**
   * `connectRequest` event handler.
   * Handles the event when a peer wants to connect to other peer.
   * This message is sent to the target peer to get it's permission
   * to setup message tunnel for chat.
   *
   * @params { id } ID of the target peer.
   */
  socket.on('connectRequest', function(id) {
    console.log('Peer with id ' + socket.id + ' wants to connect with ' + id);
    onlineSockets[id].emit('connectRequest', socket.id, onlineClients[socket.id]);
  });

  socket.on('connectResponse', function(message) {
    console.log('Connection response from peer with id ' + socket.id + ' is: ' + message.response);
    onlineSockets[message.id].emit('connectResponse', socket.id, message.response, onlineClients[socket.id]);
  });

  socket.on('disconnect', function(reason) {
    // Delete the current peer from online peer array and send update.
    delete onlineClients[socket.id];
    delete onlineSockets[socket.id];
    io.emit('newClient', onlineClients);
    console.log('Peer disconnects', reason);
  });

  socket.on('error', function(error) {
    console.log(error);
  });
});

server.listen(8000, function() {
  console.log('App is listening on port', 8000);
});
