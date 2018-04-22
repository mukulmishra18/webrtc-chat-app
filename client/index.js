var sendMessage = $('#sendMessage');
var ul = $('ul');
var input = $('input');

// Automatically it will connect to the server that is serving
// this file or we can manually connect to `localhost:8080`
var socket = io.connect();

function appendMessage() {
  var li = '<li>' + input.val() + '</li>';
  input.val('');
  ul.append(li);
}

sendMessage.on('click', appendMessage);
input.keypress(function(evt) {
  if(evt.which === 13) {
    appendMessage();
  }
});
