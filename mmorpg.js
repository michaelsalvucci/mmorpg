(function () {
    "use strict";
    /*jslint node:true */ // Ref. http://wiki.bash-hackers.org/scripting/terminalcodes
    /*jslint todo:true */ // SINCE WE'RE EARLY IN THE DEVELOPMENT PROCESS, WE'RE GOING TO AVOID LOOKING AT @ todo FOR NOW

    Error.stackTraceLimit = Infinity; // This shows an entire stack trace (use it when you need more than 10 lines of errors)
                                      // Ref. http://stackoverflow.com/questions/7697038/more-than-10-lines-in-a-node-js-stack-error

    var counter = 0, // using it for flow control tracking
        mysql = require('mysql'),
        express = require('express'),
//        serveStatic = require('serve-static'),
        app = express(),  //var app = require('express')();  // can't use this shorthand because of /images/backgrounds below
        server = require('http').createServer(app),
        //io = require('socket.io')(server),
        onlineClients = 0,
        http = require('http').Server(app),  // note: http is a node core module, so it does not have to be installed
        pool = mysql.createPool({connectionLimit: 600, host: "127.0.0.1", user: "root", password: "", database: "mmorpg", multipleStatements: true}),  // This creates a pool we can use to mimic a persistent connection
        util = require('util'),  // useful for debugging
        execSync = require("exec-sync"),  // Synchronous Exec in Node.js
        port = 1337,
        ip = "192.168.0.52",
        Promise = require('promise'),
        async = require('async'),
        _ = require('lodash'),
        io = require('socket.io')(http);   //var socket = require('socket.io-client')(ip);

    /*jslint nomen: true*/ // allow dangling _ in __dirname
    //app.get('/vendor/jquery/dist/jquery.min.js', function (req, res) {res.sendFile(__dirname + "/vendor/jquery/dist/jquery.min.js"); });
    app.get('/vendor/jquery/dist/jquery.min.js', function (req, res) {res.sendFile(__dirname + "/vendor/jquery/dist/jquery.min.js"); });
    //app.get('/vendor/jquery/dist/jquery.min.map', function (req, res) {res.sendFile(__dirname + "/vendor/jquery/dist/jquery.min.map"); });
    app.get('/vendor/jquery/dist/jquery.min.map', function (req, res) {res.sendFile(__dirname + "/vendor/jquery/dist/jquery.min.map"); });
    //app.get('/node_modules/socket.io-client/socket.io.js', function (req, res) {res.sendFile(__dirname + "/node_modules/socket.io-client/socket.io.js"); });
    app.get('/node_modules/socket.io-client/socket.io.js', function (req, res) {res.sendFile(__dirname + "/node_modules/socket.io-client/socket.io.js"); });

    //app.get('/node_modules/three/three.min.js', function (req, res) {res.sendFile(__dirname + "/node_modules/three/three.min.js"); });
    app.get('/node_modules/three/three.min.js', function (req, res) {res.sendFile(__dirname + "/node_modules/three/three.min.js"); });

    //app.get('/js/playfield.js', function (req, res) {res.sendFile(__dirname + "/js/playfield.js"); });
    app.get('/js/playfield.js', function (req, res) {res.sendFile(__dirname + "/js/playfield.js"); });
    //app.get('/css/style.css', function (req, res) {res.sendFile(__dirname + "/css/style.css"); });
    app.get('/css/style.css', function (req, res) {res.sendFile(__dirname + "/css/style.css"); });

    /* POTENTIAL FIX...........
    As of express 4.x, express.static() is handled by serve-static package middleware. 
    you can find its docs at npmjs.com/package/serve-static or github.com/expressjs/serve-static. 
    */
                            //app.use(serveStatic(__dirname + '/images/backgrounds'));
    app.use('/images/backgrounds', express.static(__dirname + "/images/backgrounds"));
    app.use('/images', express.static(__dirname + "/images"));
    app.use('/audio/dynamic', express.static(__dirname + "/audio/dynamic")); // allow all audio/dynamic files to be served
    app.use('/audio', express.static(__dirname + "/audio")); // allow all audio files to be served
    /*jslint nomen: false*/ // resume to normal conditions 

    ////////////////////////////////////////////////////////////////////////////////
    // GENERAL FUNCTIONS
    ///////////////////////////////////////////////////////////////////////////////

    /**
      * twoDigits(d)
      * You first need to create a formatting function to pad numbers to two digits…
      **/
    function twoDigits(d) {
        if (0 <= d && d < 10) {
            return "0" + d.toString();
        }
        if (-10 < d && d < 0) {
            return "-0" + (-1 * d).toString();
        }
        return d.toString();
    }
    /**
      * Date.prototype.toMysqlFormat
      * …and then create the method to output the date string as desired.
      * Some people hate using prototypes this way, but if you are going
      * to apply this to more than one Date object, having it as a prototype
      * makes sense.
      **/
    Date.prototype.toMysqlFormat = function () {
        return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
    };
    /**
      * getTimestamp()
      **/
    function getTimestamp() {
        return new Date().toMysqlFormat(); // DateTime in MySQL format
    }

    /**
     * greet()
     * @returns {String}
     * @todo pass in variable if i need to return a first name.  NOT REQUIRED AT THIS TIME
     */
    function greet() {
        return "Hello, world!";
    }



    /**
      * getRandomArbitrary(min, max)
      * DEFUNCT - NOT USED, BUT KEPT HERE AS EXAMPLE
      * Returns a random number between min (inclusive) and max (exclusive)
      */
    //function getRandomArbitrary(min, max) {
    //    return Math.random() * (max - min) + min;
    //}

    /**
      * getRandomInt(min, max)
      * Returns a random integer between min (inclusive) and max (inclusive)
      * Using Math.round() will give you a non-uniform distribution!
      */
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
      * getRandom3d6
      **/
    function getRandom3d6() {
        return getRandomInt(1, 6) + getRandomInt(1, 6) + getRandomInt(1, 6);
    }

    /**
      * getFail
      **/
    function getFail() {
        counter = counter + 1;

        // Bug fix:
        // Octal literals are not allowed in strict mode.
        // return getTimestamp() + '[#' + counter + '] \033[31mFAIL\033[0m ';
        // Instead of Octal, I'm going to use Hex instead:
        // return getTimestamp() + '[#' + counter + '] \x1B[31mFAIL\x1B[0m ';
        return getTimestamp() + '[#' + counter + '] \x1B[31m⚔\x1B[0m ';
    }

    /**
      * getPass
      **/
    function getPass() {
        counter = counter + 1;

        // Bug fix:
        // Octal literals are not allowed in strict mode.
        //return getTimestamp() + '[#' + counter + '] \033[32mPASS\033[0m ';
        // Instead of Octal, I'm going to use Hex instead:
        //return getTimestamp() + '[#' + counter + '] \x1B[32mPASS\x1B[0m ';
        return getTimestamp() + '[#' + counter + '] \x1B[32m✔\x1B[0m ';
    }

    /**
      * killAll
      **/
    function killAll() {
        console.log(getFail() + ' killAll function executed');
        process.exit(); // kill the whole node process (ie. this script)
    }

    ///////////////////////////////////////////////////////////////////////////////
    // INITIALIZATION
    ///////////////////////////////////////////////////////////////////////////////

    /**
      * spawnWipeGathers()
      * Runs an hour after "node server.js" is started, and each hour thereafter (ref. cron jobs)
      * NB: If server keeps crashing within one hour, the spawn will continue to disappear as users consume it.
      *     This can either be considered "drought conditions" or these methods will need to be invoked at startup.
      *     Whatever the case, the programmer should focus on server stability, hence this caveat emptor.
      *
      * JSDoc Reference:  http://en.wikipedia.org/wiki/JSDoc
      *
      * @author     2015 Michael Salvucci
      * @copyright  2015 Michael Salvucci
      * @exception  err
      * @license    Proprietary
      * @link       /docs/initialization/spawnWipeGathers
      * @package    initialization
      * @return     true  Database call completed successfully
      * @return     false Database call failed??? (@return or @throw?)
      * @see        CRON JOBS
      * @throws     false???
      * @todo       Error Handling needs to be documented in the console properly, so we must elaborate on this below.
      * @version    0.0.1
      **/
    function spawnWipeGathers() {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                return;
            }
            var sql = "TRUNCATE TABLE gatherPlants";
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + 'Spawn Wipe Gathers err=' + err);
                } else {
                    //console.log(getPass() + 'Spawn Wipe Gathers results=' + results);
                }
            });
        });
    }

    /**
      * spawnWipeMonsters()
      * Runs an hour after "node server.js" is started, and each hour thereafter (ref. cron jobs)
      *     This can either be considered "drought conditions" or these methods will need to be invoked at startup.
      *     Whatever the case, the programmer should focus on server stability, hence this caveat emptor.
      **/
    function spawnWipeMonsters() {
        pool.getConnection(function (err, connection) {
            if (err) { console.log(err); return; }
            var sql = "TRUNCATE TABLE monsterPlants";
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + 'Spawn Wipe Monsters err=' + err);
                } else {
                    //console.log(getPass() + 'Spawn Wipe Monsters=' + results);
                }
            });
        });
    }


    function insertGatherPlants(sql, row, results) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + ' insertGatherPlants() ' + err);
                connection.release(); // always put connection back in pool after last query
                return false;
            }
            connection.query(sql, [
                results[row].itemId,
                results[row].zoneId,
                results[row].x,
                results[row].y,
                results[row].z
            ], function getPassOrFail(err, results) {
                if (err) {
                    console.log(getFail() + 'Spawn Initialize Gathers2 err=' + err);
                } else {
                    //console.log(getPass() + 'Spawn Initialize Gathers2 results=' + results);
                }
            });
            connection.release(); // always put connection back in pool after last query
            return results;
        });
    }

    /**
      * spawnInitializeGathers()
      * Runs an hour after "node mmorpg.js" is started, and each hour thereafter (ref. cron jobs)
      *     This can either be considered "drought conditions" or these methods will need to be invoked at startup.
      *     Whatever the case, the programmer should focus on server stability, hence this caveat emptor.
      **/
    function spawnInitializeGathers() {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + 'spawnInitializeGathers() ' + err);
                return;
            }
            var sql = "SELECT itemId, zoneId, x, y, z FROM gatherSeeds";
            connection.query(sql, [], function (err, results) {
                var row,
                    sqlGatherPlants = "INSERT INTO gatherPlants (itemId, zoneId, x, y, z) VALUES (?, ?, ?, ?, ?)";
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + 'Spawn Initialize Gathers1 err=' + err);
                } else {
                    //console.log(getPass() + 'Spawn Initialize Gathers1');
                    for (row = 0; row < results.length; row = row + 1) {
                        insertGatherPlants(sqlGatherPlants, row, results);
                    }
                }
            });
        });
    }

    function insertMonsterPlants(sql, row, results) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + ' insertMonsterPlants() ' + err);
                connection.release(); // always put connection back in pool after last query
                return;
            }
            connection.query(sql, [
                results[row].monsterId,
                results[row].zoneId,
                results[row].xStart,
                results[row].yStart,
                0,
                results[row].hp,
                results[row].itemId,
            ], function getPassOrFail(err, results2) {
                if (err) {
                    console.log(getFail() + 'Spawn Initialize Monsters2 err=' + err);
                } else {
                    //console.log(getPass() + 'Spawn Initialize Monsters2 results2=' + results2);
                }
                //console.log(query.sql);
            });
            connection.release(); // always put connection back in pool after last query
            return results;
        });
    }

    /**
      * spawnInitializeMonsters()
      * Runs an hour after "node server.js" is started, and each hour thereafter (ref. cron jobs)
      *     This can either be considered "drought conditions" or these methods will need to be invoked at startup.
      *     Whatever the case, the programmer should focus on server stability, hence this caveat emptor.
      * This script reads data in monsterSeeds and puts it in monsterPlants because it's a MEMORY database.
      **/
    function spawnInitializeMonsters() {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + 'spawnInitializeMonsters() ' + err);
                return;
            }
            //var sql = "SELECT monsterId, zoneId, xStart, yStart FROM monsterSeeds";
            var sql = "SELECT ms.monsterId AS monsterId, ms.zoneId AS zoneId, ms.xStart AS xStart, ms.yStart AS yStart, m.hp AS hp, ms.itemId AS itemId FROM monsterSeeds ms LEFT JOIN monsters m ON ms.monsterId = m.id;";
            connection.query(sql, [], function (err, results) {
                var row,
                    sql2 = "INSERT INTO monsterPlants (monsterId, zoneId, x, y, z, hp, itemId) VALUES (?, ?, ?, ?, ?, ?, ?)";
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + 'Spawn Initialize Monsters1 err=' + err);
                } else {
                    //console.log(getPass() + 'Spawn Initialize Monsters1');
                    //for (item in results) {
                    for (row = 0; row < results.length; row = row + 1) {
                        insertMonsterPlants(sql2, row, results);

                    }
                }
            });
        });
    }

    /**
      * wipeAudioDynamic()
      *
      * @todo Add Error Handling
      **/
    function wipeAudioDynamic() {
        execSync("/bin/rm -rf audio/dynamic/");  // Synchronous Exec in Node.js
        execSync("/bin/mkdir audio/dynamic/");  // Synchronous Exec in Node.js
    }



    function sleep(time, callback) {
        var stop = new Date().getTime();
        while (new Date().getTime() < stop + time) {
            // do nothing
            //console.log(getPass() + ' sleeping...');
        }
        callback(true);
    }



    ///////////////////////////////////////////////////////////////////////////////
    // DATABASE FUNCTIONS
    ///////////////////////////////////////////////////////////////////////////////
    exports.generateSession = function (sessionId, userId, callback) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                return callback(true);
            } // this should probably be false
