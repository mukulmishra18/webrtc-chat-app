var sendMessage = $('#sendMessage');
var ul = $('ul');
var input = $('input');

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
