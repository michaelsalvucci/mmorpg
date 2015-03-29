var mysql = require('mysql');
//var jquery = require('jquery');

var express = require('express');
var app = express();
//var app = require('express')();  // can't use this shorthand because of /images/backgrounds below

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var onlineClients = {};
var http = require('http').Server(app);  // note: http is a node core module, so it does not have to be installed

// This creates a pool we can use to mimic a persistent connection
var pool = mysql.createPool({connectionLimit:250, host:"127.0.0.1", user:"root", password:"", database:"mmorpg", multipleStatements:true});

var util = require('util');  // useful for debugging

// 3 lines required for executing a command line (required for speech synthesis)
var sys = require('sys');
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }

var port = 1337;
var ip = "192.168.0.52";
//server.listen(port, ip);

var THREE = require('three');

//var socket = require('socket.io-client')(ip);
var io = require('socket.io')(http);

app.get('/vendor/jquery/dist/jquery.min.js', function (req, res) {res.sendFile(__dirname + "/vendor/jquery/dist/jquery.min.js");});
app.get('/vendor/jquery/dist/jquery.min.map', function (req, res) {res.sendFile(__dirname + "/vendor/jquery/dist/jquery.min.map");});
app.get('/node_modules/socket.io-client/socket.io.js', function (req, res) {res.sendFile(__dirname + "/node_modules/socket.io-client/socket.io.js");});
app.get('/node_modules/three/three.min.js', function (req, res) {res.sendFile(__dirname + "/node_modules/three/three.min.js");});


//var playfield = require("./js/playfield.js");
app.get('/js/playfield.js', function (req, res) {res.sendFile(__dirname + "/js/playfield.js");});
app.get('/css/style.css', function (req, res) {res.sendFile(__dirname + "/css/style.css");});

app.use('/images/backgrounds', express.static(__dirname + "/images/backgrounds"));
app.use('/images', express.static(__dirname + "/images"));
app.use('/audio/dynamic', express.static(__dirname + "/audio/dynamic")); // allow all audio/dynamic files to be served
app.use('/audio', express.static(__dirname + "/audio")); // allow all audio files to be served


// GENERAL FUNCTIONS


//discontinued... use the new one below
// getTimestamp() - useful for logging
//function getTimestamp() {
//  return '[' + new Date().toUTCString() + ']';
//}