//io.to(socket.id).emit('resLogMeOut', sessionId); // 20160330 MS: Sends back the possible bad sessionId to the client to check and see if the client's browser is current
            var sql = "DELETE FROM sessions WHERE userId = " + mysql.escape(userId) + ";INSERT INTO sessions (id, userId, dt) VALUES (" + mysql.escape(sessionId) + "," + mysql.escape(userId) + "," + mysql.escape(getTimestamp()) + ")";
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + 'err=' + err);
                    return callback(false);
                } else {
                    //console.log(getPass() + 'results=' + results);
                    return callback(sessionId);
                }
            });
        });
    };

    exports.getCharacter = function (sessionId, charId, callback) {
        console.log(getPass() + sessionId + ' exports.getCharacter:::sessionId=' + sessionId);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + sessionId + ' err=' + err);
                return callback(false);
            }
            var sql = "SELECT firstName, lastName, inactive, hpMax, hpCurrent FROM characters WHERE id = ? LIMIT 1";
            //console.log('sql=' + sql);
            connection.query(sql, [charId], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err || sessionId === null) { // NOTE: Testing for sessionId===null might give unintended consequences
                    console.log(getFail() + 'sessionId=' + sessionId + ' exports.getCharacter:::err=' + err);
                    return callback(false);
                }
                console.log(getPass() + sessionId + ' exports.getCharacter:::results=' + util.inspect(results)); // useful for debugging
                return callback(results);
            });
        });
    };


    exports.getUserIdAndCharId = function (sessionId, zoneId, x, y, z, c, callback) {
        console.log(getPass() + sessionId + ' exports.getUserIdAndCharId:::sessionId=' + sessionId);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + sessionId + ' err=' + err);
                return callback(true); // this should probably be false
            }
            var sql = "SELECT userId, charId FROM sessions WHERE id = ? LIMIT 1"; // 20160330: MS Added LIMIT 1 to enforce a session and logout other logins on the same account
            //console.log('sql=' + sql);
            connection.query(sql, [sessionId], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err || sessionId === null) { // NOTE: Testing for sessionId===null might give unintended consequences
                    console.log(getFail() + 'sessionId=' + sessionId + ' exports.getUserIdAndCharId:::err=' + err);
                    return callback(false);
                }
                //console.log(getPass() + sessionId + ' results=' + util.inspect(results)); // useful for debugging
                //console.log(' exports.getUserId, CharId:::userId=' + results[0].userId + 'charId=' + results[0].charId);
                return callback(results[0].userId, results[0].charId);
            });
        });
    };

    exports.getUserCoordinates = function (sessionId, callback) {
        //console.log(getPass() + sessionId + ' exports.getUserCoordinates:::sessionId:' + sessionId);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + sessionId + ' err=' + err);
                return callback(true); // this should probably be false
            }
            var sql = "SELECT zoneId, x, y, z, c FROM sessions WHERE id = " + mysql.escape(sessionId) + " LIMIT 1"; // 20160330: MS Added LIMIT 1 to enforce a session and logout other logins on the same account
            //console.log('sql=' + sql);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err || sessionId === null || results.length === 0) { // NOTE: Testing for sessionId===null might give unintended consequences.  results.length may be the better test.
                    console.log(getFail() + sessionId + ' exports.getUserCoordinates:::err=' + err + ' results=' + results);

                    /*
                    // Here I'm testing the Test Case of server started, user logs in, walks forward one step, server is stopped/started, and user continues to walk forward, now with a different session id
                    // 20160504: temporary thingy here...
                    io.emit('resDebug', 'exports.getUserCoordinates:::error found because client old sessionId does not match new server sessionId.  did server restart since client tried to do something? ' + sessionId);
                    // at this point, it's showing the new sessionId, but it needs to logout all the sessions tied to the userId
                    // that are NOT this one... unfortunately... the userId is not passed in this function,
                    // so.... i may or may not be screwed here....
                    // right now, i'm thinking i'm not screwed here... 
                    // @TODO:  MAJOR PROBLEM THAT NEEDS TO BE FIXED NOW - this function needs to be rewritten to always send the sessionId, userId, and charId
                    // so i need to see if all calls to this function can provide that much data
                    // If it can, then I need to logout all sessions NOT tied to the userId with the current sessionId
                    //io.to(sessionId).emit('resLogMeOut', sessionId); // 20160330 MS: Sends back the possible bad sessionId to the client to check and see if the client's browser is current
                    */

                    // @TODO: Log the character out, and add a console abort message
                    return callback(true); // this should probably be set to false
                }
                console.log(getPass() + sessionId + ' exports.getUserCoordinates:::results=' + util.inspect(results)); // useful for debugging
                //console.log('hahahazoneId=' + results[0].zoneId + ' x=' + results[0].x + ' y=' + results[0].y + ' z=' + results[0].z + ' c=' + results[0].c);
                return callback(results[0].zoneId, results[0].x, results[0].y, results[0].z, results[0].c);
            });
        });
    };








    exports.insertLootIntoBackpack = function (sessionId, zoneId, x, y, z, c, itemId, userId, charId, quantity, callback) {
        console.log(getPass() + ' exports.insertLootIntoBackpack:::zoneId=' + zoneId);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + ' exports.insertLootIntoBackpack:::err=' + err);
                return callback(false);
            }
            /* First, check to see if I can add onto the item in the backpack */
            var sql = "SELECT id, charId, itemId, quantity FROM backpacks WHERE charId = ? AND itemId = ? AND quantity < (250 - ? + 1) LIMIT 1";
            connection.query(sql, [charId, itemId, quantity], function (err, results) {
                //connection.release(); // always put connection back in pool right after all the queries are finished.  This one is commented out since i'm running more queries downstream.
                //console.log(getPass() + ' exports.insertLootIntoBackpack:::sql=' + sql);
                if (err) {
                    console.log(getFail() + ' exports.insertLootIntoBackpack:::err=' + err);
                    return callback(false);
                } else {
                    // If I did not have results, I should INSERT a record.
                    if (results.length === 0) {
                        console.log(getPass() + ' ggg1exports.insertLootIntoBackpack:::results=' + util.inspect(results));
                        var sql2 = "INSERT INTO backpacks (charId, itemId, quantity) VALUES (?, ?, ?)";
                        connection.query(sql2, [charId, itemId, quantity], function (err, results) {
                            connection.release(); // always put connection back in pool right after the query
                            //console.log(getPass() + ' exports.insertLootIntoBackpack:::sql=' + sql);
                            if (err) {
                                console.log(getFail() + ' exports.insertLootIntoBackpack:::err=' + err);
                                return callback(false);
                            } else {
                                //console.log(getPass() + ' exports.insertLootIntoBackpack:::results=' + util.inspect(results));
                                return callback(true);
                            }
                        });
                        return callback(true);
                    } else {
                        // else I had results, so I should UPDATE the existing record
                        console.log(getPass() + ' ggg2exports.insertLootIntoBackpack:::results=' + util.inspect(results));
                        var newQuantity = quantity + results[0].quantity,
                            sql3 = "UPDATE backpacks SET quantity = ? WHERE id = ? AND charId = ? AND itemId = ? LIMIT 1";
                        connection.query(sql3, [newQuantity, results[0].id, charId, itemId], function (err, results) {
                            connection.release(); // always put connection back in pool right after the query
                            //console.log(getPass() + ' exports.insertLootIntoBackpack:::sql=' + sql);
                            if (err) {
                                console.log(getFail() + ' exports.insertLootIntoBackpack:::err=' + err);
                                return callback(false);
                            } else {
                                //console.log(getPass() + ' exports.insertLootIntoBackpack:::results=' + util.inspect(results));
                                return callback(true);
                            }
                        });
                    }
                }
            });
        });
    };




    exports.insertLootIntoGatherPlants = function (sessionId, zoneId, i, j, k, itemId, callback) {
        console.log('pausing to get sessionId on the next tick');
        console.log(getPass() + ' insertLootIntoGatherPlants:::sessionId=' + sessionId + ' zoneId=' + zoneId + ' i=' + i + ' j=' + j);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + ' insertLootIntoGatherPlants:::err=' + err);
                return callback(false);
            }
            var sql = "INSERT INTO gatherPlants (zoneId, x, y, z, itemId) VALUES (?, ?, ?, ?, ?)";
            connection.query(sql, [zoneId, i, j, k, itemId], function (err, results) {
                connection.release(); // always put connection back in pool right after the query
                //console.log(getPass() + ' insertLootIntoGatherPlants:::sql=' + sql);
                if (err) {
                    console.log(getFail() + ' insertLootIntoGatherPlants:::err=' + err);
                    return;
                } else {
                    //console.log(getPass() + ' insertLootIntoGatherPlants:::results=' + util.inspect(results));
                    return;
                }
            });
        });
    };





    exports.isGatherable = function (sessionId, zoneId, i, j, k, callback) {
        //console.log(getPass() + ' isGatherable:::zoneId=' + zoneId + ' i=' + i + ' j=' + j);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + ' isGatherable:::err=' + err);
                return callback(false);
            }
            var sql = "SELECT itemId, zoneId, x, y, z FROM gatherPlants WHERE zoneId = ? AND x = ? AND y = ? AND z = ?";
            connection.query(sql, [zoneId, i, j, k], function (err, results) {
                connection.release(); // always put connection back in pool right after the query
                //console.log(getPass() + ' isGatherable:::sql=' + sql);
                if (err) {
                    console.log(getFail() + ' isGatherable:::err=' + err);
                    return callback(false);
                } else {
                    //console.log(getPass() + ' isGatherable:::results=' + util.inspect(results));
                    return callback(results);
                }
            });
        });
    };






    exports.isMapMonster = function (zoneId, i, j, callback) {
        // console.log(getPass() + ' isMapMonster:::zoneId=' + zoneId + ' i=' + i + ' j=' + j);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + ' isMapMonster:::err=' + err);
                return callback(false);
            }
            var sql = "SELECT zoneId, x, y FROM monsterPlants WHERE zoneId = ? AND x = ? AND y = ?";
            connection.query(sql, [zoneId, i, j], function (err, results) {
                connection.release(); // always put connection back in pool right after the query
                //console.log(getPass() + ' isMapMonster:::sql=' + sql);
                if (err) {
                    console.log(getFail() + ' isMapMonster:::err=' + err);
                    return callback(false);
                } else {
                    // console.log(getPass() + ' isMapMonster:::results=' + util.inspect(results));
                    return callback(results, zoneId, i, j);
                }
            });
        });
    };







    /*
    exports.isMapMonster = function qryMonsterPlantsBasedOnzoneIdXY(zoneId, i, j, callback) {
      //console.log('exports.isMapMonster:::zoneId=' + zoneId + ' i=' + i + ' j=' + j);
      pool.getConnection(function(err, connection) {
      if(err) { console.log(getFail() + ' err=' + err); return callback(err); } // this should probably be false (ie. test it both ways)
      return callback(true);
                                  //    var sql = "SELECT zoneId, x, y FROM monsterPlants WHERE zoneId = ? AND x = ? AND y = ?";
                                  //    connection.query(sql, [zoneId, i, j], string, function(err, results) {
                                  //console.log('rezx='+results);
    //console.log(getPass() + 'freeConnections=' + util.inspect(connection.config.pool._freeConnections));
    connection.release(); // always put connection back in pool after last query
    sleep(50, function() { //50ms
       // executes after one second, and blocks the thread
    })
                                  //      if(err) {
                                  //        console.log(getFail() + ' isMapMonster=fail err='+err);
                                  //        return callback(false); // this should probably be set to false (ie. test it both ways)
                                  //        // @todo Log the character out, and add a console abort message???  No sessionId sent, so probably not required here.
                                  //      } else {
                                  //        if(results !="" && results != null) {
                                  //          console.log(getPass() + 'isMapMonster at i=' + i + ' j=' + j);
                                  //          console.log( getPass() + util.inspect(results) );
                                  //          return callback(string);
                                  //        } else {
                                  //          return callback(false);
                                  //        }
                                  //      }
                                  //    });
      });
    };
    */




    exports.getCharacterList = function (sessionId, callback) {
        //console.log('sessionId:' + sessionId);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + sessionId + ' err=' + err);
                return callback(false);
            }


