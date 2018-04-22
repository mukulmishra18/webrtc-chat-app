var express = require('express');
var path = require('path');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static('./client/'));

app.get('/', function(req, res) {
  res.sendFile(path.resolve(__dirname, './client/index.html'));
});

server.listen(8080, function() {
  console.log('App is listening on port', 8080);
});
