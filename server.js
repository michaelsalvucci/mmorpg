var mysql = require('mysql');
//var jquery = require('jquery');

var express = require('express');
var app = express();
//var app = require('express')();

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var onlineClients = {};
var http = require('http').Server(app);

// This creates a pool we can use to mimic a persistent connection
mysqlPool = mysql.createPool({host:"127.0.0.1", user:"root", password:"", database:"mmorpg", multipleStatements:true});

var port = 1337;
var ip = "192.168.0.52";
//server.listen(port, ip);

//var socket = require('socket.io-client')(ip);
var io = require('socket.io')(http);

app.get('/vendor/jquery/dist/jquery.min.js', function (req, res) {res.sendFile(__dirname + "/vendor/jquery/dist/jquery.min.js");});
app.get('/node_modules/socket.io-client/socket.io.js', function (req, res) {res.sendFile(__dirname + "/node_modules/socket.io-client/socket.io.js");});

//var playfield = require("./js/playfield.js");
app.get('/js/playfield.js', function (req, res) {res.sendFile(__dirname + "/js/playfield.js");});
app.get('/css/style.css', function (req, res) {res.sendFile(__dirname + "/css/style.css");});

app.use('/images/backgrounds', express.static(__dirname + "/images/backgrounds"));


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

  socket.on('login', function(msg){
    // now i need to take this msg JSON array and split it into vars:  email and password
    // and show it in the console log
    console.log('message: ' + msg);
    var parsed = JSON.parse(msg);
    console.log('email:' + parsed.email + ' password:' + parsed.password);

    // @TODO:  then i need to do a mysql lookup to see if the information is correct
    // if it is correct, then log them in.
    var response = "pass";
    // if not, send them a failed message.
    var response = "fail";
    io.emit('login response', response);
  });


  socket.on('turn right', function(msg){   // d key pressed
    console.log('turn right: ' + msg);
  });

  socket.on('turn left', function(msg){    // a key pressed
    console.log('turn left: ' + msg);
  });

  socket.on('walk forward', function(msg){    // w key pressed
    // @TODO: do error checking here, such as if they sent a 
    // negative x or y coordinate, to set it to zero
    
    // @TODO:  THIS DOES NOT WORK PROPERLY
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
  console.log('listening on 1337');
});

console.log('Server started successfully.');