//io.to(socket.id).emit('resLogMeOut', sessionId); // 20160330 MS: Sends back the bad sessionId to the client to check and see if the client's browser is current

var sql = "SELECT DISTINCT c.id AS charId, c.firstName AS firstName, c.lastName AS lastName FROM characters c RIGHT JOIN sessions s ON s.userId = c.userId WHERE s.id = " + mysql.escape(sessionId);


            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err || sessionId === null) {  // NOTE: Testing for sessionId===null might give unintended consequences
                    console.log(getFail() + sessionId + ' exports.getCharacterList:::err=' + err);
                    return callback(false);
                    // @TODO: Log the character out, and add a console abort message
                } else {
                    //console.log(getPass() + sessionId + ' exports.getCharacterList=' + util.inspect(results)); // useful for debugging
                    //callback(results[0].charId, results[0].firstName, results[0].lastName);
                    return callback(results);
                }
            });
        });
    };

    exports.getBank = function (sessionId, userId, charId, callback) {
        console.log(getPass() + sessionId + ' exports.getBank:::sessionId:' + sessionId + 'userId' + userId + 'charId' + charId);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + sessionId + ' err=' + err);
                return callback(false);
            }
            var sql = "SELECT b.itemId, i.name, i.image, b.quantity FROM bank b LEFT JOIN items i ON b.itemId = i.id WHERE b.charId = " + mysql.escape(charId);
            console.log(getPass() + sessionId + ' exports.getBank:::sql=' + sql);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + sessionId + ' exports.getBank:::err=' + err);
                    return callback(false);
                } else {
                    console.log(getPass() + sessionId + ' exports.getBank:::results=' + util.inspect(results)); // useful for debugging
                    return callback(results);
                }
            });
        });
    };


    exports.getInventory = function (sessionId, userId, charId, callback) {
        console.log(getPass() + sessionId + ' exports.getInventory:::sessionId:' + sessionId + 'userId' + userId + 'charId' + charId);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + sessionId + ' err=' + err);
                return callback(false);
            }
            var sql = "SELECT b.itemId, i.name, i.image, b.quantity FROM backpacks b LEFT JOIN items i ON b.itemId = i.id WHERE b.charId = " + mysql.escape(charId);
            console.log(getPass() + sessionId + ' exports.getInventory:::sql=' + sql);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + sessionId + ' exports.getInventory:::err=' + err);
                    return callback(false);
                } else {
                    console.log(getPass() + sessionId + ' exports.getInventory:::results=' + util.inspect(results)); // useful for debugging
                    return callback(results);
                }
            });
        });
    };





    exports.getMonster = function (sessionId, monsterId, callback) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + ' exports.getMonster:::err=' + err);
                return callback(false);
            }
            var sql = "SELECT name, image, audioFilename, audioMimeType FROM monsters WHERE id = ?";
            connection.query(sql, [monsterId], function (err, results) {
                connection.release(); // always put connection back in pool right after the query
                //console.log(getPass() + ' exports.getMonster:::sql=' + sql);
                if (err) {
                    console.log(getFail() + ' exports.getMonster:::err=' + err);
                    return callback(false);
                } else {
                    console.log(getPass() + ' exports.getMonster:::results=' + util.inspect(results));
                    return callback(results);
                }
            });
        });
    };







    exports.getMonstersNearMe = function (sessionId, zoneId, x, y, z, callback) {
        //console.log(getPass() + sessionId + ' exports.getMonstersNearMe:::sessionId:' + sessionId + 'zoneId=' + zoneId + 'x=' + x + 'y=' + y + 'z=' + z);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + sessionId + ' err=' + err);
                return callback(false);
            }
            var sql = "SELECT id, monsterId, hp, itemId FROM monsterPlants WHERE zoneId = " + mysql.escape(zoneId) + " AND x = " + mysql.escape(x) + " AND y = " + mysql.escape(y) + " AND z = " + mysql.escape(z) + " AND hp > 0";
            //console.log(getPass() + sessionId + ' exports.getMonstersNearMe:::sql=' + sql);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + sessionId + ' exports.getMonstersNearMe:::err=' + err);
                    return callback(false);
                    // @todo: Log the character out, and add a console abort message
                } else {
                    //console.log(getPass() + sessionId + ' exports.getMonstersNearMe:::results=' + util.inspect(results)); // useful for debugging
                    return callback(results);
                }
            });
        });
    };




















    exports.deleteLootFromGatherPlants = function (sessionId, zoneId, x, y, z, c, itemId, callback) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + ' getLootFromGatherPlants:::err=' + err);
                return callback(false);
            }
            var sql = "DELETE FROM gatherPlants WHERE zoneId = " + mysql.escape(zoneId) + " AND zoneId = " + mysql.escape(zoneId) + " AND x = " + mysql.escape(x) + " AND y = " + mysql.escape(y) + " AND z = " + mysql.escape(z) + " AND itemId = " + mysql.escape(itemId) + " LIMIT 1";
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + 'err=' + err);
                    return callback(false); // this should probably be set to false
                }
                //console.log('results='+util.inspect(results)); // useful for debugging
                //console.log('results = ' + results[0].password);
                return callback(results);
            });
        });
    };
    exports.getLootFromGatherPlants = function (sessionId, zoneId, x, y, z, c, callback) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + ' getLootFromGatherPlants:::err=' + err);
                return callback(false);
            }
            var sql = "SELECT itemId FROM gatherPlants WHERE zoneId = " + mysql.escape(zoneId) + " AND zoneId = " + mysql.escape(zoneId) + " AND x = " + mysql.escape(x) + " AND y = " + mysql.escape(y) + " AND z = " + mysql.escape(z) + " LIMIT 1";
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + 'err=' + err);
                    return callback(false); // this should probably be set to false
                }
                //console.log('results='+util.inspect(results)); // useful for debugging
                //console.log('results = ' + results[0].password);
                if (results.length === 0) {
                    //console.log('results are undefined');
                    return callback(false);
                } else {
                    //console.log('results are not undefined');
                    return callback(results[0].itemId);
                }
            });
        });
    };


    exports.getPassword = function (email, callback) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                return callback(true);
            }
            var sql = "SELECT id, password FROM users WHERE email = " + mysql.escape(email) + " LIMIT 1";
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + 'err=' + err);
                    return callback(true); // this should probably be set to false
                }
                //console.log('results='+util.inspect(results)); // useful for debugging
                //console.log('results = ' + results[0].password);
                return callback(results[0].id, results[0].password); // userId, password
            });
        });
    };
    exports.getSpeakMyName = function (sessionId, charId, callback) {
        //console.log(getPass() + sessionId + ' charId=' + charId);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                return callback(false);
            }
            var sql = "SELECT c.firstName AS firstName, c.lastName AS lastName FROM characters c LEFT JOIN sessions s ON  s.userId = c.userId WHERE s.id = " + mysql.escape(sessionId) + " AND c.id = " + mysql.escape(charId);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err || sessionId === null) {  // NOTE: Testing for sessionId===null might give unintended consequences
                    console.log(getFail() + sessionId + ' exports.getSpeakMyName:::err=' + err);
                    return callback(false);
                    // @TODO: Log the character out, and add a console abort message
                } else {
                    //console.log(getPass() + sessionId + ' exports.getSpeakMyName:::results=' + util.inspect(results)); // useful for debugging
                    return callback(results[0].firstName, results[0].lastName);
                }
            });
        });
    };


    exports.setCharacterHpRevised = function (id, charHpRevised, callback) {
        console.log(getPass() + 'exports.setCharacterHpRevised:::id:' + id + 'charHpRevised=' + charHpRevised);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                return callback(false);
            }
            var sql = "UPDATE characters SET hpCurrent = ? WHERE id = ? LIMIT 1";
            connection.query(sql, [charHpRevised, id], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + ' exports.setCharacterHpRevised:::err=' + err);
                    return callback(false);
                } else {
                    console.log(getPass() + 'exports.setCharacterHpRevised:::results=' + util.inspect(results)); // useful for debugging
                    return;
                }
            });
        });
    };



    /** 
      * exports.setMonsterPlantsDamage
      *
      **/
    exports.setMonsterPlantsDamage = function (id, hp, damage, callback) {
        //console.log(getPass() + 'exports.setMonsterPlantsDamage:::id:' + id + 'hp=' + hp + 'damage=' + damage);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                return callback(true);
            }
            var sql = "UPDATE monsterPlants SET hp = " + mysql.escape(hp) + " WHERE id = " + mysql.escape(id);
            //console.log(getPass() + ' exports.setMonsterPlantsDamage:::sql = ' + sql);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + ' exports.setMonsterPlantsDamage:::err=' + err);
                    return callback(false);
                    // @TODO: Log the character out, and add a console abort message
                } else {
                    //console.log(getPass() + 'exports.setMonsterPlantsDamage:::results=' + util.inspect(results)); // useful for debugging
                    return callback(true);
                }
            });
        });
    };
    exports.setUserCoordinates = function (sessionId, zoneId, x, y, z, c, callback) {
        //console.log(getPass() + sessionId + ' exports.setUserCoordinates:::sessionId:' + sessionId + 'zoneId=' + zoneId + 'x=' + x + 'y=' + y + 'z=' + z + 'c=' + c);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                return callback(true);
            }
            var sql = "UPDATE sessions SET zoneId=" + mysql.escape(zoneId) + ", x=" + mysql.escape(x) + ", y=" + mysql.escape(y) + ", z = " + mysql.escape(z) + ", c = " + mysql.escape(c) + " WHERE id = " + mysql.escape(sessionId);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + sessionId + ' exports.setUserCoordinates:::err=' + err);
                    return callback(false);
                    // @TODO: Log the character out, and add a console abort message
                } else {
                    //console.log(getPass() + sessionId + ' exports.setUserCoordinates:::results=' + util.inspect(results)); // useful for debugging
                    return callback(sessionId, zoneId, x, y, z, c);
                }
            });
        });
    };
    exports.speak = function (firstName, lastName, filename, prefix, callback) {
        // @TODO: If a firstName or lastName has a space in it, we might get an error here, so we might have to rewrite this
        //        so there is an escaped space within those.
        var string = prefix.concat('\\ ').concat(firstName).concat('\\ ').concat(lastName);
        //console.log('string222=' + string);
        // exec("/usr/bin/flite -t "+string+" -o /var/www/mmorpg/audio/" + filename, puts);
        //console.log('exports.speak=' + prefix + firstName + lastName + filename);
        execSync("/usr/bin/flite -t " + string + " -o /var/www/mmorpg/audio/" + filename);  // Synchronous Exec in Node.js
        return callback(filename);
    };

    exports.updateSessionWithCharId = function (sessionId, charId, callback) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                return callback(false);
            }
            var sql = "UPDATE sessions SET charId=" + mysql.escape(charId) + " WHERE id = " + mysql.escape(sessionId);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    return callback(false);
                } else {
                    return callback(true);
                }
            });
        });
    };



















    // on server started we can load our client html page
    //app.get("/", function (req, res) {
    app.get("/", function (req, res) {
        /*jslint nomen:true*/
        res.sendFile(__dirname + "/index.html");
        /*jslint nomen:false*/
        //res.send('<h1>hello world</h1>');
    });


    ///////////////////////////////////////////////////////////////////////////////
    // PSUEDO INITTAB - This is the stuff that runs at startup
    ///////////////////////////////////////////////////////////////////////////////
    wipeAudioDynamic();
    console.log(getPass() + 'wipeAudioDynamic() started - this is a one-time event');


    ///////////////////////////////////////////////////////////////////////////////
    // CRON JOBS
    ///////////////////////////////////////////////////////////////////////////////
    // EVERY SECOND
    setInterval(function () {
        //console.log(getPass() + onlineClients + ' clients online');  // Every second, show the number of onlineClients
    }, 1000);



    /* Sound is too loud for Aron Shack, but turned on again */
    /* 20160330 MS:  Maybe this background music needs to be re-encoded at a lower volume level?  Just a thought */
    setInterval(function () {

        var min = 1,
            max = 12, // If this is 696969, set it to the correct number.  If it's set to 696969, it's to disable the music during programming.
            random_number = Math.floor(Math.random() * (max - min + 1)) + min,
            filename = "";
        switch (random_number) {
        case 1:
            filename = "music/Ai+Vis+Lo+Lop.mp3"; // irish blabber
            break;
        case 2:
            filename = "music/D.mp3"; // latino music
            break;
        case 3:
            filename = "music/Embraced+By+The+Shadows.mp3"; // siren repeated ad nauseum
            break;
        case 4:
            filename = "music/Frei.mp3"; // foreign schlep
            break;
        case 5:
            filename = "music/Peasants+promise.mp3"; // 90000 sounds great on this one
            break;
        case 6:
            filename = "music/Prince+Waldecks+Galliard.mp3";
            break;
        case 7:
            filename = "music/Return+To+The+Winter+Garden.mp3";
            break;
        case 8:
            filename = "music/Saltarello.mp3";
            break;
        case 9:
            filename = "music/Tarantarmoricana.mp3";
            break;
        case 10:
            filename = "music/TheDrunkenSailor.mp3";
            break;
        case 11:
            filename = "music/What+shell+we+do+with+the+drunken+sailor.mp3";
            break;
        default:
            filename = ""; // quietness
            break;
        }
        io.emit('audioSoundtrack', filename);  // NOTE:  This is a special implementation of io.emit because it sends the message to global chat instead of to an individual
    }, 90000);


    // HOURLY - Every 3,600 seconds, respawn the map.  Interestingly, if the server goes down, the map doesn't get respawned until an hour passes of successful running.
    setInterval(function () {
        console.log(getPass() + 'Hourly Cron Started');

        var string = "System\\ Respawning",
            filename = "systemrespawning.wav";
        execSync("/usr/bin/flite -t " + string + " -o /var/www/mmorpg/audio/" + filename);  // Synchronous Exec in Node.js
        io.emit('audioSystemMessage', filename);// NOTE:  This is a special implementation of io.emit because it sends the message to global chat instead of to an individual

        spawnWipeGathers();
        spawnWipeMonsters();

        spawnInitializeGathers();
        spawnInitializeMonsters();
    }, 60000);  // @todo SINCE WE'RE IN DEVELOPMENT, I'M CHANGING THIS FROM 3,600,000ms (1 hour) to 60,000ms (1 minute) to 6,000ms = 10 seconds



    ///////////////////////////////////////////////////////////////////////////////
    // W E B   S O C K E T   C O N N E C T I O N
    ///////////////////////////////////////////////////////////////////////////////
    io.on('connection', function (socket) {

        io.to(socket.id).emit('resSessionId', socket.id);

        console.log(getPass() + ' socket.id=' + socket.id  + ' user connected from ' + util.inspect(socket.handshake.address) + ' using ' + util.inspect(socket.handshake.headers['user-agent']));
        onlineClients = onlineClients + 1;

        /////////////////////////////////////////////////////////////////////////////
        // DISCONNECT
        /////////////////////////////////////////////////////////////////////////////
        socket.on('disconnect', function () {
            onlineClients = onlineClients - 1;
            console.log(getPass() + 'user disconnected from ' +  util.inspect(socket.handshake.address) + ' using ' + util.inspect(socket.handshake.headers['user-agent']));
        });

        /////////////////////////////////////////////////////////////////////////////
        // CHAT
        /////////////////////////////////////////////////////////////////////////////
        socket.on('chat message', function (msg) {
            //console.log(getPass() + 'message: ' + msg);
            io.emit('chat message', msg);  // NOTE:  This is a special implementation of io.emit because it sends the message to global chat instead of to an individual
        });

        /////////////////////////////////////////////////////////////////////////////
        // SIGNIN
        /////////////////////////////////////////////////////////////////////////////
        socket.on('login', function (msg) {
            // Take msg JSON array and split it into vars:  email and password
            //console.log('message: ' + msg);
            var parsed = JSON.parse(msg);
            //console.log('email:' + parsed.email + ' password:' + parsed.password);

            // Do a mysql lookup to see if the information is correct
            // if it is correct, then log them in.

            exports.getPassword(parsed.email, function (userId, realPassword) { // the result from the callback is userId and realPassword
                // Generate sessionId
                var sessionId = "",
//                    possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
//                    i,
                    response = "fail";
                if (realPassword === parsed.password) {
                    //response = "pass";
                    //var now = new Date().getTime();
                    //console.log(getPass() + parsed.email + ' passed login with userId ' + userId);

                    /* OLD WAY:
                    // @TODO:  Session ID is only 5 alphanumeric characters right now.  This needs to be increased higher later.
                    for (i = 0; i < 5; i = i + 1) {
                        sessionId += possible.charAt(Math.floor(Math.random() * possible.length));
                    }
                    // Insert sessionId into db
                    exports.generateSession(sessionId, userId, function (sessionId) { // the response is the sessionid, or false
                        io.to(socket.id).emit('login response', sessionId);  // User passed login, so tell him the sessionId
                    });
                    */
                    // NEW WAY:  The socket.id is the sessionId
                    // Insert sessionId into db
                    exports.generateSession(socket.id, userId, function (sessionId) { // the response is the sessionid, or false
                        io.to(socket.id).emit('login response', sessionId);  // User passed login, so tell him the sessionId
                    });

                } else {
                    // if not, send them a failed message.
                    response = "fail";
                    console.log(getFail() + 'user failed login with email ' + parsed.email + ' and password ' + parsed.password);
                    io.to(socket.id).emit('login response', response);  // EMITS RESPONSE OF pass OR fail UPON LOGIN
                }
            });
        });


        /**
         * socket.on('getMonsters'
         * @param {type} msg
         * @returns {undefined}
         * @todo    20150225  SQL QUERY TO DB TO GET MONSTERS NEAR CHARACTER
         */
        socket.on('getMonsters', function (msg) {
            var sessionId = msg;
            return sessionId; // THIS IS A FAKE return atm.  Not sure if I should return true, false, this , or something else.
            //
            // 
            //
            //                  REWRITE MONSTERS DIV POSSIBLY HERE?????????????????  IF SO, IT'LL STAGE UP THE MONSTERS ON THE SCREEN
            //
        });


        /////////////////////////////////////////////////////////////////////////////
        // ATTACK
        /////////////////////////////////////////////////////////////////////////////
        socket.on('reqAttack', function (msg) {
            var sessionId = msg,
                row;
            // Get Coordinates based on SessionId
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                //console.log(getPass() + sessionId + ' exports.getUserCoordinates' + zoneId + x + y + z); // Don't need c
                // Get the monsters near the user's coordinates
                exports.getMonstersNearMe(sessionId, zoneId, x, y, z, function (results) { // The callback is sending us results
                    //console.log(getPass() + sessionId + 'reqAttack:::results=' + results);
                    var damage = getRandom3d6(),
                        characterDamage = getRandom3d6(),
                        newHp = 0;
                    for (row in results) {
                        //console.log('row=' + row);
                        //console.log('id=' + results[row].id);
                        //console.log('itemId=' + results[row].itemId);
                        var itemId = results[row].itemId;
                        //console.log('monsterId=' + results[row].monsterId);
                        console.log('hp=' + results[row].hp);
                        // @TODO:  REDRAW MONSTER LAYER

                        //console.log('damage = ' + damage);
                        newHp = results[row].hp - damage;

                        // Apply damage - for each monster id, send the damage (return 1 if dead), and see if i killed it (ie. loot bag drops)
                        exports.setMonsterPlantsDamage(results[row].id, newHp, damage, function (result) {
                            io.to(socket.id).emit('monsterDamageNumber', damage);
                            // simply just updates the hp (even if negative)
                            // Since I don't care about the result callback, I should probably not use a callback here
                            //console.log(getPass() + sessionId + ' setMonsterPlantsDamage result=' + result);
                        });

                        // Is Dead?
                        if (damage >= results[row].hp) {
                            // Monster is dead - Drop Loot based on monsterId

                            exports.insertLootIntoGatherPlants(sessionId, zoneId, x, y, z, itemId);  // Insert Loot into the gatherPlants table

                            io.to(socket.id).emit('monsterWipe');
                            io.to(socket.id).emit('show interactive', '(F) Get Loot'); // Shows the interactive window
                            //console.log(getPass() + sessionId + ' monster is dead');
                        } else {
                            //console.log(getPass() + sessionId + ' monster is still alive');

                            // Monster attacks character
                            // Get the character id first, then apply damage
                            exports.getUserIdAndCharId(sessionId, zoneId, x, y, z, c, function (userId, charId) { // The callback is sending userId and charId
                                console.log('userId=' + userId + ' charId=' + charId);
                                exports.getCharacter(sessionId, charId, function (results2) {  // The callback is sending results2
                                    console.log('results2=' + util.inspect(results2));
                                    // Get the character's hp, then subtract the damage, 
                                    var charHpRevised = results2[0].hpCurrent - characterDamage,
                                        charHpMax = results2[0].hpMax;
                                    // USED AS AN EXAMPLE ONLY.... I WOULD NOT PREFER TO SHOW THIS METHOD DURING A FIGHT AS THERE IS A HEALTH BAR WITH THE SAME INFO:// io.to(socket.id).emit('resAlertFlash', 'characterDamage=' + characterDamage);
                                    console.log('results2[0].hpCurrent = ' + results2[0].hpCurrent + ' characterDamage=' + characterDamage);
                                    console.log('charHpRevised=' + charHpRevised);
                                    exports.setCharacterHpRevised(charId, charHpRevised, function (result3) {
                                    });
                                    console.log('charHpRevised=' + charHpRevised);
                                    console.log('charHpMax=' + charHpMax);

                                    var hpBarBodyCurrentPercentage = parseInt(charHpRevised / charHpMax * 1000) / 10;  // show 1 decimal place as a percentage
                                    var JSONobj = JSON.stringify({
                                        resCharHealthBarBodyCurrent: [charHpRevised, hpBarBodyCurrentPercentage]
                                    });

                                    io.to(socket.id).emit('charHealthBarBody', JSONobj);  // Show the changing health bar on the screen

                                    // Is the character dead?
                                    if (characterDamage >= results2[0].hpCurrent) {
                                        console.log('character is dead');
// @todo:  emit character dead (new thing to write)
// UNTESTED YET:  io.to(socket.id).emit('resAlertFlash', 'YOU ARE DEAD!');
                                    }
                                });
                            });
                        }
                        // @TODO: Show damage numbers on screen
                    }
                });
            });
        });

        /////////////////////////////////////////////////////////////////////////////
        // CHARACTER SELECT and CHARACTER-related ACTIVITIES
        /////////////////////////////////////////////////////////////////////////////
        socket.on('reqCharacterList', function (msg) {
            //console.log(getPass() + ' heyheynow msg=' + msg);
            var sessionId = msg;
            // SELECT the user's coordinates x,y,z,compass based on their sessionId
            exports.getCharacterList(sessionId, function (results) {  // The callback is sending us results
                //console.log('sResults=' + results + util.inspect(results));
                var html = "",
                    row;
                for (row in results) {
                    //console.log('row=' + row);
                    //console.log('charId=' + results[row].charId);
                    //console.log('firstName=' + results[row].firstName);
                    //console.log('lastName=' + results[row].lastName);
                    html = html.concat("<div class=\"characterSelectItem\"><span class=\"charId\">" + results[row].charId + "</span><span class=\"name\">" + results[row].firstName + " " + results[row].lastName + "</span></div>");
                    //@TODO: Add functionality to add a character via the store, or show empty slots
                    //       from which the user can choose upon to create a new character.  Basically,
                    //       we're adding onto this html some more options for the user.
                }
                io.to(socket.id).emit('resCharacterList', html);
            });
        });


        socket.on('reqSpeakMyName', function (sessionId, charId) {
            //console.log(getPass() + sessionId + ' reqSpeakMyName=' + ' ' + charId);

            exports.updateSessionWithCharId(sessionId, charId, function (result) {
                if (result === false) {
                    console.log('exports.updateSessionWithCharId returned false which means it could not find the session in the sessions table.  sessionId=' + sessionId + ' charId=' + charId);
                }
            });

            exports.getSpeakMyName(sessionId, charId, function (firstName, lastName) {
                var prefix = 'Welcome',
                    filename = "dynamic/" + sessionId + "-" + charId + ".wav";
                //console.log(getPass() + sessionId + ' getSpeakMyName:firstName=' + firstName + ' lastName=' + lastName);
                //console.log(getPass() + sessionId + ' filename=' + filename);
                exports.speak(firstName, lastName, filename, prefix, function (filename) {
                    //console.log(getPass() + sessionId + ' exports.speak:::' + prefix + firstName + lastName + '. filename=' + filename);
                });
                io.to(socket.id).emit('audioPlay', filename);

                io.to(socket.id).emit('resAlertFlash', 'Welcome ' + firstName + " " + lastName);
            });
        });


        /////////////////////////////////////////////////////////////////////////////
        // INTERACTIVE - get loot or open bank
        /////////////////////////////////////////////////////////////////////////////
        socket.on('reqInteractive', function (msg) {  // F or f key pressed
            var sessionId = msg;
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                console.log(getPass() + sessionId + ' getUserCoordinates ' + sessionId + ' ' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c);

                exports.getLootFromGatherPlants(sessionId, zoneId, x, y, z, c, function (itemId) {  // The callback is sending us itemId
                    console.log(getPass() + sessionId + ' getLootFromGatherPlants ' + sessionId + ' itemId=' + itemId);

                    exports.deleteLootFromGatherPlants(sessionId, zoneId, x, y, z, c, itemId, function (result) {  // The callback is sending us result
                        console.log(getPass() + sessionId + ' deleteLootFromGatherPlants ' + sessionId + ' ' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c + ' result=' + result);
                    });

                    exports.getUserIdAndCharId(sessionId, zoneId, x, y, z, c, function (userId, charId) {  // The callback is sending us userId, charId
                        console.log(getPass() + sessionId + ' getUserIdAndCharId:::sessionId=' + sessionId + ' userId=' + userId + ' charId=' + charId);

                        var quantity = 1;  // @TODO: Phase 2 quantity should be based on something other than a fixed amount of 1

                        if (itemId !== 0 && itemId !== false) { // fixed bug because false was appearing instead of 0
                            exports.insertLootIntoBackpack(sessionId, zoneId, x, y, z, c, itemId, userId, charId, quantity, function (result) {  // The callback is sending us result
                                console.log(getPass() + sessionId + ' insertLootIntoBackpack ' + sessionId + ' ' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c + ' result=' + result);
                                io.to(socket.id).emit('heyAskForInventory', msg);
                            });
                        }
                    });
                });
            });
        });


        /////////////////////////////////////////////////////////////////////////////
        // BANK
        /////////////////////////////////////////////////////////////////////////////
        socket.on('reqBank', function (msg) {
            var sessionId = msg;
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                exports.getUserIdAndCharId(sessionId, zoneId, x, y, z, c, function (userId, charId) { // The callback is sending userId, charId
                    exports.getInventory(sessionId, userId, charId, function (results) {  // The callback is sending us results
                        console.log('results=' + util.inspect(results));
                        var JSONobj = JSON.stringify({
                            resBankMyBackpack: results
                        });
                        io.to(socket.id).emit('resBankMyBackpack', JSONobj);

                        exports.getBank(sessionId, userId, charId, function (results) {  // The callback is sending us results
                            console.log('results=' + util.inspect(results));
                            var JSONobj = JSON.stringify({
                                resBankMyBank: results
                            });
                            io.to(socket.id).emit('resBankMyBank', JSONobj);
                        });

                    });
                });
            });
        });



        /////////////////////////////////////////////////////////////////////////////
        // INVENTORY
        /////////////////////////////////////////////////////////////////////////////
        socket.on('reqInventory', function (msg) {   // I or i key pressed
            var sessionId = msg;
/*
            var JSONobj = '['
                    + '{'
                    + '"itemId" : ' + '1' + ','
                    + '"name" : ' + '"Apple"' + ','
                    + '"image" : ' + '"apple.gif"' + ','
                    + '"quantity" : ' + '1'
                    + '},'
                    + '{'
                    + '"itemId" : ' + '1' + ','
                    + '"name" : ' + '"Apple"' + ','
                    + '"image" : ' + '"apple.gif"' + ','
                    + '"quantity" : ' + '1'
                    + '}'
                    + ']';
            io.to(socket.id).emit('resInventory', JSONobj);
*/
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                exports.getUserIdAndCharId(sessionId, zoneId, x, y, z, c, function (userId, charId) { // The callback is sending userId, charId
                    exports.getInventory(sessionId, userId, charId, function (results) {  // The callback is sending us results
                        console.log('results=' + util.inspect(results));
                        var JSONobj = JSON.stringify({
                            resInventory: results
                        });
                        io.to(socket.id).emit('resInventory', JSONobj);
                    });
                });
            });
        });


        /////////////////////////////////////////////////////////////////////////////
        // NAVIGATION and MAP
        /////////////////////////////////////////////////////////////////////////////
        socket.on('turn right', function (msg) {   // d key pressed
            var sessionId = msg;
            //console.log(getPass() + sessionId + ' turn right: ' + msg);
            // SELECT the user's coordinates x,y,z,compass based on their sessionId
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                //console.log(getPass() + sessionId + ' turn right:::exports.getUserCoordinates:::' + zoneId + x + y + z + c);
                // Calculate the change in coordinates
                c = c + 45;
                if (c >= 360) {  // If the compass is greater than 360 degrees
                    c = c - 360;  // then subtract 360 degrees from the compass
                }
                // UPDATE the user's coordinates in the db
                exports.setUserCoordinates(sessionId, zoneId, x, y, z, c, function (result) {  // The callback is sending us zoneId,x,y,z,c
                    //console.log(getPass() + sessionId + ' turn right:::exports.setUserCoordinates ' + sessionId + ' ' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c + ' result=' + result);
                });
                // Send zoneId,x,y,z,c coordinates back to the user
                var JSONobj = '{'
                        + '"zoneId" : ' + zoneId + ','
                        + '"x" : ' + x + ','
                        + '"y" : ' + y + ','
                        + '"z" : ' + z + ','
                        + '"c" : ' + c
                        + '}';
                io.to(socket.id).emit('resTurnRight', JSONobj);
                // @TODO: See if there's something to gather and have it show/hide the gathering window
                // isGatherable(sessionId,zoneId,x,y,z);
            });
        });

        socket.on('turn left', function (msg) {   // a key pressed
            var sessionId = msg;
            //console.log(getPass() + sessionId + ' turn left: ' + msg);
            // SELECT the user's coordinates zoneId,x,y,z,compass based on their sessionId
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                //console.log(getPass() + sessionId + ' turn left:::exports.getUserCoordinates' + zoneId + x + y + z + c);
                // Calculate the change in coordinates
                c = c - 45;
                if (c < 0) {     // if compass is less than 0 degrees
                    c = c + 360;  // then add 360 degrees to it
                }
                // UPDATE the user's coordinates in the db
                exports.setUserCoordinates(sessionId, zoneId, x, y, z, c, function (result) {  // The callback is sending us zoneId,x,y,z,c
                    //console.log(getPass() + sessionId + ' turn left:::exports.setUserCoordinates ' + sessionId + ' ' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c + ' result=' + result);
                });
                // Send zoneId,x,y,z,c coordinates back to the user
                var JSONobj = '{'
                    + '"zoneId" : ' + zoneId + ','
                    + '"x" : ' + x + ','
                    + '"y" : ' + y + ','
                    + '"z" : ' + z + ','
                    + '"c" : ' + c
                    + '}';
                io.to(socket.id).emit('resTurnLeft', JSONobj);
                // @TODO: See if there's something to gather and have it show/hide the gathering window
                // isGatherable(sessionId,zoneId,x,y,z);
            });
        });

        socket.on('walk forward', function (msg) {    // w key pressed
            var sessionId = msg;
            //console.log(getPass() + sessionId + ' walk forward: ' + msg);
            // SELECT the user's coordinates zoneId,x,y,z,compass based on their sessionId
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                //console.log(getPass() + sessionId + ' walk forward:::exports.getUserCoordinates' + zoneId + x + y + z + c);
                // Calculate the change in coordinates
                if (c < 90 || c > 270) {
                    y = y + 1;
                }
                if (c > 90 && c < 270) {
                    y = y - 1;
                }
                if (c > 0 && c < 180) {
                    x = x + 1;
                }
                if (c > 180 && c < 360) {
                    x = x - 1;
                }
                // UPDATE the user's coordinates in the db
                exports.setUserCoordinates(sessionId, zoneId, x, y, z, c, function (result) {  // The callback is sending us zoneId,x,y,z,c
                    //console.log(getPass() + sessionId + ' walk forward:::exports.setUserCoordinates ' + sessionId + ' ' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c + ' result=' + result);
                });
                // Send x,y,z,c coordinates back to the user
                var JSONobj = '{'
                        + '"zoneId" : ' + zoneId + ','
                        + '"x" : ' + x + ','
                        + '"y" : ' + y + ','
                        + '"z" : ' + z + ','
                        + '"c" : ' + c
                        + '}';
                io.to(socket.id).emit('resWalkForward', JSONobj);

                // @TODO: See if there's something to gather and have it show/hide the gathering window
                exports.isGatherable(sessionId, zoneId, x, y, z, function (results) {
                    console.log('results = ', results);
                    if (results.length !== 0) {
                        var row;
                        for (row = 0; row < results.length; row = row + 1) {
                            io.to(socket.id).emit('show interactive', '(F) Get Loot'); // Shows the interactive window
                        }
                    } else {
                        io.to(socket.id).emit('hide interactive', msg);
                    }
                });


                // @TODO:  Rewrote this to pull monsters from database
/* OLD WAY:
                if (x === 5 && y === 5) {
                    var name = "Chicken",
                        filename = "/images/chicken.png",
                        JSONobj = '{'
                            + '"zoneId" : ' + zoneId + ','
                            + '"filename" : "' + filename + '",'
                            + '"y" : ' + y + ','
                            + '"z" : ' + z + ','
                            + '"c" : ' + c
                            + '}';
                    io.to(socket.id).emit('monsterDraw', JSONobj);
                    var filename = "monster_sfx/chicken-1.wav",
                        mimetype = "audio/wav",
                        JSONobj = '{'
                            + '"zoneId" : ' + zoneId + ','
                            + '"filename" : "' + filename + '",'
                            + '"y" : ' + y + ','
                            + '"z" : ' + z + ','
                            + '"mimetype" : "' + mimetype + '"'
                            + '}';
                    io.to(socket.id).emit('audioMonsterSFX', JSONobj);
                }
NEW WAY:
*/

                exports.getMonstersNearMe(sessionId, zoneId, x, y, z, function (results) { // The callback is sending us results
                    var row;
                    if (results.length === 0) {
                        io.to(socket.id).emit('monsterWipe', sessionId);  // If no monsters are around, wipe the monster image
                    } else {
                        // else, monsters are around me, so show image and audio
                        for (row in results) {
                            var monsterId = results[row].monsterId;
                            exports.getMonster(sessionId, monsterId, function (results2) { // The callback is sending us results2
                                console.log(getPass() + sessionId + ' foobar3323525 ' + util.inspect(results2));
                                var JSONobj = JSON.stringify({
                                    monsterInfo: results2
                                });
                                io.to(socket.id).emit('monsterDraw', JSONobj);  // send the monster image
                                io.to(socket.id).emit('audioMonsterSFX', JSONobj);  // send the monster audio track
                            });
                        }
                    }
                });







            });
        });

        socket.on('walk backward', function (msg) {    // x key pressed
            var sessionId = msg;
            //console.log(getPass() + sessionId + ' walk backward: ' + msg);
            // SELECT the user's coordinates zoneId,x,y,z,compass based on their sessionId
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                //console.log(getPass() + sessionId + ' walk backward:::exports.getUserCoordinates' + zoneId + x + y + z + c);
                // Calculate the change in coordinates
                if (c < 90 || c > 270) {
                    y = y - 1;
                }
                if (c > 90 && c < 270) {
                    y = y + 1;
                }
                if (c > 0 && c < 180) {
                    x = x - 1;
                }
                if (c > 180 && c < 360) {
                    x = x + 1;
                }
                // UPDATE the user's coordinates in the db
                exports.setUserCoordinates(sessionId, zoneId, x, y, z, c, function (result) {  // The callback is sending us zoneId,x,y,z,c
                    //console.log(getPass() + sessionId + ' walk backward:::exports.setUserCoordinates ' + sessionId + ' ' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c + ' result=' + result);
                });
                // Send x,y,z,c coordinates back to the user
                var JSONobj = '{'
                    + '"zoneId" : ' + zoneId + ','
                    + '"x" : ' + x + ','
                    + '"y" : ' + y + ','
                    + '"z" : ' + z + ','
                    + '"c" : ' + c
                    + '}';
                io.to(socket.id).emit('resWalkBackward', JSONobj);
                // @TODO: See if there's something to gather and have it show/hide the gathering window
                // isGatherable(sessionId,zoneId,x,y,z);
            });
        });





