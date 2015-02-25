$(document).ready(function() {

  var compass = 0;
  var x = 0;  // @TODO:  Need to really download their current x coordinate upon login
  var y = 0;  // @TODO:  Need to really download their current y coordinate upon login

  var socket = io();  // used for chat, login, etc.

$('#bkgd').show();

  $('#bank').hide();
  $('#bank').draggable();

  $('#chat').hide();
  $('#chat').draggable();

  $('#characterSelect').hide();
  $('#characterSelect').draggable();

  $('#characterSelect').on("characterSelect.load", function(event) {
    $('#characterSelect').fadeIn(3000);
    // @TODO: How many characters do i have?
    // @TODO: Show characters
    $('.characterSelectItem').replaceWith("\
      <div class=\"characterSelectItem\"><span class=\"name\">Character One</span></div>\
      <div class=\"characterSelectItem\"><span class=\"name\">Character Two</span></div>\
      <div class=\"characterSelectItem\"><span class=\"name\">Character Three</span></div>\
      <div class=\"characterSelectItem\"><span class=\"name\">Character Four</span></div>\
      <div class=\"characterSelectItem\"><span class=\"name\">Character Five</span></div>\
    ");
    // @TODO: Allow me to select the one I want to play, or go to character creation page
    
    // Show this AFTER the user chooses the character
    $('.characterSelectItem').click( function() {
      var playerName = $(this).closest($('.characterSelectItem')).find('span.name').text();
      $('#debug').append('<div id=\"playerName\">' + playerName + '</div>');
      $('#playfield').trigger('beamMeUp');  // load the character
    });
  });

  $('#debug').hide();
  $('#debug').draggable();

  $('#email').hide();
  $('#email').draggable();

  $('#inventory').hide();
  $('#inventory').draggable();
  //$('#contents_inventory').draggable();
  $('.each_inventory').draggable();

  $('#login').show();
  $('#login').draggable();

  $('#map').hide();
  $('#map').draggable();

  $('#paperdoll').hide();
  $('#paperdoll').draggable();

  $('#playfield').on("beamMeUp", function(event) {
    //alert('beamMeUp,Scotty!' + $('.characterSelectItem').text());
    $('#characterSelect').hide();
    $('#world').show();
  });

  $('#trade').hide();
  $('#trade').draggable();

  $('#world').hide();
  $('#world').draggable();

  // chat
  $('input#message').keyup(function(event) {
    var socket = io();
    var code = event.keyCode || event.which;
    if(code == 13) { // enter key
      socket.emit('chat message', '[' + $('#playerName').text() + '] ' + $('#message').val());
      $('#message').val('');  // clear out the data entry field
      $('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
    }
  })
  .focus();

  // login
  $('input#login_email').click(function(event) {
    // when user clicks in the email box, we want to hide any potential error message
    // because the user is fixing the problem
    $('#login_err').html('');
  });
  // login
  $('input#login_password').click(function(event) {
    // when user clicks in the password field, we want to hide any potential error message
    // because the user is fixing the problem
    $('#login_err').html('');
  });
  // login - sending information to the server
  $('#login_button').click(function(event) {
    var postData = { "email": $('#login_email').val(), "password" : $('#login_password').val() }
    $('#login').hide();
    socket.emit('login', JSON.stringify(postData) );
  });
  // login - receiving information from the server
  socket.on('login response', function(msg) {
    if(msg == "pass") { 
      $('#login_err').html('SUCCESS!');
      // hide the login window
      $('#login').hide();
      // Show Help and Character Select pages
      $('#debug').fadeIn(3000);
      $('#characterSelect').trigger('characterSelect.load');  // load the character select page
    }
    if(msg == "fail") { 
      // show the login window
      $('#login').show();
      $('#login_err').html('Incorrect Email and/or Password');
    } 
  });

  // chat functionality
  socket.on('chat message', function(msg) {
    //$('#messages').append($('<li>').text(msg));
    $('#messages').append(msg + '<br>');
  });

  $('textarea#menu').keyup(function(event) {
    var code = event.keyCode || event.which;

    if(code == 65 || code == 97) {  // a or A key pressed
      // turn left
      compass = compass - 45;
      if(compass < 0) {
        compass = compass + 360;
      }
      socket.emit('turn left', compass);
      $('#compass').html('X:' + x + ' Y:' + y + ' C:' + compass);
    }

    if(code == 66 || code == 98) {  // b or B key pressed
      $("#bank").toggle();  // simply toggles the visibility of the element
    }

    if(code == 67 || code == 99) {  // c or C key pressed
      $("#chat").toggle();  // simply toggles the visibility of the element
    }

    if(code == 68 || code == 100) {  // d or D key pressed
      // turn right
      compass = compass + 45;
      if(compass >= 360) {
        compass = compass - 360;
      }
      socket.emit('turn right', compass);
      $('#compass').html('X:' + x + ' Y:' + y + ' C:' + compass);

      // @TODO: We're using a fixed screen width of 1280px during testing.  THIS NEEDS TO BE BASED ON USER'S SCREEN WIDTH, NOT A FIXED 1280px
      // @TODO: And, we've got 90 degrees to get to the next full screen of the background image
      // @TODO: And, since each press of the d key is 45 degrees for now...
      // @TODO: And, since moving to the right, means a negative shift in background position....
      // @TODO: We need to shift things by (45/90)*1280*-1= -640px
      var backgroundPos = $('#world').css('backgroundPositionX').replace(/[^0-9-]/g, ''); // Gets x coord of current background-position in css, AND it gets rid of the 'px' letters
      backgroundPos = backgroundPos - 640;
      //alert(backgroundPos);
      $('#world').css('backgroundPositionX', backgroundPos + 'px');

    }

    if(code == 69 || code == 101) {  // e or E key pressed
      $("#email").toggle();
    }

    if(code == 73 || code == 105) {  // i or I key pressed
      $("#inventory").toggle();
    }

//disabled
//    if(code == 76 || code == 108) {  // l or L key pressed
//      $("#login").toggle();
//    }

    if(code == 77 || code == 109) {  // m or M key pressed
      $("#map").toggle();
    }

    if(code == 80 || code == 112) {  // p or P key pressed
      $("#paperdoll").toggle();
    }

    if(code == 84 || code == 116) {  // t or T key pressed
      $("#trade").toggle();
    }

    if(code == 85 || code == 117) {  // u or U key pressed
      $("#debug").toggle();
    }

    if(code == 87 || code == 119) {  // w or W key pressed
      // walk forward
      if(compass < 90 || compass > 270) {
        y++;
      }
      if(compass > 90 && compass < 270) {
        y--;
      }
      if(compass > 0 && compass < 180) {
        x++;
      }
      if(compass > 180 && compass < 360) {
        x--;
      }
      var postData = [
        { "x": x, "y" : y }
      ]
      socket.emit('walk forward', JSON.stringify(postData) );
      $('#compass').html('X:' + x + ' Y:' + y + ' C:' + compass);
    }

    if(code == 88 || code == 120) {  // x or X key pressed
      // walk backward
      if(compass < 90 || compass > 270) {
        y--;
      }
      if(compass > 90 && compass < 270) {
        y++;
      }
      if(compass > 0 && compass < 180) {
        x--;
      }
      if(compass > 180 && compass < 360) {
        x++;
      }
      var postData = [
        { "x": x, "y" : y }
      ]
      socket.emit('walk backward', JSON.stringify(postData) );
      $('#compass').html('X:' + x + ' Y:' + y + ' C:' + compass);
    }

    $('textarea#menu').val(''); // flush
  });

});

function helloworld() {
  alert('hereiam');
}

function test2() {
  alert('test2');
}


