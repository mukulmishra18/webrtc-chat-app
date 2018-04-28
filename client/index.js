'use strict';

$('input').keypress(function(evt) {
  if(evt.which === 13) {
    var userName = $('input').val();
    $.ajax({
    	url: 'http://localhost:8080/chat',
      data: { username: userName }
    });
  }
});