/* This is better but not perfect */
        socket.on('reqDrawMap', function (sessionId) {
            //console.log('exports.reqDrawMap sessionId=' + sessionId);
            async.series([
                function (callback) {
                    exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {
                        //var results = {"zoneId" : zoneId, "x" : x, "y" : y, "z" : z, "c" : c};
//                        //console.log('zoneId=' + zoneId + ' x=' + x + ' y=' + y + ' z=' + z + ' c=' + c);
                        return callback(null, zoneId, x, y, z, c);
                    });
//                },
//                function (callback) {
//                    callback(null, 'two');
                }
            ],
                function (err, results) {
//                    //console.log('ZZZZZoneId=' + results);
//                    if (err) {
//                        console.log('err=' + util.inspect(err));
//                        //callback(false);
//                    } else {
//                    //console.log('zzzzzoneId=' + results[0][0] + ' x=' + results[0][1] + ' y=' + results[0][2] + ' z=' + results[0][3] + ' c=' + results[0][4]);
                    var x = results[0][1],
                        y = results[0][2],
                        i = x - 5,
                        j = y + 5;
                    var string = '';
                    for (j = y + 5; j > y - 6; j = j - 1) { // y-coordinate top to bottom
                        for (i = x - 5; i < x + 6; i = i + 1) { // x-coordinate left to right
                            async.series([
                                function (callback) {
                                    exports.isMapMonster(results[0][0], i, j, function (results, zoneId, i, j) {
//                                        //console.log('rez=' + results + ' zoneId=' + zoneId + ' i=' + i + ' j=' + j);
                                        return callback(results, zoneId, i, j);
                                    });
//                                    },
//                                    function (callback) {
//                                        return callback(null, 'four');
                                }
                            ],
                                function (results, coords) {
//                                    //console.log('rezz=' + results + ' zoneId=' + coords[0][0] + ' i=' + coords[0][1] + ' j=' + coords[0][2]);
                                    if (results.length !== 0) {
                                        //console.log('not empty' + util.inspect(results) + 'not empty' + results.length);
                                        string = string.concat("<div class=mapCoord><i class=icon-group></i></div>");
                                    } else {
                                         string = string.concat("<div class=mapCoord>" + coords[0][1] + "," + coords[0][2] + "</div>");
                                    }
//                                        if (err !== "undefined") {
//                                            //console.log('errr=' + util.inspect(err));
//                                            //return callback(false);
//                                        } else {
                                        //results now ['one','two']
//                                    console.log('results=' + results);
                                    var mapY,
                                        JSONobj;

                                    mapY = y - 724;

                                    JSONobj = '{'
                                        + '"string" : "' + string + '",'
                                        + '"x" : ' + x + ','
                                        + '"y" : ' + mapY
                                        + '}';
                                    io.to(socket.id).emit('resDrawMap', JSONobj);
//                                        }
                                });
                        }
                        string = string.concat("<div class=mapCR>&nbsp;</div>"); // NOTE: This is mapCR, the fake carriage return
                    }
//                    }
                });
        });




