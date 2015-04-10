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
                    console.log(getPass() + 'Spawn Wipe Gathers results=' + results);
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
                    console.log(getPass() + 'Spawn Wipe Monsters=' + results);
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
                    console.log(getPass() + 'Spawn Initialize Gathers2 results=' + results);
                }
            });
            connection.release(); // always put connection back in pool after last query
            return results;
        });
    }

    /**
      * spawnInitializeGathers()
      * Runs an hour after "node server.js" is started, and each hour thereafter (ref. cron jobs)
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
                    console.log(getPass() + 'Spawn Initialize Gathers1');
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
                100
            ], function getPassOrFail(err, results2) {
                if (err) {
                    console.log(getFail() + 'Spawn Initialize Monsters2 err=' + err);
                } else {
                    console.log(getPass() + 'Spawn Initialize Monsters2 results2=' + results2);
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
            var sql = "SELECT monsterId, zoneId, xStart, yStart FROM monsterSeeds";
            connection.query(sql, [], function (err, results) {
                var row,
                    sql2 = "INSERT INTO monsterPlants (monsterId, zoneId, x, y, z, hp) VALUES (?, ?, ?, ?, ?, ?)";
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + 'Spawn Initialize Monsters1 err=' + err);
                } else {
                    console.log(getPass() + 'Spawn Initialize Monsters1');
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
            console.log(getPass() + ' sleeping...');
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
                callback(true);
                return;
            } // this should probably be false
            var sql = "DELETE FROM sessions WHERE userId = " + mysql.escape(userId) + ";INSERT INTO sessions (id, userId, dt) VALUES (" + mysql.escape(sessionId) + "," + mysql.escape(userId) + "," + mysql.escape(getTimestamp()) + ")";
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + 'err=' + err);
                    callback(false);
                } else {
                    console.log(getPass() + 'results=' + results);
                    callback(sessionId);
                }
            });
        });
    };
    exports.getUserCoordinates = function (sessionId, callback) {
        //console.log(getPass() + sessionId + ' exports.getUserCoordinates:::sessionId:' + sessionId);
        pool.getConnection(function (err, connection) {
            if (err) { console.log(getFail() + sessionId + ' err=' + err); callback(true); return; } // this should probably be false
            var sql = "SELECT zoneId, x, y, z, c FROM sessions WHERE id = " + mysql.escape(sessionId);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err || sessionId === null) { // NOTE: Testing for sessionId===null might give unintended consequences
                    console.log(getFail() + sessionId + ' exports.getUserCoordinates:::err=' + err);
                    callback(true); // this should probably be set to false
                    return; // don't think i need this
                    // @TODO: Log the character out, and add a console abort message
                }
                console.log(getPass() + sessionId + ' exports.getUserCoordinates=' + util.inspect(results)); // useful for debugging
                callback(results[0].zoneId, results[0].x, results[0].y, results[0].z, results[0].c);
            });
        });
    };


    /*
    exports.isMapMonster = function(zoneId, i, j, callback) {
      //console.log(getPass() + ' exports.isMapMonster:::zoneId=' + zoneId + ' i=' + i + ' j='+j);
      pool.getConnection(function(err, connection) {
        var sql = "SELECT zoneId, x, y FROM monsterPlants WHERE zoneId = ? AND x = ? AND y = ?;";
        console.log(getPass() + ' exports.isMapMonster:::sql=' + sql + ' zoneId=' + zoneId + ' i=' + i + ' j='+j);
        connection.query(sql, [zoneId, i, j], function(err, results) {
          connection.release(); // always put connection back in pool right after the query
          if(err) {
            console.log(getFail() + ' isMapMonster:::err=' + err);
            callback(false);
          } else {
            //console.log(getPass() + ' isMapMonster:::results=' + util.inspect(results));
            callback(results);
          }
        });
      });
    };
    */