/**
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
function getTimestamp() {
  return new Date().toMysqlFormat(); // DateTime in MySQL format
}



//function getMonsters() {
  // alert('should i have loaded getMonsters'); // WARNING:  node.js cannot send a client-side alert! SO THIS IS THE WRONG PLACE TO DO THIS... JUST NOTATING THE ERR HERE.
//}




///////////////////////////////////////////////////////////////////////////////////////////////////
// INITIALIZATION
///////////////////////////////////////////////////////////////////////////////////////////////////
// SPAWN WIPE - This is a one-time event that occurs when the "node server.js" is run
pool.getConnection(function(err, connection) {
  if(err) { console.log(err); return; }
  var sql = "TRUNCATE TABLE monsterPlants";
  connection.query(sql, [], function(err, results) {
    connection.release(); // always put connection back in pool after last query
    if(err) { 
      console.log(getTimestamp() + ' Spawn Wipe ERR=' + err);
    } else {
      console.log(getTimestamp() + ' Spawn Wipe SUCCESS');
    }
  });
});

// SPAWN INITIALIZE - This is a one-time event that occurs when the "node server.js" is run
pool.getConnection(function(err, connection) {
  if(err) { console.log(err); return; }
  var sql = "SELECT monsterId, zoneId, xStart, yStart FROM monsterSeeds";
  connection.query(sql, [], function(err, results) {
    connection.release(); // always put connection back in pool after last query
    if(err) { 
      console.log(getTimestamp() + ' FAIL Spawn Initialize1=' + err);
    } else {
      console.log(getTimestamp() + ' PASS Spawn Initialize1=' + util.inspect(results)); // useful for debuggging
      for (var item in results) {
        var sql = "INSERT INTO monsterPlants (monsterId, zoneId, x, y, z, hp) VALUES (?, ?, ?, ?, ?, ?)";
        var query = connection.query(sql, [ results[item]['monsterId']
, results[item]['zoneId'] 
, results[item]['xStart'] 
, results[item]['yStart'] 
, 0
, 100
], function(err, results2) {
          if(err) {
            console.log(getTimestamp() + ' err='+err);
          } else {
            console.log(getTimestamp() + ' Spawn Initialize2 successful');
          }
          console.log(query.sql);
        });
      }
    }
  });
});



///////////////////////////////////////////////////////////////////////////////////////////////////
// DATABASE FUNCTIONS
///////////////////////////////////////////////////////////////////////////////////////////////////
exports.getCharacterList = (function(sessionId, callback) {
  console.log('sessionId:' + sessionId);
  pool.getConnection(function(err, connection) {
    if(err) { console.log(err); callback(false); return; }
    var sql = "SELECT c.id AS charId, c.firstName AS firstName, c.lastName AS lastName \
                FROM characters c \
                LEFT JOIN sessions s \
                ON  s.userId = c.userId \
                WHERE s.id = " + mysql.escape(sessionId);
    connection.query(sql, [], function(err, results) {
      connection.release(); // always put connection back in pool after last query
      if((err) || (sessionId == null)) {  // NOTE: Testing for sessionId==null might give unintended consequences
        console.log('err='+err);
        callback(false);
        // @TODO: Log the character out, and add a console abort message
      } else {
        console.log('results1='+util.inspect(results)); // useful for debugging
        //callback(results[0].charId, results[0].firstName, results[0].lastName);
        callback(results);
      }
    });
  });
});
exports.getCharacterList = (function(sessionId, callback) {
  console.log('sessionId:' + sessionId);
  pool.getConnection(function(err, connection) {
    if(err) { console.log(err); callback(false); return; }
    var sql = "SELECT c.id AS charId, c.firstName AS firstName, c.lastName AS lastName \
                FROM characters c \
                LEFT JOIN sessions s \
                ON  s.userId = c.userId \
                WHERE s.id = " + mysql.escape(sessionId);
    connection.query(sql, [], function(err, results) {
      connection.release(); // always put connection back in pool after last query
      if((err) || (sessionId == null)) {  // NOTE: Testing for sessionId==null might give unintended consequences
        console.log('err='+err);
        callback(false);
        // @TODO: Log the character out, and add a console abort message
      } else {
        console.log('results1='+util.inspect(results)); // useful for debugging
        //callback(results[0].charId, results[0].firstName, results[0].lastName);
        callback(results);
      }
    });
  });
});
exports.getSpeakMyName = (function(sessionId, charId, callback) {
  console.log('sessionId=' + sessionId + 'charId=' + charId);
  pool.getConnection(function(err, connection) {
    if(err) { console.log(err); callback(false); }
    var sql = "SELECT c.firstName AS firstName, c.lastName AS lastName \
                FROM characters c \
                LEFT JOIN sessions s \
                ON  s.userId = c.userId \
                WHERE s.id = " + mysql.escape(sessionId) + "\
                AND c.id = " +mysql.escape(charId);
    connection.query(sql, [], function(err, results) {
      connection.release(); // always put connection back in pool after last query
      if((err) || (sessionId == null)) {  // NOTE: Testing for sessionId==null might give unintended consequences
        console.log('err='+err);
        callback(false);
        // @TODO: Log the character out, and add a console abort message
      } else {
        console.log('results='+util.inspect(results)); // useful for debugging
        callback(results[0].firstName, results[0].lastName);
      }
    });
  });
});
exports.setUserCoordinates = (function(sessionId, x, y, z, c, callback) {
  console.log('exports.setUserCoordinates sessionId:' + sessionId + 'x=' + x + 'y=' + y + 'z=' + z + 'c=' + c);
  pool.getConnection(function(err, connection) {
    if(err) { console.log(err); callback(true); return; }
    var sql = "UPDATE sessions SET x=" + mysql.escape(x) + ", y=" + mysql.escape(y) + ", z = " + mysql.escape(z) + ", c = " + mysql.escape(c) + " WHERE id = " + mysql.escape(sessionId);
    connection.query(sql, [], function(err, results) {
      connection.release(); // always put connection back in pool after last query
      if(err) { 
        console.log('err='+err);
        callback(false);
        // @TODO: Log the character out, and add a console abort message
      } else {
        console.log('exports.setUserCoordinates results='+util.inspect(results)); // useful for debugging
        callback(sessionId, x, y, z, c);
      }
    });
  });
});
exports.speak = (function(firstName,lastName,filename,prefix,callback) {
  console.log('wooooooooohoooooooooooooo' + prefix + firstName + lastName + filename);
  console.log(prefix);
  console.log(firstName);
  console.log(lastName);
  console.log(filename);

  var string = prefix.concat('\\ ').concat(firstName).concat('\\ ').concat(lastName);
  console.log('string222=' + string);
  exec("/usr/bin/flite -t "+string+" -o /var/www/mmorpg/audio/" + filename, puts);
  console.log('zooooooooohoooooooooooooo' + prefix + firstName + lastName + filename);
  callback(filename);
});






// on server started we can load our client html page
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
    //res.send('<h1>hello world</h1>');
});

setInterval(function(){
    console.log(onlineClients);
}, 1000);

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('event', function(){
    console.log('an event occurred');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });

  /////////////////////////////////////////
  // SIGNIN
  /////////////////////////////////////////
  socket.on('login', function(msg){
    // now i need to take this msg JSON array and split it into vars:  email and password
    // and show it in the console log
    console.log('message: ' + msg);
    var parsed = JSON.parse(msg);
    console.log('email:' + parsed.email + ' password:' + parsed.password);

    // then i need to do a mysql lookup to see if the information is correct
    // if it is correct, then log them in.
    exports.getPassword = (function(email, callback) {
      pool.getConnection(function(err, connection) {
        if(err) { console.log(err); callback(true); return; }
        var sql = "SELECT id, password FROM users WHERE email = " + mysql.escape(email) + " LIMIT 1";
        connection.query(sql, [], function(err, results) {
          connection.release(); // always put connection back in pool after last query
          if(err) { 
            console.log('err='+err);
            callback(true); // this should probably be set to false
            return;  // don't think i need this
          } else {
            //console.log('results='+util.inspect(results)); // useful for debugging
            //console.log('results = ' + results[0].password);
            callback(results[0].id, results[0].password); // userId, password
          }
        });
      });
    });
    exports.getPassword(parsed.email, function(userId, realPassword) { // the result from the callback is userId and realPassword
      //console.log('DEBUG5 result='+userId); // useful for debugging
      //console.log('DEBUG6 result='+realPassword); // useful for debugging
      if(realPassword == parsed.password) {
        //var response = "pass";
        //var now = new Date().getTime();

        console.log(getTimestamp() + ' \033[32mLOGIN\033[0m ' + parsed.email + ' passed login with userId ' + userId);

        // Generate sessionId
        var sessionId = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        // @TODO:  Session ID is only 5 alphanumeric characters right now.  This needs to be increased higher later.
        for( var i=0; i < 5; i++ ) { sessionId += possible.charAt(Math.floor(Math.random() * possible.length)); }

        // Insert sessionId into db
        exports.generateSession = (function(userId, callback) {
          pool.getConnection(function(err, connection) {
            if(err) { console.log(err); callback(true); return; }
            var sql = "DELETE FROM sessions WHERE userId = " + mysql.escape(userId) + ";INSERT INTO sessions (id, userId, dt) VALUES (" + mysql.escape(sessionId) + "," + mysql.escape(userId) + "," + mysql.escape(getTimestamp()) + ")";
            connection.query(sql, [], function(err, results) {
              connection.release(); // always put connection back in pool after last query
              if(err) { 
                console.log('err='+err);
                callback(false);
              } else {
                callback(sessionId);
              }
            });
          });
        });
        exports.generateSession(userId, function(sessionId) { // the response is the sessionid, or false
          io.emit('login response', sessionId);  // User passed login, so tell him the sessionId

// This needs to be moved to post-char select
//exec("/usr/bin/flite 'hello world' -o /var/www/mmorpg/audio/sessionId.wav", puts);
//io.emit('audioPlay', 'sessionId.wav');


        });

      } else {
        // if not, send them a failed message.
        var response = "fail";
        console.log(getTimestamp() + ' \033[31mFAILED LOGIN\033[0m user ' + parsed.email + ' with ' + parsed.password);
        io.emit('login response', response);  // EMITS RESPONSE OF pass OR fail UPON LOGIN
      }
    });
  });


  socket.on('getMonsters', function(msg) {
    //
    // @TODO: 20150225 SQL QUERY TO DB TO GET MONSTERS NEAR CHARACTER
    //
    // @TODO: 20150225 REWRITE MONSTERS DIV POSSIBLY HERE?????????????????  IF SO, IT'LL STAGE UP THE MONSTERS ON THE SCREEN
    //
  });


  /////////////////////////////////////////
  // ATTACK
  /////////////////////////////////////////
  socket.on('attack', function(msg){
    // @TODO: 20150225 SQL QUERY TO DB TO GET MONSTERS NEAR CHARACTER

    // OK, the first problem with this is the client is telling you what their coordinates are, instead of the server already knowing that
    // so while this may be an first weak attempt at doing an attack, i really need to refactor the entire coordinates handling thingy first

    // NOTE:  THIS DOES NOT WORK AS INTENDED RIGHT NOW
  });

  /////////////////////////////////////////////////////////////////////////////////////////////////
  // CHARACTER SELECT and CHARACTER-related ACTIVITIES
  /////////////////////////////////////////////////////////////////////////////////////////////////
  socket.on('reqCharacterList', function(msg){
    sessionId = msg;
    console.log('sturn right (this does not look like i want this here): ' + msg);
    // SELECT the user's coordinates x,y,z,compass based on their sessionId
    exports.getCharacterList(sessionId, function(results) {  // The callback is sending us results
      console.log('sResults=' + results);
      var html="";
      for (var row in results) {
        //console.log('row=' + row);
        //console.log('charId=' + results[row].charId);
        //console.log('firstName=' + results[row].firstName);
        //console.log('lastName=' + results[row].lastName);
        html = html.concat("<div class=\"characterSelectItem\"><span class=\"charId\">" + results[row].charId + "</span><span class=\"name\">" + results[row].firstName + " " + results[row].lastName + "</span></div>");
        //@TODO: Add functionality to add a character via the store, or show empty slots
        //       from which the user can choose upon to create a new character.  Basically,
        //       we're adding onto this html some more options for the user.
      }
      io.emit('resCharacterList', html);
    });
  });


  socket.on('reqSpeakMyName', function(sessionId, charId) {
    console.log('reqSpeakMyName=' + sessionId + ' ' + charId);
    exports.getSpeakMyName(sessionId, charId, function(firstName, lastName) {
      console.log('getSpeakMyName firstName=' + firstName + ' lastName=' + lastName);

      var filename = "dynamic/" + sessionId + "-" + charId + ".wav";
      console.log('filename=' + filename);
        exports.speak(firstName, lastName, filename, prefix='Welcome', function(filename) {
          console.log(prefix + firstName + lastName + 'ran this function faithfully.  Here is the file:' + filename);
          io.emit('audioPlay', filename);
        });
    });
  });

  /////////////////////////////////////////////////////////////////////////////////////////////////
  // INVENTORY
  /////////////////////////////////////////////////////////////////////////////////////////////////
  socket.on('reqInventory', function(msg){   // I or i key pressed
    sessionId = msg;
    // @TODO:  Right now, we're faking the results, but this needs to be a db lookup
    console.log('reqInventory: ' + msg);
      var JSONobj = '['
          +'{'
          +'"itemId" : ' + '1' + ','
          +'"name" : ' + '"Apple"' + ','
          +'"image" : ' + '"apple.gif"' + ','
          +'"quantity" : ' + '1'
          +'},'
          +'{'
          +'"itemId" : ' + '1' + ','
          +'"name" : ' + '"Apple"' + ','
          +'"image" : ' + '"apple.gif"' + ','
          +'"quantity" : ' + '1'
          +'}'
          +']'
      ;
    io.emit('resInventory', JSONobj);
  });

  /////////////////////////////////////////////////////////////////////////////////////////////////
  // NAVIGATION
  /////////////////////////////////////////////////////////////////////////////////////////////////
  socket.on('turn right', function(msg){   // d key pressed
    sessionId = msg;
    console.log('turn right: ' + msg);
    // SELECT the user's coordinates x,y,z,compass based on their sessionId
    exports.getUserCoordinates(sessionId, function(x, y, z, c) {  // The callback is sending us x,y,z,c
      console.log('hereiam=exports.getUserCoordinates' + x + y + z + c);
      // Calculate the change in coordinates
      var c = c + 45;
      if(c >= 360) {  // If the compass is greater than 360 degrees
        c = c - 360;  // then subtract 360 degrees from the compass
      }
      // UPDATE the user's coordinates in the db
      exports.setUserCoordinates(sessionId, x, y, z, c, function(result) {  // The callback is sending us x,y,z,c
        console.log('hereiam=exports.setUserCoordinates ' + sessionId + ' ' + x + ' ' + y + ' ' + z + ' ' + c);
      });
      // Send x,y,z,c coordinates back to the user
      var JSONobj = '{'
        +'"x" : ' + x + ','
        +'"y" : ' + y + ','
        +'"z" : ' + z + ','
        +'"c" : ' + c
        +'}';
      io.emit('resTurnRight', JSONobj);
      // @TODO: See if there's something to gather and have it show/hide the gathering window
      // isGatherable(sessionId,x,y,z);
    });
  });

  socket.on('turn left', function(msg){   // d key pressed
    sessionId = msg;
    console.log('turn left: ' + msg);
    // SELECT the user's coordinates x,y,z,compass based on their sessionId
    exports.getUserCoordinates(sessionId, function(x, y, z, c) {  // The callback is sending us x,y,z,c
      console.log('hereiam=exports.getUserCoordinates' + x + y + z + c);
      // Calculate the change in coordinates
      var c = c - 45;
      if(c < 0) {     // if compass is less than 0 degrees
        c = c + 360;  // then add 360 degrees to it
      }
      // UPDATE the user's coordinates in the db
      exports.setUserCoordinates(sessionId, x, y, z, c, function(result) {  // The callback is sending us x,y,z,c
        console.log('hereiam=exports.setUserCoordinates ' + sessionId + ' ' + x + ' ' + y + ' ' + z + ' ' + c);
      });
      // Send x,y,z,c coordinates back to the user
      var JSONobj = '{'
        +'"x" : ' + x + ','
        +'"y" : ' + y + ','
        +'"z" : ' + z + ','
        +'"c" : ' + c
        +'}';
      io.emit('resTurnLeft', JSONobj);
      // @TODO: See if there's something to gather and have it show/hide the gathering window
      // isGatherable(sessionId,x,y,z);
    });
  });

  socket.on('walk forward', function(msg){    // w key pressed
    sessionId = msg;
    console.log('walk forward: ' + msg);
    // SELECT the user's coordinates x,y,z,compass based on their sessionId
    exports.getUserCoordinates(sessionId, function(x, y, z, c) {  // The callback is sending us x,y,z,c
      console.log('hereiam=exports.getUserCoordinates' + x + y + z + c);
      // Calculate the change in coordinates
      if(c < 90 || c > 270) {
        y++;
      }
      if(c > 90 && c < 270) {
        y--;
      }
      if(c > 0 && c < 180) {
        x++;
      }
      if(c > 180 && c < 360) {
        x--;
      }
      // UPDATE the user's coordinates in the db
      exports.setUserCoordinates(sessionId, x, y, z, c, function(result) {  // The callback is sending us x,y,z,c
        console.log('hereiam=exports.setUserCoordinates ' + sessionId + ' ' + x + ' ' + y + ' ' + z + ' ' + c);
      });
      // Send x,y,z,c coordinates back to the user
      var JSONobj = '{'
        +'"x" : ' + x + ','
        +'"y" : ' + y + ','
        +'"z" : ' + z + ','
        +'"c" : ' + c
        +'}';
      io.emit('resWalkForward', JSONobj);
      // @TODO: See if there's something to gather and have it show/hide the gathering window
      // isGatherable(sessionId,x,y,z);
    });
  });

  socket.on('walk backward', function(msg){    // x key pressed
    sessionId = msg;
    console.log('walk backward: ' + msg);
    // SELECT the user's coordinates x,y,z,compass based on their sessionId
    exports.getUserCoordinates(sessionId, function(x, y, z, c) {  // The callback is sending us x,y,z,c
      console.log('hereiam=exports.getUserCoordinates' + x + y + z + c);
      // Calculate the change in coordinates
      if(c < 90 || c > 270) {
        y--;
      }
      if(c > 90 && c < 270) {
        y++;
      }
      if(c > 0 && c < 180) {
        x--;
      }
      if(c > 180 && c < 360) {
        x++;
      }
      // UPDATE the user's coordinates in the db
      exports.setUserCoordinates(sessionId, x, y, z, c, function(result) {  // The callback is sending us x,y,z,c
        console.log('hereiam=exports.setUserCoordinates ' + sessionId + ' ' + x + ' ' + y + ' ' + z + ' ' + c);
      });
      // Send x,y,z,c coordinates back to the user
      var JSONobj = '{'
        +'"x" : ' + x + ','
        +'"y" : ' + y + ','
        +'"z" : ' + z + ','
        +'"c" : ' + c
        +'}';
      io.emit('resWalkBackward', JSONobj);
      // @TODO: See if there's something to gather and have it show/hide the gathering window
      // isGatherable(sessionId,x,y,z);
    });
  });

});

//server.listen(port, ip);
http.listen(1337, function(){
  console.log('Server is listening on port 1337');
});

console.log('Server started successfully!  BOOYAH!');  // @TODO:  20150225:Should I wrap this line within the http.listen() above?