/* this is looking better:
        socket.on('reqDrawMap', function (sessionId) {
            //console.log('exports.reqDrawMap sessionId=' + sessionId);
            async.series([
                function (callback) {
                    exports.getUserCoordinates(sessionId, function(zoneId, x, y, z, c) {
                        //callback(null, 'one');
                        return callback(zoneId, x, y, z, c);
                    });
                },
                function (callback) {
                    return callback(null, 'two');
                }
            ],
                function (err, results) {
                    if (err) {
                        console.log('err=' + err);
                        return callback(false);
                    } else {
                        //results now ['one','two']
                        //console.log('results=' + results);
                        var mapY,
                            JSONobj,
                            string = results,
                            x = 0,
                            y = 0;

                        mapY = y - 724;

                        JSONobj = '{'
                                + '"string" : "' + string + '",'
                                + '"x" : ' + x + ','
                                + '"y" : ' + mapY
                                + '}';
                        io.to(socket.id).emit('resDrawMap', JSONobj);
                    }
                }
                );
        });
*/








/* THIS WORKS:
        socket.on('reqDrawMap', function (sessionId) {
            var finished = _.after(2, doRender); // If these two async functions are finished, doRender

            exports.getUserCoordinates(sessionId, function(err, res) {
                if(err) {
                    console.log('error');
                }
                //
                finished();
            });
            exports.getUserCoordinates(sessionId, function(err, res) {
                if(err) {
                    console.log('error');
                }
                //
                finished();
            });
            function doRender() {
                var string, x = 0, y = 0, mapY = 0, JSONobj;
                string = 'hello world';
                
                    // Since the map's image is currently set to 1280x1024 and the h x w is 300x300,
                    // we take 300-1024 = -724, so we subtract that to force the image to begin
                    // in the bottom left corner.
                    mapY = y - 724;

                    JSONobj = '{'
                            + '"string" : "' + string + '",'
                            + '"x" : ' + x + ','
                            + '"y" : ' + mapY
                            + '}';
                    io.to(socket.id).emit('resDrawMap', JSONobj);
            };
        });
*/


