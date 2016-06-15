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




/** http://stackoverflow.com/questions/5129624/convert-js-date-time-to-mysql-datetime
 * You first need to create a formatting function to pad numbers to two digits…
 **/
function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}
/**
 * …and then create the method to output the date string as desired.
 * Some people hate using prototypes this way, but if you are going
 * to apply this to more than one Date object, having it as a prototype
 * makes sense.
 **/
Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};
Date.prototype.toTimeFormat = function() {
    return twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};
Date.prototype.toMinuteFormat = function() {
    return twoDigits(this.getUTCMinutes());
};











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

    // For Health Bars Only - This positions them on the screen
    var browserHeight = $(window).height(); // in pixels
    $("#healthBarBody").css("margin", browserHeight - 20 + 9 + 'px 0px 0px -9px');  // 9px border in Google Chrome by default.  Bar is 20px high and at the bottom of the screen.
    $("#healthBarArmor").css("margin", browserHeight - 40 + 9 + 'px 0px 0px -9px');
    $("#healthBarAura").css("margin", browserHeight - 60 + 9 + 'px 0px 0px -9px');

    $("#healthBarBody").hide();
    $("#healthBarArmor").hide();
    $("#healthBarAura").hide();

    // Set Audio Volumes
    //var aud = document.getElementById("audioSoundtrack");
    //aud.volume = 0.2;


    // Disable Scrollbars
    $("body").css("overflow", "hidden"); // This disables the browser's scrollbars
    //document.documentElement.style.overflow = 'hidden';  // These two lines also disable the browser's scrollbars
    //document.body.scroll = "no";


    socket.on('charHealthBarBody', function(msg) {
      var obj = $.parseJSON(msg).resCharHealthBarBodyCurrent;
      $("#healthBarBodyCurrent").css("width", obj[1] + '%'); // adjusts the green health bar
      $("#healthBarBodyCurrentNumber").replaceWith('<div id="healthBarBodyCurrentNumber">' + obj[0] + '</div>');
      console.log('message = ' + msg);
    });


// This sets the Session Id
socket.on('resSessionId', function(msg) {
    window.sessionId = msg;
    console.log('sessionId = ' + window.sessionId);
});
// This does special debugging from the server
socket.on('resDebug', function(msg) {
    console.log('resDebug= ' + msg);
});



  $('#alertFlash').hide();

  $('#bank').hide();
  $('#bank').resizable();
  $('#bank').draggable();
  $('#bankExit').click(function(event) {
      $('#bank').toggle();
  });

  $('#chat').hide();
  $('#chat').resizable();
  $('#chat').draggable();