/*
    function isMapMonster(zoneId, i, j, callback) {
      console.log(getPass() + ' isMapMonster:::zoneId=' + zoneId + ' i=' + i + ' j='+j);
      pool.getConnection(function(err, connection) {
        var sql = "SELECT zoneId, x, y FROM monsterPlants WHERE zoneId = ? AND x = ? AND y = ?";
        connection.query(sql, [zoneId, i, j], function(err, results) {
          connection.release(); // always put connection back in pool right after the query
          if(err) {
            console.log(getFail() + ' isMapMonster:::err=' + err);
            callback(false);
          } else {
            console.log(getPass() + ' isMapMonster:::results=' + util.inspect(results));
            callback(results);
          }
        });
      });
    };
*/



    /*
    exports.isMapMonster = function qryMonsterPlantsBasedOnzoneIdXY(zoneId, i, j, callback) {
      console.log('exports.isMapMonster:::zoneId=' + zoneId + ' i=' + i + ' j=' + j);
      pool.getConnection(function(err, connection) {
      if(err) { console.log(getFail() + ' err=' + err); callback(err); return; } // this should probably be false (ie. test it both ways)
      callback(true);
                                  //    var sql = "SELECT zoneId, x, y FROM monsterPlants WHERE zoneId = ? AND x = ? AND y = ?";
                                  //    connection.query(sql, [zoneId, i, j], string, function(err, results) {
                                  //console.log('rezx='+results);
    console.log(getPass() + 'freeConnections=' + util.inspect(connection.config.pool._freeConnections));
    connection.release(); // always put connection back in pool after last query
    sleep(50, function() { //50ms
       // executes after one second, and blocks the thread
    })
                                  //      if(err) {
                                  //        console.log(getFail() + ' isMapMonster=fail err='+err);
                                  //        callback(false); // this should probably be set to false (ie. test it both ways)
                                  //        // @todo Log the character out, and add a console abort message???  No sessionId sent, so probably not required here.
                                  //      } else {
                                  //        if(results !="" && results != null) {
                                  //          console.log(getPass() + 'isMapMonster at i=' + i + ' j=' + j);
                                  //          console.log( getPass() + util.inspect(results) );
                                  //          callback(string);
                                  //        } else {
                                  //          callback(false);
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
                callback(false);
            }
            var sql = "SELECT c.id AS charId, c.firstName AS firstName, c.lastName AS lastName FROM characters c LEFT JOIN sessions s ON  s.userId = c.userId WHERE s.id = " + mysql.escape(sessionId);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err || sessionId === null) {  // NOTE: Testing for sessionId===null might give unintended consequences
                    console.log(getFail() + sessionId + ' exports.getCharacterList:::err=' + err);
                    callback(false);
                    // @TODO: Log the character out, and add a console abort message
                } else {
                    console.log(getPass() + sessionId + ' exports.getCharacterList=' + util.inspect(results)); // useful for debugging
                    //callback(results[0].charId, results[0].firstName, results[0].lastName);
                    callback(results);
                }
            });
        });
    };
    exports.getMonstersNearMe = function (sessionId, zoneId, x, y, z, callback) {
        console.log(getPass() + sessionId + ' exports.getMonstersNearMe:::sessionId:' + sessionId + 'zoneId=' + zoneId + 'x=' + x + 'y=' + y + 'z=' + z);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(getFail() + sessionId + ' err=' + err);
                callback(false);
            }
            var sql = "SELECT id, monsterId, hp FROM monsterPlants WHERE zoneId = " + mysql.escape(zoneId) + " AND x = " + mysql.escape(x) + " AND y = " + mysql.escape(y) + " AND z = " + mysql.escape(z) + " AND hp > 0";
            console.log(getPass() + sessionId + ' exports.getMonstersNearMe:::sql=' + sql);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + sessionId + ' exports.getMonstersNearMe:::err=' + err);
                    callback(false);
                    // @todo: Log the character out, and add a console abort message
                } else {
                    console.log(getPass() + sessionId + ' exports.getMonstersNearMe:::results=' + util.inspect(results)); // useful for debugging
                    callback(results);
                }
            });
        });
    };
    exports.getPassword = function (email, callback) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                callback(true);
                return;
            }
            var sql = "SELECT id, password FROM users WHERE email = " + mysql.escape(email) + " LIMIT 1";
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + 'err=' + err);
                    callback(true); // this should probably be set to false
                    return;  // don't think i need this
                }
                //console.log('results='+util.inspect(results)); // useful for debugging
                //console.log('results = ' + results[0].password);
                callback(results[0].id, results[0].password); // userId, password
            });
        });
    };
    exports.getSpeakMyName = function (sessionId, charId, callback) {
        console.log(getPass() + sessionId + ' charId=' + charId);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                callback(false);
            }
            var sql = "SELECT c.firstName AS firstName, c.lastName AS lastName FROM characters c LEFT JOIN sessions s ON  s.userId = c.userId WHERE s.id = " + mysql.escape(sessionId) + " AND c.id = " + mysql.escape(charId);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err || sessionId === null) {  // NOTE: Testing for sessionId===null might give unintended consequences
                    console.log(getFail() + sessionId + ' exports.getSpeakMyName:::err=' + err);
                    callback(false);
                    // @TODO: Log the character out, and add a console abort message
                } else {
                    console.log(getPass() + sessionId + ' exports.getSpeakMyName:::results=' + util.inspect(results)); // useful for debugging
                    callback(results[0].firstName, results[0].lastName);
                }
            });
        });
    };
    /** 
      * exports.setMonsterPlantsDamage
      *
      **/
    exports.setMonsterPlantsDamage = function (id, hp, damage, callback) {
        console.log(getPass() + 'exports.setMonsterPlantsDamage:::id:' + id + 'hp=' + hp + 'damage=' + damage);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                callback(true);
                return;
            }
            var sql = "UPDATE monsterPlants SET hp = " + mysql.escape(hp) + " WHERE id = " + mysql.escape(id);
            console.log(getPass() + ' exports.setMonsterPlantsDamage:::sql = ' + sql);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + ' exports.setMonsterPlantsDamage:::err=' + err);
                    callback(false);
                    // @TODO: Log the character out, and add a console abort message
                } else {
                    console.log(getPass() + 'exports.setMonsterPlantsDamage:::results=' + util.inspect(results)); // useful for debugging
                    callback(true);
                }
            });
        });
    };
    exports.setUserCoordinates = function (sessionId, zoneId, x, y, z, c, callback) {
        console.log(getPass() + sessionId + ' exports.setUserCoordinates:::sessionId:' + sessionId + 'zoneId=' + zoneId + 'x=' + x + 'y=' + y + 'z=' + z + 'c=' + c);
        pool.getConnection(function (err, connection) {
            if (err) {
                console.log(err);
                callback(true);
                return;
            }
            var sql = "UPDATE sessions SET zoneId=" + mysql.escape(zoneId) + ", x=" + mysql.escape(x) + ", y=" + mysql.escape(y) + ", z = " + mysql.escape(z) + ", c = " + mysql.escape(c) + " WHERE id = " + mysql.escape(sessionId);
            connection.query(sql, [], function (err, results) {
                connection.release(); // always put connection back in pool after last query
                if (err) {
                    console.log(getFail() + sessionId + ' exports.setUserCoordinates:::err=' + err);
                    callback(false);
                    // @TODO: Log the character out, and add a console abort message
                } else {
                    console.log(getPass() + sessionId + ' exports.setUserCoordinates:::results=' + util.inspect(results)); // useful for debugging
                    callback(sessionId, zoneId, x, y, z, c);
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
        callback(filename);
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
    // INITTAB - The stuff that runs at startup
    ///////////////////////////////////////////////////////////////////////////////
    wipeAudioDynamic();
    console.log(getPass() + 'wipeAudioDynamic() started - this is a one-time event');


    ///////////////////////////////////////////////////////////////////////////////
    // CRON JOBS
    ///////////////////////////////////////////////////////////////////////////////
    // EVERY SECOND
    setInterval(function () {
        console.log(getPass() + onlineClients + ' clients online');  // Every second, show the number of onlineClients
    }, 1000);

    // HOURLY - Every 3,600 seconds, respawn the map.  Interestingly, if the server goes down, the map doesn't get respawned until an hour passes of successful running.
    setInterval(function () {
        console.log(getPass() + 'Hourly Cron Started');
        spawnWipeGathers();
        spawnWipeMonsters();

        spawnInitializeGathers();
        spawnInitializeMonsters();
    }, 6000);  // @todo SINCE WE'RE IN DEVELOPMENT, I'M CHANGING THIS FROM 3,600,000ms (1 hour) to 60,000ms (1 minute) to 6,000ms = 10 seconds



    ///////////////////////////////////////////////////////////////////////////////
    // W E B   S O C K E T   C O N N E C T I O N
    ///////////////////////////////////////////////////////////////////////////////
    io.on('connection', function (socket) {
        console.log(getPass() + 'user connected from ' + util.inspect(socket.handshake.headers));
        onlineClients = onlineClients + 1;

        /////////////////////////////////////////////////////////////////////////////
        // DISCONNECT
        /////////////////////////////////////////////////////////////////////////////
        socket.on('disconnect', function () {
            onlineClients = onlineClients - 1;
            console.log(getPass() + 'user disconnected from ' + util.inspect(socket.handshake.headers));
        });

        /////////////////////////////////////////////////////////////////////////////
        // CHAT
        /////////////////////////////////////////////////////////////////////////////
        socket.on('chat message', function (msg) {
            console.log(getPass() + 'message: ' + msg);
            io.emit('chat message', msg);
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
                    possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
                    i,
                    response = "fail";
                //console.log('DEBUG5 result='+userId); // useful for debugging
                //console.log('DEBUG6 result='+realPassword); // useful for debugging
                if (realPassword === parsed.password) {
                    //response = "pass";
                    //var now = new Date().getTime();
                    console.log(getPass() + parsed.email + ' passed login with userId ' + userId);

                    // @TODO:  Session ID is only 5 alphanumeric characters right now.  This needs to be increased higher later.
                    for (i = 0; i < 5; i = i + 1) {
                        sessionId += possible.charAt(Math.floor(Math.random() * possible.length));
                    }

                    // Insert sessionId into db

                    exports.generateSession(sessionId, userId, function (sessionId) { // the response is the sessionid, or false
                        io.emit('login response', sessionId);  // User passed login, so tell him the sessionId
                    });
                } else {
                    // if not, send them a failed message.
                    response = "fail";
                    console.log(getFail() + 'user failed login with email ' + parsed.email + ' and password ' + parsed.password);
                    io.emit('login response', response);  // EMITS RESPONSE OF pass OR fail UPON LOGIN
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
                console.log(getPass() + sessionId + ' exports.getUserCoordinates' + zoneId + x + y + z); // Don't need c
                // Get the monsters near the user's coordinates
                exports.getMonstersNearMe(sessionId, zoneId, x, y, z, function (results) { // The callback is sending us results
                    console.log(getPass() + sessionId + 'reqAttack:::results=' + results);
                    var damage = getRandom3d6(),
                        newHp;
                    for (row in results) {
                        //console.log('row=' + row);
                        //console.log('id=' + results[row].id);
                        //console.log('monsterId=' + results[row].monsterId);
                        //console.log('hp=' + results[row].hp);
                        // @TODO:  REDRAW MONSTER LAYER

                        // Roll die
                        //var damage = getRandomInt(0, 50); // 0,50 is min,max damage (a fixed number is used for now during testing)

                        //console.log('damage = ' + damage);
                        newHp = results[row].hp - damage;

                        // Apply damage - for each monster id, send the damage (return 1 if dead), and see if i killed it (ie. loot bag drops)
                        exports.setMonsterPlantsDamage(results[row].id, newHp, damage, function (result) {
                            // simply just updates the hp (even if negative)
                            // Since I don't care about the result callback, I should probably not use a callback here
                            console.log(getPass() + sessionId + ' setMonsterPlantsDamage result=' + result);
                        });

                        // Is Dead?
                        if (damage >= results[row].hp) {
                            // Monster is dead - Drop Loot based on monsterId
                            io.emit('show interactive', '(F) Get Loot'); // Shows the interactive window
                            console.log(getPass() + sessionId + ' monster is dead');
                        } else {
                            console.log(getPass() + sessionId + ' monster is still alive');
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
            console.log(getPass() + ' msg=' + msg);
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
                io.emit('resCharacterList', html);
            });
        });


        socket.on('reqSpeakMyName', function (sessionId, charId) {
            console.log(getPass() + sessionId + ' reqSpeakMyName=' + ' ' + charId);
            exports.getSpeakMyName(sessionId, charId, function (firstName, lastName) {
                var prefix = 'Welcome',
                    filename = "dynamic/" + sessionId + "-" + charId + ".wav";
                console.log(getPass() + sessionId + ' getSpeakMyName:firstName=' + firstName + ' lastName=' + lastName);
                console.log(getPass() + sessionId + ' filename=' + filename);
                exports.speak(firstName, lastName, filename, prefix, function (filename) {
                    console.log(getPass() + sessionId + ' exports.speak:::' + prefix + firstName + lastName + '. filename=' + filename);
                });
                io.emit('audioPlay', filename);
            });
        });

        /////////////////////////////////////////////////////////////////////////////
        // INVENTORY
        /////////////////////////////////////////////////////////////////////////////
        socket.on('reqInventory', function (msg) {   // I or i key pressed
            //not used yet: var sessionId = msg;
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
            // @TODO:  Right now, we're faking the results, but this needs to be a db lookup
            console.log('reqInventory: ' + msg);
            io.emit('resInventory', JSONobj);
        });

        /////////////////////////////////////////////////////////////////////////////
        // NAVIGATION and MAP
        /////////////////////////////////////////////////////////////////////////////
        socket.on('turn right', function (msg) {   // d key pressed
            var sessionId = msg;
            console.log(getPass() + sessionId + ' turn right: ' + msg);
            // SELECT the user's coordinates x,y,z,compass based on their sessionId
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                console.log(getPass() + sessionId + ' turn right:::exports.getUserCoordinates:::' + zoneId + x + y + z + c);
                // Calculate the change in coordinates
                c = c + 45;
                if (c >= 360) {  // If the compass is greater than 360 degrees
                    c = c - 360;  // then subtract 360 degrees from the compass
                }
                // UPDATE the user's coordinates in the db
                exports.setUserCoordinates(sessionId, zoneId, x, y, z, c, function (result) {  // The callback is sending us zoneId,x,y,z,c
                    console.log(getPass() + sessionId + ' turn right:::exports.setUserCoordinates ' + sessionId + ' ' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c + ' result=' + result);
                });
                // Send zoneId,x,y,z,c coordinates back to the user
                var JSONobj = '{'
                        + '"zoneId" : ' + zoneId + ','
                        + '"x" : ' + x + ','
                        + '"y" : ' + y + ','
                        + '"z" : ' + z + ','
                        + '"c" : ' + c
                        + '}';
                io.emit('resTurnRight', JSONobj);
                // @TODO: See if there's something to gather and have it show/hide the gathering window
                // isGatherable(sessionId,zoneId,x,y,z);
            });
        });

        socket.on('turn left', function (msg) {   // d key pressed
            var sessionId = msg;
            console.log(getPass() + sessionId + ' turn left: ' + msg);
            // SELECT the user's coordinates zoneId,x,y,z,compass based on their sessionId
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                console.log(getPass() + sessionId + ' turn left:::exports.getUserCoordinates' + zoneId + x + y + z + c);
                // Calculate the change in coordinates
                c = c - 45;
                if (c < 0) {     // if compass is less than 0 degrees
                    c = c + 360;  // then add 360 degrees to it
                }
                // UPDATE the user's coordinates in the db
                exports.setUserCoordinates(sessionId, zoneId, x, y, z, c, function (result) {  // The callback is sending us zoneId,x,y,z,c
                    console.log(getPass() + sessionId + ' turn left:::exports.setUserCoordinates ' + sessionId + ' ' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c + ' result=' + result);
                });
                // Send zoneId,x,y,z,c coordinates back to the user
                var JSONobj = '{'
                    + '"zoneId" : ' + zoneId + ','
                    + '"x" : ' + x + ','
                    + '"y" : ' + y + ','
                    + '"z" : ' + z + ','
                    + '"c" : ' + c
                    + '}';
                io.emit('resTurnLeft', JSONobj);
                // @TODO: See if there's something to gather and have it show/hide the gathering window
                // isGatherable(sessionId,zoneId,x,y,z);
            });
        });

        socket.on('walk forward', function (msg) {    // w key pressed
            var sessionId = msg;
            console.log(getPass() + sessionId + ' walk forward: ' + msg);
            // SELECT the user's coordinates zoneId,x,y,z,compass based on their sessionId
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                console.log(getPass() + sessionId + ' walk forward:::exports.getUserCoordinates' + zoneId + x + y + z + c);
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
                    console.log(getPass() + sessionId + ' walk forward:::exports.setUserCoordinates ' + sessionId + ' ' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c + ' result=' + result);
                });
                // Send x,y,z,c coordinates back to the user
                var JSONobj = '{'
                        + '"zoneId" : ' + zoneId + ','
                        + '"x" : ' + x + ','
                        + '"y" : ' + y + ','
                        + '"z" : ' + z + ','
                        + '"c" : ' + c
                        + '}';
                io.emit('resWalkForward', JSONobj);
                // @TODO: See if there's something to gather and have it show/hide the gathering window
                // isGatherable(sessionId,zoneId,x,y,z);
            });
        });

        socket.on('walk backward', function (msg) {    // x key pressed
            var sessionId = msg;
            console.log(getPass() + sessionId + ' walk backward: ' + msg);
            // SELECT the user's coordinates zoneId,x,y,z,compass based on their sessionId
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                console.log(getPass() + sessionId + ' walk backward:::exports.getUserCoordinates' + zoneId + x + y + z + c);
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
                    console.log(getPass() + sessionId + ' walk backward:::exports.setUserCoordinates ' + sessionId + ' ' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c + ' result=' + result);
                });
                // Send x,y,z,c coordinates back to the user
                var JSONobj = '{'
                    + '"zoneId" : ' + zoneId + ','
                    + '"x" : ' + x + ','
                    + '"y" : ' + y + ','
                    + '"z" : ' + z + ','
                    + '"c" : ' + c
                    + '}';
                io.emit('resWalkBackward', JSONobj);
                // @TODO: See if there's something to gather and have it show/hide the gathering window
                // isGatherable(sessionId,zoneId,x,y,z);
            });
        });




        socket.on('reqDrawMap', function (msg) {
            var sessionId = msg,
                string = "",
                ISWHEREIAMSTANDING;
            console.log(getPass() + sessionId + ' resDrawMap: ' + msg);

            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {
                console.log(getPass() + sessionId + ' exports.getUserCoordinates' + zoneId + ' ' + x + ' ' + y + ' ' + z + ' ' + c); // Don't need c
                nowThatIKnowWhereIAmLocated(zoneId, x, y, z, c);
            });
            function nowThatIKnowWhereIAmLocated(zoneId, x, y, z, c) {
                var i,
                    j;
                console.log(getPass() + ' exports.getUserCoordinates:::zoneId=' + zoneId);

                for (j = y + 5; j > y - 6; j = j - 1) { // y-coordinate top to bottom
                    for (i = x - 5; i < x + 6; i = i + 1) { // x-coordinate left to right
                        console.log(getPass() + sessionId + '. x=' + x + ' y=' + y + ' z=' + z + ' c=' + c + ' i=' + i + ' j=' + j);
                        try {
                            // Is this position the same position as where i'm standing?
                            console.log('Attempting ISWHEREIAMSTANDING');
                            if (i === x && j === y) {
                                ISWHEREIAMSTANDING = true;
                            } else {
                                ISWHEREIAMSTANDING = false;
                            }
                            if (ISWHEREIAMSTANDING === true) {
                                // This means the position i'm testing is the same as mine
                                string = string.concat("<div class=mapCoord>M</div>");
                                console.log(getPass() + sessionId + 'same position as me x=' + x + ' y=' + y + ' i=' + i + ' j=' + j);
                            } else {
                                /*
                                try {
                                  // @todo isMapMonster
                                  console.log('Attempting isMapMonster');
                                  isMapMonster(zoneId, i, j, function(results) {
                                    console.log(getPass() + ' xxxxxxxxxxxxresults=' + results);
                                    if(results) {
                                      var flagIsMapMonster = true;
                                    } else {
                                      var flagIsMapMonster = false;
                                    }
                                  }, function(flagIsMapMonster) {
                                    if (flagIsMapMonster == false) {
                                      //killAll();
                                      // @todo isMapGatherable() - show gathering spot.  This is different from isGatherable.
                                      // @todo isMapParty() - show party members
                                      // @todo isMapNPC() // yellow dot?
                                      // else show nothing...
                                      }
                                  });
                                }
                                catch(e) {
                                  console.log(getFAIL() + 'hereiam2');
                                }
                                */
                                string = string.concat("<div class=mapCoord>" + i + "," + j + "</div>");
                            }
                        } catch (e) {
                            console.log(getFail() + 'hereiam');
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
                io.emit('resDrawMap', JSONobj);
            }
        });




/*
        socket.on('DEFUNCTreqDrawMap', function (msg) {
            var sessionId = msg,
                string = "",
                j,
                i;
            console.log(getPass() + sessionId + ' resDrawMap: ' + msg);
            exports.getUserCoordinates(sessionId, function (zoneId, x, y, z, c) {  // The callback is sending us zoneId,x,y,z,c
                console.log(getPass() + sessionId + ' exports.getUserCoordinates' + zoneId + ' ' + x + ' ' + y + ' ' + z); // Don't need c
                for (j = y + 5; j > y - 5; j = j - 1) { // y-coordinate top to bottom
                    for (i = x - 5; i < x + 6; i = i + 1) { // x-coordinate left to right
                        console.log(getPass() + sessionId + '. x=' + x + ' y=' + y + ' i=' + i + ' j=' + j);
                        // Is this position the same position as where i'm standing?
                        if (i == x && j == y) {
                            // This means the position i'm testing is the same as mine
                            string = string.concat("<div class=mapCoord>M</div>");
                            console.log(getPass() + sessionId + 'same position as me x=' + x + ' y=' + y + ' i=' + i + ' j=' + j);
                        } else {
                            // @todo isMapMonster() - show a monster on the map
                            //sleep(50, function() { //50ms
                            // executes after one second, and blocks the thread
                            //})
                            var sumthang = isMapMonster(zoneId, i, j);
                            console.log(getPass() + ' sumthang=' + sumthang);
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
                io.emit('resDrawMap', JSONobj);
            });
        });
*/




    }); // End of Web Socket Connection

    http.listen(port, ip, function () {
        console.log(getPass() + 'Server is listening on port 1337');
    });

}());