/* this is broken:
        exports.getMapIcon = function (sessionId, zoneId, i, j, x, y, callback) {
            var string = '';
            var flag = undefined;
            for (j = y + 5; j > y - 6; j = j - 1) { // y-coordinate top to bottom
                for (i = x - 5; i < x + 6; i = i + 1) { // x-coordinate left to right
                    async.series({
                        one: function (callback) {
                            //console.log('a');
                            return callback(null, 'one');
                        },
                        isMapMonster: function (callback) {
                            //console.log('Attempting isMapMonster');
                            //console.log(getPass() + sessionId + ' Attempting isMapMonster x=' + x + ' y=' + y + ' i=' + i + ' j=' + j + ' zoneId=' + zoneId);
                            exports.isMapMonster(zoneId, i, j, function (results, zoneId, i, j) {
                                //console.log(getPass() + sessionId + ' Attempting isMapMonster zoneId=' + zoneId + ' i=' + i + ' j=' + j + ' results=' + util.inspect(results));
                                return callback(null, results);
                            });
                        },
                        three: function (callback) {
                            //console.log('c');
                            return callback(null, 'three');
                        }
                    }, function (err, results) {
                        if (err) {
                            console.log(getFail() + 'async.series FAILED!');
                        }
                        //console.log('i=' + i + ' j=' + j + ' results=' + util.inspect(results));
                        if (results.isMapMonster !== false && Object.keys(results.isMapMonster).length > 0) {
                            string = string.concat("<div class=mapCoord>o</div>");
                            //string = 'a';
                            //console.log('isMapMonster=true');
                        } else {
                            string = string.concat("<div class=mapCoord>" + i + "," + j + "</div>");
                            //string = 'b';
                            //console.log('isMapMonster=false');
                        }
                        //console.log('isMapMonster=' + util.inspect(results.isMapMonster[0]));
                        if ((j === (y - 6)) && (i === (x + 6))) {
                            //console.log('flag=1');
                            flag = 1;
                        } else {
                            //console.log('waiting' + i + j + x + y);
                        }
                    });
                }
                string = string.concat("<div class=mapCR>&nbsp;</div>"); // NOTE: This is mapCR, the fake carriage return
            }
            sleep(2000, function(string) {
                return callback(string);
            });
        };

        socket.on('reqDrawMap', function (sessionId) {
            var i,
                j,
                mapY,
                JSONobj,
                results,
                string = '';
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {
                exports.getMapIcon(sessionId, zoneId, i, j, x, y, function (string) {
                    //console.log('yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy=' + string);
                    // Since the map's image is currently set to 1280x1024 and the h x w is 300x300,
                    // we take 300-1024 = -724, so we subtract that to force the image to begin
                    // in the bottom left corner.
                    mapY = y - 724;

                    JSONobj = '{'
                            + '"string" : "' + string + '",'
                            + '"x" : ' + x + ','
                            + '"y" : ' + mapY
                            + '}';
                    io.to(socket.id).emit('resDrawMap', JSONobj);
                });
            });
        });
*/