//$('#messages').tabs(); //coming soon

  $('#crafting').hide();
  $('#crafting').draggable();
  $('#craftingExit').click(function(event) {
      $('#crafting').toggle();
  });

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
//    alert('msg=' + msg);
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

  $('#credits').hide();
  $('#credits').draggable();

  $('#deathmask').hide();
  $('#deathmaskResurrect').hide();

  $('#debug').hide();
  $('#debug').draggable();

  $('#email').hide();
  $('#email').draggable();

  $('#interactive').hide();


  $('#inventory').hide();
  $('#inventory').draggable();
  $('#inventoryExit').click(function(event) {
      $('#inventory').toggle();
  });

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

  $('#quest').hide();
  $('#quest').draggable();
  $('#questExit').click(function(event) {
      $('#quest').toggle();
  });

  
  $('#skill').hide();
  $('#skill').draggable();
  $('#skillExit').click(function(event) {
      $('#skill').toggle();
  });
  $('#playfield').on("beamMeUp", function(event) {
    // Load the character
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

    $("#healthBarBody").show();
    // TEMPORARILY DISABLED FOR NOW: $("#healthBarArmor").show();
    // TEMPORARILY DISABLED FOR NOW: $("#healthBarAura").show();
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
//20160607:  moved this line to socket on 'chat message'
//$('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
//$('#messages-2')[0].scrollTop = $('#messages-2')[0].scrollHeight;
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
    console.log('sessionId = ' + window.sessionId);
  });
  // login - receiving information from the server
  socket.on('login response', function(msg) {
    if(msg != "fail") {
      // Then, I passed the login process
      console.log('sessionId = ' + window.sessionId);
//      window.sessionId = msg; // This is a global variable
      console.log('sessionId = ' + window.sessionId);
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

  socket.on('heyAskForInventory', function(msg) {
      socket.emit('reqInventory', window.sessionId );
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
$('#messages').append('[' + new Date().toTimeFormat() + ']  ' + msg + '<br>');
//$('#messages-1').append('[' + new Date().toTimeFormat() + ']  ' + msg + '<br>');
//$('#messages-2').append('[' + new Date().toTimeFormat() + ']  ' + msg + '<br>');
//$('#messages-3').append('[' + new Date().toTimeFormat() + ']  ' + msg + '<br>');

//20160607:  added this:
$('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
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



  // Bank
  socket.on('resBankMyBackpack', function(msg) {
    console.log(msg);
    if (window.sessionId != undefined) {
        var obj = $.parseJSON(msg).resBankMyBackpack;
        var contents = "";
        for(var i=0; i<obj.length; i++) {
            contents = contents + "<div class='myBackpackItem ui-draggable ui-draggable-handle' data-itemId="+i+" data-backpackid="+obj[i].backpackId +" data-quantity="+obj[i].quantity +" title='"+obj[i].quantity+" "+obj[i].name+"' style='background:url(/images/items/"+obj[i].image+");height:32px;width:32px;z-index:90;'></div>";
        }
        $('#myBackpack').replaceWith("\
            <div id=myBackpack>\
                "+contents+"\
            </div>\
        ");
    };
    // Remember, when I move items into the bank, this needs to change...  maybe here or somewhere else...
    // 36 = 32 + 2px margins
    $('.myBackpackItem').draggable({containment: "#myBank", snap:".myBankItem", snapMode:"inner", snapTolerance:[36], grid:[36,36]}).dblclick(function(){
        alert('I clicked an item in the backpack');
    });  
  });

  socket.on('resBankMyBank', function(msg) {
    console.log(msg);
    if (window.sessionId != undefined) {
        var obj = $.parseJSON(msg).resBankMyBank;
        var contents = "";
        for(var i=0; i<obj.length; i++) {
            contents = contents + "<div class='myBankItem ui-draggable ui-draggable-handle' data-itemId="+i+" data-bankid="+obj[i].bankId +" data-quantity="+obj[i].quantity +" title='"+obj[i].quantity+" "+obj[i].name+"' style='background:url(/images/items/"+obj[i].image+");height:32px;width:32px;z-index:90;'></div>";
        }
        $('#myBank').replaceWith("\
            <div id=myBank>\
                "+contents+"\
            </div>\
        ");
    };
   // Remember, when I move items into the bank, this needs to change...  maybe here or somewhere else...
   // 36 = 32 + 2px margins
    $('.myBankItem').draggable({containment: "#myBackpack", snap:".myBackpackItem", snapMode:"inner", snapTolerance:[36], grid:[36,36]}).dblclick(function(){
        alert('I clicked an item in the bank');
    });
  });



  // Inventory 
  socket.on('resInventory', function(msg) {
    console.log(msg);
    if (window.sessionId != undefined) {
        var obj = $.parseJSON(msg).resInventory;
        var contents = "";
        for(var i=0; i<obj.length; i++) {
            contents = contents + "<div class='each_inventory ui-draggable ui-draggable-handle' data-id="+i+" data-backpackId="+obj[i].backpackId + " data-itemId="+obj[i].itemId +" data-itemTypeName="+obj[i].itemTypeName +" data-quantity="+obj[i].quantity +" title='"+obj[i].quantity+" "+obj[i].name+"' style='background:url(/images/items/"+obj[i].image+");height:32px;width:32px;z-index:90;'></div>";
        }
        $('#contents_inventory').replaceWith("\
            <div id=contents_inventory>\
                "+contents+"\
            </div>\
        ");
    };
    // Remember, when I move items into the bank, this needs to change...  maybe here or somewhere else...
    $('.each_inventory').draggable({
        containment: "#inventory", snap:".contents_inventory", snapMode:"inner", snapTolerance:[36], grid:[36,36]  
        // turned this off (note: the comments are legit)...
        //    });  // 36 = 32 + 2px margins
        // ... so i can I add doubleclick functionality by adding this...
    }).dblclick(function(){
      console.log(this);
      //alert($(this).data("itemid"));
      if( $(this).data("itemtypename") === "eat") {
          // this is something to eat
          alert("this is something we eat");
          socket.emit('reqInventoryEat', window.sessionId, $(this).data("backpackid"));  // only eat 1
      } else {
          alert("this is not something we eat");
      }
    });



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
      socket.emit('reqBank', window.sessionId );
    }

    if(code == 67 || code == 99) {  // c or C key pressed
      $("#chat").toggle();  // simply toggles the visibility of the element
    }

    if(code == 69 || code == 101) {  // e or E key pressed
      $("#email").toggle();
    }

    if(code == 70 || code == 102) {  // f or F key pressed
      $("#interactive").hide();
      $('#monsterDamageNumber').hide();
      socket.emit('reqInteractive', window.sessionId );
    }

    if(code == 73 || code == 105) {  // i or I key pressed
      socket.emit('reqInventory', window.sessionId );
      $("#inventory").toggle();
    }
    
    if(code == 75 || code == 107) {  // k or K key pressed
      socket.emit('reqSkills', window.sessionId );
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

    if(code == 81 || code == 113) {  // q or Q key pressed
      $("#quest").toggle();
    }

    if(code == 82 || code == 114) {  // r or R key pressed
      $("#crafting").toggle();
    }

    if(code == 84 || code == 116) {  // t or T key pressed
      $("#trade").toggle();
    }

    if(code == 85 || code == 117) {  // u or U key pressed
      $("#debug").toggle();
    }

    if(code == 87 || code == 119) {  // w or W key pressed
      // walk forward
if ( $('#debug').find('div#sessionId').text() !== window.sessionId ) {
    alert('session has changed.  You need to reload your browser because the server restarted or you lost connection to your socket.');
}

      socket.emit('reqDrawMap', window.sessionId );
      //map.draggable();// have to do this again, because the class got wiped during the rewrite
    }

    if(code == 88 || code == 120) {  // x or X key pressed
      // walk backward
      socket.emit('reqDrawMap', window.sessionId );
      //map.draggable();// have to do this again, because the class got wiped during the rewrite
    }

    if(code == 90 || code == 122) {  // z or Z key pressed
      $("#credits").toggle();
      socket.emit('reqCredits', window.sessionId );
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

  // This particular one was moved up higher, so search for .each_inventory
  //$(".each_inventory").mousedown(function() {
    //console.log(this);
    //alert($(this).data("itemid"));
    //alert("hi");
    //@todo socket.emit('consume', window.sessionId, $(this).data("itemid"));
  //});


  /////////////////////////////////////////////////////////////////////////////
  // OTHER SOCKET EVENTS


  socket.on('hide interactive', function() {
    $("#interactive").hide();
  });

  socket.on('show interactive', function(msg) {
    $('#interactive').replaceWith("<div id=interactive>" + msg + "</div>");
    $("#interactive").show();
  });

  socket.on('resCredits', function(msg) {
      $('#creditsContents').html(msg);
      $('#creditsExit').click(function(event) {
          $('#credits').hide();
      });
  });

  socket.on('deathmaskHide', function(msg) {
      $('#deathmask').hide();
      $('#deathmaskResurrect').hide();
  });

  socket.on('deathmaskShow', function(msg) {
      $('#deathmask').show();
      $('#deathmaskResurrect').text('RESURRECT').show();
  });

  socket.on('avatarFlipDead', function(msg) {
      $('#avatar').css({transform:'rotate(270deg)'});
  });

  socket.on('resAlertFlash', function(msg) {
      $('#alertFlash').hide().css({display:'none'});
      //$('#alertFlash').css({display:'none'});

      // 20160601:  While .text() will give the original desired effect of fade in-and-out, .replaceWith() will allow for faster updates (eg. fast attacks)
      // $('#alertFlash').text(msg);
      //$('#alertFlash').replaceWith("<div id=alert>Lorem ipsum dolor sit amet, consectetur adipiscing elit. In risus quam, pharetra...</div>");  // This was added to show character length limits on this type of #alertFlash
      $('#alertFlash').replaceWith("<div id=alertFlash>"+msg+"</div>");

      $('#alertFlash').fadeIn(1);  // We don't want the original desired effect, hence 1 to show it has zero effect
      $('#alertFlash').delay(1500);
      $('#alertFlash').fadeOut(1500);
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
// OLD WAY:
//        var obj = $.parseJSON(msg);
//        $('#audioMonsterSFX').replaceWith("\
//          <div id=audioMonsterSFX>\
//            <audio autoplay=autoplay>\
//              <source src=/audio/"+obj.filename+" type="+obj.mimetype+">\
//            </audio>\
//        </div>");
// NEW WAY:
        var obj = $.parseJSON(msg).monsterInfo;
        for(var i=0; i<obj.length; i++) {
            $('#audioMonsterSFX').replaceWith("\
              <div id=audioMonsterSFX>\
                <audio autoplay=autoplay>\
                  <source src=/audio/"+obj[i].audioFilename+" type="+obj[i].audioMimeType+">\
                </audio>\
            </div>");
        }
    });

  socket.on('audioSoundtrack', function(msg) {
    console.log('audioSoundtrack=' + msg);
//    alert(msg);
    $('#audioSoundtrack').replaceWith("\
      <div id=audioSoundtrack volume=0.2>\
        <audio autoplay=autoplay volume=0.2>\
          <source src=/audio/"+msg+" type=audio/mp3>\
        </audio>\
      </div>");
    $('#audioSoundtrack').volume = 0.2;
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

  // This is not used right now, but a different implementation...
  // ...is used in this script for CSS3 RAIN EFFECT:
  socket.on('audioWeather', function(msg) {
    console.log('audioWeather=' + msg);
//    alert(msg);
    $('#audioWeather').replaceWith("\
      <div id=audioWeather>\
        <audio autoplay=autoplay>\
          <source src=/audio/weather/"+msg+" type=audio/wav>\
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
        var obj = $.parseJSON(msg).monsterInfo;
        for(var i=0; i<obj.length; i++) {
            $('#monsters').replaceWith("<div id=monsters style=\"background: url('"+obj[i].image+"') no-repeat;background-color:transparent;height:200;width:200;margin: 650 0 0 650;opacity:0.9;position:absolute;z-index:10;\"><div id=monsterName>"+obj[i].name+"</div></div>");
        }
    });
    socket.on('monsterWipe', function(msg) {
        $('#monsters').replaceWith("<div id=\"monsters\"></div>");
    });










// START OF: CSS3 RAIN EFFECT ( Ref. https://codepen.io/alemesre/pen/hAxGg )
// function to generate a random number range.
function randRange( minNum, maxNum) {
  return (Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum);
}
// number of drops created.
//var nbDrop = 858; 
var nbDrop = randRange(100,858);
// function to generate drops
function createRain() {
	for( i=1;i<nbDrop;i++) {
	var dropLeft = randRange(0,1600);
	var dropTop = randRange(-1000,1400);
	$('.rain').append('<div class="drop" id="drop'+i+'"></div>');
	$('#drop'+i).css('left',dropLeft);
	$('#drop'+i).css('top',dropTop);
	}
}
// Make it rain
setInterval(function() {
  if (
  new Date().toMinuteFormat() === '09'
    || new Date().toMinuteFormat() === '14'
    || new Date().toMinuteFormat() === '24'
    || new Date().toMinuteFormat() === '34'
    || new Date().toMinuteFormat() === '44'
    || new Date().toMinuteFormat() === '54'
  ) {
    // http://freesound.org/people/barkenov/sounds/255900/ 
    // Since I can't use sockets within the same page, I'm creating the weather track here, based on time.  Can we refactor this in the future to be better?
    $('#audioWeather').replaceWith("\
      <div id=audioWeather>\
        <audio autoplay=autoplay>\
          <source src=/audio/weather/255900__barkenov__hard-rain.wav type=audio/wav>\
        </audio>\
      </div>");  // NOTE: the visuals show for 1 minute... the audio plays for 1 minute 4 seconds (length of audio track), hence why audio plays after rain stops
    $('.rain').show();
    createRain();
  } else {
    $('.rain').hide();
  }
  console.log('Minutes Past The Hour = ' + new Date().toMinuteFormat() );
}, 60 * 1000); // 60 * 1000 milsec = 1 minute // checks once a minute to see if this is the correct rain minute
// END OF:  CSS3 RAIN EFFECT



});

function helloworld() {
  alert('hereiam');
}

function test2() {
  alert('test2');
}
