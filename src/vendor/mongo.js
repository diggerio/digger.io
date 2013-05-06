/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Module dependencies.
*/

var mongo = require('mongodb'),
    Db = require('mongodb').Db,
    ObjectID = require('mongodb').ObjectID,
    Server = require('mongodb').Server,
    EventEmitter = require('events').EventEmitter,
    async = require('async'),
    _ = require('lodash');
    
/*
  Quarry.io Mongo Stack
  ---------------------

  Provides a wrapper for a connection to a mongo database

 */


exports = module.exports = factory;

// a singleton to hold onto the various database handles without re-opening each time
var databaseConnection = null;

function ensureDatabaseConnection(options, callback){

  options = _.defaults(options, {
    database:'quarrydb',
    host:'127.0.0.1',
    port:27017
  })

  if(databaseConnection){
    callback(null, databaseConnection);
    return;
  }

  var server = new Server(options.host, options.port, {auto_reconnect: true});
  var db = new Db(options.database, server, {safe:true});
  db.open(function(err){
    if(err) throw err;
    databaseConnection = db;
    callback(null, db);
  });

  db.on('close', function(){
    databaseConnection = null;
  })
  
}

function ensureCollection(options, callback){

  ensureDatabaseConnection(options, function(error, databaseConnection){
    if(error){
      callback(error);
      return;
    }

    databaseConnection.createCollection(options.collection, function(error, collectionConnection){
      callback(error, databaseConnection, collectionConnection);
    })
  })
}

var mapReduce = function(mongoDatabase, mapReduceOptions, callback){

  
}

// make me a new container please - here is some data and the originating warehouse!
function factory(options, ready_callback){

  var client = function(){}

  client = _.extend(client, EventEmitter.prototype);

  ensureCollection(options, function(error, database, collection){
    client.database = database;
    client.collection = collection;

    client.upsert = function(query, data, callback){
      collection.update(query, data, {
        safe:true,
        upsert:true
      }, callback);
    }

    client.update = function(query, data, callback){
      collection.update(query, data, {
        safe:true
      }, callback);
    }

    client.drop = function(callback){
      collection.drop(callback);
    }

    client.find = function(query, callback){
      collection.find(query.query, query.fields, query.options).toArray(callback);
    }

    // map reduce wrapper
    client.mapreduce = function(map_reduce_options, callback){

      map_reduce_options = _.extend({}, map_reduce_options);

      var mapReduce = {
        mapreduce: options.collection, 
        out:  { inline : 1 },
        query: map_reduce_options.query,
        map: map_reduce_options.map ? map_reduce_options.map.toString() : null,
        reduce: map_reduce_options.reduce ? map_reduce_options.reduce.toString() : null,
        finalize: map_reduce_options.finalize ? map_reduce_options.finalize.toString() : null
      }

      database.executeDbCommand(mapReduce, function(err, dbres) {

        var results = dbres.documents[0].results

        callback(err, results);
      })
    }

    ready_callback(error, client);
  })

  return client;
}