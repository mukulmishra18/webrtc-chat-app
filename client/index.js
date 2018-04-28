'use strict';

input.keypress(function(evt) {
  if(evt.which === 13) {
    // Prevent default redirection and user jQuery Ajax.
    evt.preventDefault();
    var userName = $('input').val();

    $.ajax({
    	url: 'localhost:8080/chat',
      data: { username: userName }
    });
  }
});
