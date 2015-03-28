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

var port = 1337;
var ip = "192.168.0.52";
//server.listen(port, ip);

var THREE = require('three');

//var socket = require('socket.io-client')(ip);
var io = require('socket.io')(http);

app.get('/vendor/jquery/dist/jquery.min.js', function (req, res) {res.sendFile(__dirname + "/vendor/jquery/dist/jquery.min.js");});
app.get('/node_modules/socket.io-client/socket.io.js', function (req, res) {res.sendFile(__dirname + "/node_modules/socket.io-client/socket.io.js");});
app.get('/node_modules/three/three.min.js', function (req, res) {res.sendFile(__dirname + "/node_modules/three/three.min.js");});


//var playfield = require("./js/playfield.js");
app.get('/js/playfield.js', function (req, res) {res.sendFile(__dirname + "/js/playfield.js");});
app.get('/css/style.css', function (req, res) {res.sendFile(__dirname + "/css/style.css");});

app.use('/images/backgrounds', express.static(__dirname + "/images/backgrounds"));
app.use('/images', express.static(__dirname + "/images"));


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





// SPAWN WIPE
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




// SPAWN INITIALIZE
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
      console.log('DEBUG5 result='+userId); // useful for debugging
      console.log('DEBUG6 result='+realPassword); // useful for debugging
      if(realPassword == parsed.password) {
        //var response = "pass";
        //var now = new Date().getTime();

        console.log(getTimestamp() + ' LOGIN ' + parsed.email + ' passed login with userId ' + userId);

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
          var response = sessionId;
          console.log('response1 = ' + response);
          io.emit('login response', response);  // EMITS RESPONSE OF pass OR fail UPON LOGIN
        });

      } else {
        // if not, send them a failed message.
        var response = "fail";
        console.log(getTimestamp() + ' FAILED LOGIN user ' + parsed.email + ' with ' + parsed.password);
        console.log('response2 = ' + response);
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

    var parsed = JSON.parse(msg);
    console.log('x:' + parsed.x + ' y:' + parsed.y);
    exports.getMonsterId = (function(x, y, callback) {
      console.log('x:' + x + ' y:' + y);
      pool.getConnection(function(err, connection) {
        if(err) { console.log(err); callback(true); return; }
        var sql = "SELECT id, monsterId, zoneId, x, y, z, hp FROM monsterPlants WHERE x = " + mysql.escape(x) + " LIMIT 1";
        connection.query(sql, [], function(err, results) {
          connection.release(); // always put connection back in pool after last query
          if(err) { 
            console.log('err='+err);
            callback(true); // this should probably be set to false
            return;  // don't think i need this
          } else {
            console.log('results1='+util.inspect(results)); // useful for debugging
            console.log('results2= ' + results[0].x);
            callback(results[0].hp);
          }
        });
      });
    });
    exports.getMonsterId(parsed.x, parsed.y, function(result) {
      console.log('hereiam=exports.getMonsterId');
    });
  });

  /////////////////////////////////////////
  // NAVIGATION
  /////////////////////////////////////////

  //OLD WAY:
//  socket.on('turn right', function(msg){   // d key pressed
//    console.log('turn right: ' + msg);
//  });
  //NEW WAY:
  socket.on('turn right', function(msg){   // d key pressed
    console.log('turn right: ' + msg);
    // @TODO: SELECT the user's coordinates x,y,z,compass based on their characterId (or possibly their sessionId)

    // @TODO: Calculate the change in coordinates

    // @TODO: UPDATE the user's coordinates in the db

    // @TODO: Send x,y,z,compass coordinates back to the user

    // @TODO: See if there's something to gather and have it show/hide the gathering window
  });


  socket.on('turn left', function(msg){    // a key pressed
    console.log('turn left: ' + msg);
  });

  socket.on('walk forward', function(msg){    // w key pressed
    // @TODO: do error checking here, such as if they sent a 
    // negative x or y coordinate, to set it to zero
    
    // @TODO:  THIS DOES NOT WORK PROPERLY
    //         Need to grab the values and save them to the db
    //var obj = JSON.parse(msg);
    //console.log('X:' + obj.x + ' Y:' + obj.y);

    console.log('walk forward: ' + msg);
  });

  socket.on('walk backward', function(msg){    // x key pressed
    console.log('walk backward: ' + msg);
  });

});

//server.listen(port, ip);
http.listen(1337, function(){
  console.log('Server is listening on port 1337');
});

console.log('Server started successfully!  BOOYAH!');  // @TODO:  20150225:Should I wrap this line within the http.listen() above?