/*
        socket.on('DEFUNKTreqDrawMap', function (msg) {
            var sessionId = msg,
                ISWHEREIAMSTANDING;

            //console.log(getPass() + sessionId + ' resDrawMap: ' + msg);

            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {
                //console.log(getPass() + sessionId + ' exports.getUserCoordinates' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c); // Don't need c
                nowThatIKnowWhereIAmLocated(zoneId, x, y, z, c);
            });
            function nowThatIKnowWhereIAmLocated(zoneId, x, y, z, c) {
                var i,
                    j,
                    mapY,
                    JSONobj,
                    string = '';
                //console.log(getPass() + ' exports.getUserCoordinates:::zoneId=' + zoneId);

                for (j = y + 5; j > y - 6; j = j - 1) { // y-coordinate top to bottom
                    for (i = x - 5; i < x + 6; i = i + 1) { // x-coordinate left to right
                        //console.log(getPass() + sessionId + '. x=' + x + ' y=' + y + ' z=' + z + ' c=' + c + ' i=' + i + ' j=' + j);
                        try {
                            // Is this position the same position as where i'm standing?
                            //console.log('Attempting ISWHEREIAMSTANDING');
                            if (i === x && j === y) {
                                ISWHEREIAMSTANDING = true;
                            } else {
                                ISWHEREIAMSTANDING = false;
                            }
                            if (ISWHEREIAMSTANDING === true) {
                                // This means the position i'm testing is the same as mine
                                //string = session.get('string');
                                string = string.concat("<div class=mapCoord>M</div>");
                                //session.set('string', string);
                                //console.log(getPass() + sessionId + 'same position as me x=' + x + ' y=' + y + ' i=' + i + ' j=' + j);
                            } else {



                                async.series({
                                    one: function (callback) {
                                        //console.log('a');
                                        return callback(null, 'one');
                                    },
                                    isMapMonster: function (callback) {
                                        //console.log('Attempting isMapMonster');
                                        //console.log(getPass() + sessionId + ' Attempting isMapMonster x=' + x + ' y=' + y + ' i=' + i + ' j=' + j + ' zoneId=' + zoneId);
                                        exports.isMapMonster(zoneId, i, j, function (results, zoneId, i, j) {
                                            //console.log(getPass() + sessionId + ' Attempting isMapMonster zoneId=' + zoneId + ' i=' + i + ' j=' + j + ' results=' + util.inspect(results));
                                            return callback(null, results);
                                        });
                                    },
                                    three: function (callback) {
                                        //console.log('c');
                                        return callback(null, 'three');
                                    }
                                }, function (err, results) {
                                    if (err) {
                                        console.log(getFail() + 'async.series FAILED!');
                                    }
                                    //console.log('i=' + i + ' j=' + j + ' results=' + util.inspect(results));
                                    if (results.isMapMonster !== false && Object.keys(results.isMapMonster).length > 0) {
                                        string = string.concat("<div class=mapCoord>o</div>");
                                        //console.log('isMapMonster=true');
                                    } else {
                                        string = string.concat("<div class=mapCoord>" + i + "," + j + "</div>");
                                        //console.log('isMapMonster=false');
                                    }
                                    //console.log('isMapMonster=' + util.inspect(results.isMapMonster[0]));
                                });

//                                try {
//                                    // @todo isMapMonster
//                                    console.log('Attempting isMapMonster');
//                                    var results = isMapMonster(zoneId, i, j);
//                                    var flagIsMapMonster = false;
//                                    console.log(getPass() + ' xxxxxxxxxxxxresults=' + results);
//                                    if (results != false) {
//                                       flagIsMapMonster = true;
//                                        //string = string.concat("<div class=mapCoord>" + i + "," + j + "</div>");
//                                    } else {
//                                        //var flagIsMapMonster = false;
//                                        //string = string.concat("<div class=mapCoord>o</div>");
//                                    }
//
//                                            // @todo isMapGatherable() - show gathering spot.  This is different from isGatherable.
//                                            // @todo isMapParty() - show party members
//                                            // @todo isMapNPC() // yellow dot?
//                                            // else show nothing...
//                                            //string = string.concat("<div class=mapCoord>" + i + "," + j + "</div>");
//                                } catch (e) {
//                                    console.log(getFail() + 'hereiam2');
//                                }

                                string = string.concat("<div class=mapCoord>" + i + "," + j + "</div>");






                            }
                        } catch (e) {
                            console.log(getFail() + 'hereiam');
                        }
                    }
                    string = string.concat("<div class=mapCR>&nbsp;</div>"); // NOTE: This is mapCR, the fake carriage return
                }

                // Since the map's image is currently set to 1280x1024 and the h x w is 300x300,
                // we take 300-1024 = -724, so we subtract that to force the image to begin
                // in the bottom left corner.
                mapY = y - 724;

                JSONobj = '{'
                        + '"string" : "' + string + '",'
                        + '"x" : ' + x + ','
                        + '"y" : ' + mapY
                        + '}';
                io.to(socket.id).emit('resDrawMap', JSONobj);
            }
        });
*/



