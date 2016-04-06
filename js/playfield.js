/*jslint browser: true*/ /*global  $*/      // Ref. http://stackoverflow.com/questions/4071467/is-it-possible-to-validate-my-jquery-javascript-with-jslint 
$(document).ready(function () {

    /* Frames Per Second window - http://www.html5gamedevs.com/topic/1828-how-to-calculate-fps-in-plain-javascript/ */
    var fps = {
        startTime : 0,
        frameNumber : 0,
        getFPS : function () {
            this.frameNumber = this.frameNumber + 1;
            var d = new Date().getTime(),
                currentTime = (d - this.startTime) / 1000,
                result = Math.floor((this.frameNumber / currentTime));
            if (currentTime > 1) {
                this.startTime = new Date().getTime();
                this.frameNumber = 0;
            }
            if (result < 30) { console.log('FPS slowing to ' + result); } /* console error message */
            return result;
        }
    };
    var f = document.querySelector("#fps");
    function gameLoop() {
        setTimeout(gameLoop, 1000 / 60);
        f.innerHTML = fps.getFPS();
    }
    window.onload = gameLoop;



    var browserWidth = $(window).width();  // Ref. http://stackoverflow.com/questions/1038727/how-to-get-browser-width-using-javascript-code 
    // change the width element in the #world
    var adjustWorldXScale = browserWidth / 1280; // Assumes our world image is 1280px * 4 wide.
    var adjustWorldXWidth = (browserWidth / 1280) * 1280;  // Assumes our world image is 1280px * 4 wide.
    $("#world").css("width", adjustWorldXWidth + 'px');  // Adjusts the image's width to the actual browser's width

    $("#world").css("background-size", browserWidth * 4 + 'px auto'); // w x h.  This stretches the x to the width of the user's browser
    // or
    // THIS COULD BE A SOLUTION IF THERE'S A PROBLEM: $("#world").css("background-size", adjustWorldXWidth * 4 + 'px auto'); // w x h

    var sessionId = "fail"; // Not logged in
    //alert('sessionId=' + sessionId);

    var compass = 0,
        x = 0,  // @TODO:  Need to really download their current x coordinate upon login
        y = 0;  // @TODO:  Need to really download their current y coordinate upon login

  var socket = io();  // used for chat, login, etc.


  // These two lines disable the browser's scrollbars
  document.documentElement.style.overflow = 'hidden';
  document.body.scroll = "no";


  $('#bank').hide();
  $('#bank').resizable();
  $('#bank').draggable();

  $('#chat').hide();
  $('#chat').resizable();
  $('#chat').draggable();

  $('#characterSelect').hide();
  $('#characterSelect').draggable();

  $('#characterSelect').on("characterSelect.load", function(event) {
//alert('characterSelect dot load i got asked to load this');
//alert('session id = ' + window.sessionId + ' sessionId=' + $('#debug').find('div#sessionId').text() );
    $('#characterSelect').fadeIn(3000);
    // Show how many characters i have
    if ( $('#debug').find('div#sessionId').text() == "" ) {  // IMPORTANT FIX:
                                                             // To prevent multiple listings of your character list because two browsers are open,
                                                             // if I came from the login screen (ie. this value is blank), then request the character list
                                                             // @TODO:  Need to make sure the #debug field stays intact or is moved to another location
                                                             // @TODO:  Still a bug when two browsers login at the exact same time, maybe the client show 
                                                             // send a random partial sessionId upon login
        socket.emit('reqCharacterList', window.sessionId);
    };
  });

  socket.on('resCharacterList', function(msg) {
    if (window.sessionId != undefined) {
    console.log('resCharacterList=' + msg);
//    alert('foobar243tgavmsg=' + msg);
//    alert('session id2 = ' + window.sessionId);
        $('.characterSelectItem').replaceWith(msg);
        //alert('ready');
        $('.characterSelectItem').click( function() {
          var playerName = $(this).closest($('.characterSelectItem')).find('span.name').text();
          window.charId = $(this).closest($('.characterSelectItem')).find('span.charId').text();  // This is a global variable
          socket.emit('reqSpeakMyName', window.sessionId, window.charId);
          $('#debug').append('<div id=\"charId\">' + charId + '</div><div id=\"playerName\">' + playerName + '</div><div id=\"sessionId\">' + window.sessionId + '</div>');
          $('#playfield').trigger('beamMeUp');  // User chose the character to load by clicking on it
        });
     };
  });




  $('#debug').hide();
  $('#debug').draggable();

  $('#email').hide();
  $('#email').draggable();

  $('#interactive').hide();


  $('#inventory').hide();
  $('#inventory').draggable();
  ////$('#contents_inventory').draggable();
  //$('.each_inventory').draggable();
  $('.each_inventory').draggable({containment: "#inventory", snap:".contents_inventory", snapMode:"inner", snapTolerance:[36], grid:[36,36]});  // 36 = 32 + 2px margins

  $('#landscape').hide();

  $('#login').show();
  $('#login').draggable();

  $('#map').hide();
  //$('#map').draggable();

  $('#mapCover').show();
  $('#mapCover').draggable();
  $('#mapCover').resizable();

  $('#paperdoll').hide();
  $('#paperdoll').draggable();
  
  $('#skill').hide();
  $('#skill').draggable();
  $('#skillExit').click(function(event) {
      $('#skill').toggle();
  });
  $('#playfield').on("beamMeUp", function(event) {
    //alert('beamMeUp,Scotty!' + $('.characterSelectItem').text());
    $('#characterSelect').hide();

    // 20150225: Since we are about to show the world to the user, we need to load the monsters.
    // We need to send the zone the character is in, plus the character's x,y - DO WE LEGITIMATELY KNOW THIS HERE?
    socket.emit('getMonsters', null); // @TODO: NEED TO SEND VALUES HERE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!



    // Show the world to the user
    $('#landscape').show();
    $('#world').show();
    $('textarea#menu').focus(); // Set the focus so the user can start running
    //alert('still here');
    // Play the audio
    $('#audio').replaceWith("\
      <div id=audio>\
        <audio autoplay=autoplay>\
          <source src=audio/crowd.wav type=audio/wav>\
        </audio>\
      </div>");
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
    if(msg != "fail") {
      // Then, I passed the login process
      window.sessionId = msg; // This is a global variable

      //alert(window.sessionId);
      //$('#login_err').html('SUCCESS!');

      // Hide the login window
      $('#login').hide();

      // Show Help and Character Select pages
      $('#debug').fadeIn(3000);

      // Load the character select page
      $('#characterSelect').trigger('characterSelect.load');
    } else {
      // msg=='fail'
      // show the login window
      $('#login').show();
      $('#login_err').html('Incorrect Email and/or Password');
    }
  });

  // Received a log out message from the server.  Therefore, I need to test
  // and see if the sessionId is legit because of it.
  socket.on('resLogMeOut', function(msg) {
    // alert('window.sessionId='+window.sessionId+' msg='+msg);
    if (window.sessionId != undefined && window.sessionId != msg) {
      // alert('hereiam msg=' + msg);
      // If we needed to pull the document from the webserver again (such as 
      // where the document contents change dynamically), we would pass the
      // argument as 'true'.
      window.location.reload(true);
    }
  });

  // chat functionality
  socket.on('chat message', function(msg) {
    //$('#messages').append($('<li>').text(msg));
    $('#messages').append(msg + '<br>');
  });

  // Response from server on Turn Right request
  socket.on('resTurnRight', function(msg) {
    console.log(msg);
    var obj = $.parseJSON(msg);
    $('#compass').html('zoneID:' + obj.zoneId + ' &nbsp; x:' + obj.x + ' &nbsp;  y:' + obj.y + ' &nbsp;  z:' + obj.z + ' &nbsp; c:' + obj.c);
  });

  // Response from server on Turn Left request
  socket.on('resTurnLeft', function(msg) {
    console.log(msg);
    var obj = $.parseJSON(msg);
    $('#compass').html('zoneID:' + obj.zoneId + ' &nbsp; x:' + obj.x + ' &nbsp;  y:' + obj.y + ' &nbsp;  z:' + obj.z + ' &nbsp; c:' + obj.c);
  });

  // Response from server on Walk Forward request
  socket.on('resWalkForward', function(msg) {
    console.log(msg);
    var obj = $.parseJSON(msg);
    $('#compass').html('zoneID:' + obj.zoneId + ' &nbsp; x:' + obj.x + ' &nbsp;  y:' + obj.y + ' &nbsp;  z:' + obj.z + ' &nbsp; c:' + obj.c);
  });

  // Response from server on Walk Forward request
  socket.on('resWalkBackward', function(msg) {
    console.log(msg);
    var obj = $.parseJSON(msg);
    $('#compass').html('zoneID:' + obj.zoneId + ' &nbsp; x:' + obj.x + ' &nbsp;  y:' + obj.y + ' &nbsp;  z:' + obj.z + ' &nbsp; c:' + obj.c);
  });

  // Inventory 
  socket.on('resInventory', function(msg) {
    console.log(msg);
  });



  /////////////////////////////////////////////////////////////////////////////////////////////////
  // KEYBOARD EVENTS - KEYPRESS - These are events where the user is pressing and holding the key
  //                              For example, when turning around, you want the compass to keep moving,
  //                              and NOT force the user to press the key to turn every time.
  $('textarea#menu').keypress(function(event) {
    var code = event.keyCode || event.which;

    if(code == 68 || code == 100) {  // d or D key pressed
      //console.log(window.sessionId);
      // turn right
      socket.emit('turn right', window.sessionId);
      // @TODO: We're using a fixed screen width of 1280px during testing.  THIS NEEDS TO BE BASED ON USER'S SCREEN WIDTH, NOT A FIXED 1280px
      // @TODO: And, we've got 90 degrees to get to the next full screen of the background image
      // @TODO: And, since each press of the d key is 45 degrees for now...
      // @TODO: And, since moving to the right, means a negative shift in background position....
      // @TODO: We need to shift things by (45/90)*1280*-1= -640px
        var backgroundPos = Number($('#world').css('backgroundPositionX').replace(/[^0-9.-]/g, '')); // Gets x coord of current background-position in css, AND it gets rid of the 'px' letters.  Keeps the decimal point in the number now.
        //backgroundPos = backgroundPos - 640;  // Old way
        backgroundPos = Number(backgroundPos) - Number(browserWidth / 2);
        $('#world').css('backgroundPositionX', backgroundPos + 'px');
    }

    if(code == 65 || code == 97) {  // a or A key pressed
      // turn left
      socket.emit('turn left', window.sessionId);
      // @TODO: We're using a fixed screen width of 1280px during testing.  THIS NEEDS TO BE BASED ON USER'S SCREEN WIDTH, NOT A FIXED 1280px
      // @TODO: And, we've got 90 degrees to get to the previous full screen of the background image
      // @TODO: And, since each press of the a key is -45 degrees for now...
      // @TODO: And, since moving to the left, means a positive shift in background position....
      // @TODO: We need to shift things by (45/90)*1280*+1= +640px
      var backgroundPos = Number($('#world').css('backgroundPositionX').replace(/[^0-9.-]/g, '')); // Gets x coord of current background-position in css, AND it gets rid of the 'px' letters.  Keeps the decimal point in the number now.
      //backgroundPos = backgroundPos + 640; // Old way
      backgroundPos = Number(backgroundPos) + Number(browserWidth / 2);
      //alert(backgroundPos);
      $('#world').css('backgroundPositionX', backgroundPos + 'px');
    }

    if(code == 87 || code == 119) {  // w or W key pressed
      // walk forward
      socket.emit('walk forward', window.sessionId );
      //map.draggable();// have to do this again, because the class got wiped during the rewrite
    }

    if(code == 88 || code == 120) {  // x or X key pressed
      // walk backward
      socket.emit('walk backward', window.sessionId );
      //map.draggable();// have to do this again, because the class got wiped during the rewrite
    }


  });
  

  /////////////////////////////////////////////////////////////////////////////////////////////////
  // KEYBOARD EVENTS - KEYUP
  $('textarea#menu').keyup(function(event) {
    var code = event.keyCode || event.which;


    if(code == 66 || code == 98) {  // b or B key pressed
      $("#bank").toggle();  // simply toggles the visibility of the element
    }

    if(code == 67 || code == 99) {  // c or C key pressed
      $("#chat").toggle();  // simply toggles the visibility of the element
    }

    if(code == 69 || code == 101) {  // e or E key pressed
      $("#email").toggle();
    }

    if(code == 70 || code == 102) {  // f or F key pressed
      $("#interactive").toggle();
      $('#monsterDamageNumber').hide();
      socket.emit('reqInteractive', window.sessionId );
    }

    if(code == 73 || code == 105) {  // i or I key pressed
      socket.emit('reqInventory',  window.sessionId );
      $("#inventory").toggle();
    }
    
    if(code == 75 || code == 107) {  // k or K key pressed
      socket.emit('reqSkills',  window.sessionId );
      $("#skill").toggle();
    }

// Disabled 'l' key because the login window appears upon start and is turned off after successful login
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
      socket.emit('reqDrawMap', window.sessionId );
      //map.draggable();// have to do this again, because the class got wiped during the rewrite
    }

    if(code == 88 || code == 120) {  // x or X key pressed
      // walk backward
      socket.emit('reqDrawMap', window.sessionId );
      //map.draggable();// have to do this again, because the class got wiped during the rewrite
    }

    if(code == 49) {  // 1 key pressed
      //  @TODO: ATTACK EVERYTHING IN RANGE!
      //sample var postData = { "email": $('#login_email').val(), "password" : $('#login_password').val() }
      //var postData = { "x": x, "y" : y }
      //socket.emit('reqAttack', JSON.stringify(postData) );
      socket.emit('reqAttack',  window.sessionId );
      $('#audio').replaceWith("\
        <div id=audio>\
          <audio autoplay=autoplay>\
            <source src=audio/pew.wav type=audio/wav>\
          </audio>\
          <audio autoplay=autoplay>\
            <source src=audio/crowd.wav type=audio/wav>\
          </audio>\
        </div>");
    }

    $('textarea#menu').val(''); // flush
  });




  /////////////////////////////////////////////////////////////////////////////
  // MOUSE EVENTS
  $('.each_inventory').dblclick(function(event) {
    //console.log(this);
    alert($(this).data("itemid"));
    //@todo socket.emit('consume', window.sessionId, $(this).data("itemid"));
  });


  /////////////////////////////////////////////////////////////////////////////
  // OTHER SOCKET EVENTS


  socket.on('hide interactive', function(msg) {
    $("#interactive").hide();
  });

  socket.on('show interactive', function(msg) {
    $('#interactive').replaceWith("<div id=interactive>" + msg + "</div>");
    $("#interactive").show();
  });

  socket.on('resDrawMap', function(msg) {
      //console.log(msg);
      var obj = $.parseJSON(msg);
      // NOTE: This is a negative x position (denoted by -"+obj.x") and positive y position
      $('#map').replaceWith("<div id=map style=\"background-position-x:-"+obj.x+"px;background-position-y:"+obj.y+"px;\">" + obj.string + "</div>");
  });


  socket.on('audioPlay', function(msg) {
    console.log('audioPlay=' + msg);
//    alert(msg);
    $('#audio').replaceWith("\
      <div id=audio>\
        <audio autoplay=autoplay>\
          <source src=/audio/"+msg+" type=audio/wav>\
        </audio>\
      </div>");
  });

    socket.on('audioMonsterSFX', function(msg) {
        //alert(msg);
        var obj = $.parseJSON(msg);
        $('#audioMonsterSFX').replaceWith("\
          <div id=audioMonsterSFX>\
            <audio autoplay=autoplay>\
              <source src=/audio/"+obj.filename+" type="+obj.mimetype+">\
            </audio>\
        </div>");
    });

  socket.on('audioSoundtrack', function(msg) {
    console.log('audioSoundtrack=' + msg);
//    alert(msg);
    $('#audioSoundtrack').replaceWith("\
      <div id=audioSoundtrack>\
        <audio autoplay=autoplay>\
          <source src=/audio/"+msg+" type=audio/mp3>\
        </audio>\
      </div>");
  });

  socket.on('audioSystemMessage', function(msg) {
    console.log('audioSystemMessage=' + msg);
//    alert(msg);
    $('#audioSystemMessage').replaceWith("\
      <div id=audioSystemMessage>\
        <audio autoplay=autoplay>\
          <source src=/audio/"+msg+" type=audio/wav>\
        </audio>\
      </div>");
  });


    socket.on('monsterDamageNumber', function(msg) {
        $('#monsterDamageNumber').replaceWith("<div id=monsterDamageNumber style=\"display:inline\">"+msg+"</div>");
        $('#monsterDamageNumber').fadeOut(1000);
    });
    socket.on('monsterDamageNumberWipe', function(msg) {
        $('#monsterDamageNumber').replaceWith("<div id=\"monsterDamageNumber\" style=\"display:none\"></div>");
    });
    
    socket.on('monsterDraw', function(msg) {
        //alert(msg);
        var obj = $.parseJSON(msg);
        $('#monsters').replaceWith("<div id=monsters style=\"background: url('"+obj.filename+"') no-repeat;background-color:transparent;height:200;width:200;margin: 650 0 0 650;opacity:0.9;position:absolute;z-index:10;\"></div>");
    });
    socket.on('monsterWipe', function(msg) {
        $('#monsters').replaceWith("<div id=\"monsters\"></div>");
    });



});

function helloworld() {
  alert('hereiam');
}

function test2() {
  alert('test2');
}