/*
        socket.on('DEFUNCTreqDrawMap', function (msg) {
            var sessionId = msg,
                string = "",
                j,
                i;
            //console.log(getPass() + sessionId + ' resDrawMap: ' + msg);
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                //console.log(getPass() + sessionId + ' exports.getUserCoordinates' + zoneId + ' ' + x + ' ' + y + ' ' + z); // Don't need c
                for (j = y + 5; j > y - 5; j = j - 1) { // y-coordinate top to bottom
                    for (i = x - 5; i < x + 6; i = i + 1) { // x-coordinate left to right
                        //console.log(getPass() + sessionId + '. x=' + x + ' y=' + y + ' i=' + i + ' j=' + j);
                        // Is this position the same position as where i'm standing?
                        if (i == x && j == y) {
                            // This means the position i'm testing is the same as mine
                            string = string.concat("<div class=mapCoord>M</div>");
                            //console.log(getPass() + sessionId + 'same position as me x=' + x + ' y=' + y + ' i=' + i + ' j=' + j);
                        } else {
                            // @todo isMapMonster() - show a monster on the map
                            //sleep(50, function() { //50ms
                            // executes after one second, and blocks the thread
                            //})
                            var sumthang = isMapMonster(zoneId, i, j);
                            //console.log(getPass() + ' sumthang=' + sumthang);
                            //process.exit(); // kill the whole node process            
                            if (sumthang) {
                                string = string.concat("<div class=mapCoord>S</div>");
                            } else {
                                // @todo isMapGatherable() - show gathering spot.  This is different from isGatherable.
                                // @todo isMapParty() - show party members
                                // @todo isMapNPC() // yellow dot?
                                // else show nothing...
                                string = string.concat("<div class=mapCoord>" + i + "," + j + "</div>");
                            }
                        }
                    }
                    string = string.concat("<div class=mapCR>&nbsp;</div>"); // NOTE: This is mapCR, the fake carriage return
                }

                // Since the image is currently set to 1280x1024 and the h x w is 300x300,
                // we take 300-1024 = -724, so we subtract that to force the image to begin
                // in the bottom left corner.
                y = y - 724;

                var JSONobj = '{'
                        + '"string" : "' + string + '",'
                        + '"x" : ' + x + ','
                        + '"y" : ' + y
                        + '}';
                io.to(socket.id).emit('resDrawMap', JSONobj);
            });
        });
*/




    }); // End of Web Socket Connection

    http.listen(port, ip, function () {
        console.log(getPass() + 'Server is listening on port 1337');
    });

}());
