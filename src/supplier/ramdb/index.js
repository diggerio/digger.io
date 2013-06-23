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

var _ = require('lodash');
var async = require('async');

var DB = require('./db');
var digger = require('digger.io');

module.exports = factory;

function factory(options){

  options = _.defaults(options, {
    hostname:'127.0.0.1',
    port:27017,
    database:'digger',
    collection:'test',
    reset:false
  })
  
  var supplier = digger.suppliers.mongo(options);

  var routes = [];
  if(options.provider==='database'){
    routes = ['database', 'collection'];
  }
  else if(options.provider==='collection'){
    routes = ['collection'];
  }

  if(routes.length>0){
    supplier.provision(routes, function(routes, callback){
      callback();
    })  
  }
  

  var hostname = supplier.settings.attr('hostname');
  var port = supplier.settings.attr('port');
  var reset = supplier.settings.attr('reset');

  function collection_factory(req, callback){

    var useoptions = _.clone(options);

    if(req.getHeader('x-json-resource')){
      useoptions = _.extend(useoptions, req.getHeader('x-json-resource'));
    }

    DB(useoptions, function(error, collection){
      if(options.reset){
        options.reset = false;
      }
      callback(error, collection);
    });

  }

  // get the next available position index for this container
  supplier._get_next_root_position = function(req, callback){
    collection_factory(req, function(error, collection){
      if(error || !collection){
        callback(error || 'collection not found');
        return;
      }

      var options = {
        query:{
          '_digger.diggerparentid':null
        },
        map:function(){
          emit('position', this._digger.rootposition);
        },
        reduce:function(k,v){
          var max = 0;
          v.forEach(function(vv){
            max = vv>max ? vv : max;
          })
          return max;
        }
      }

      /*
      
        a total hack when we are in dev mode it dosn't like 2 at the same time
        
      */
      setTimeout(function(){
        collection.mapreduce(options, function(error, results){
        
          var result = results && results.length>0 ? results[0] : {
            value:0
          }

          callback(error, result.value + 1);
        })  
      }, Math.round(Math.random()*20))
    })
  }

  supplier._select = function(req, mongoquery, callback){
    collection_factory(req, function(error, collection){
      if(error || !collection){
        callback(error || 'no collection found');
        return;
      }
      var cursor = collection.find(mongoquery.query, mongoquery.fields, mongoquery.options);
      cursor.toArray(callback);
    })
    
  }
  
  supplier._insert = function(req, data, callback){
    collection_factory(req, function(error, collection){
      if(error || !collection){
        callback(error || 'no collection found');
        return;
      }
      var raw = _.clone(data);
      delete(raw._children);
      delete(raw._data);

      collection.insert(raw, {safe:true}, callback);
    })
    
  }

  supplier._update = function(req, data, callback){
    collection_factory(req, function(error, collection){
      if(error || !collection){
        callback(error || 'no collection found');
        return;
      }
      var raw = _.clone(data);
      delete(raw._children);
      delete(raw._data);

      collection.update({
        '_digger.diggerid':data._digger.diggerid
      }, raw, {safe:true}, callback)
    })
    
  }

  supplier._remove = function(req, data, callback){
    collection_factory(req, function(error, collection){
      if(error || !collection){
        callback(error || 'no collection found');
        return;
      }
      collection.remove({
        '$and':[
          {
            '_digger.left':{
              '$gte':data._digger.left
            }
          },
          {
            '_digger.right':{
              '$lte':data._digger.right
            }
          }
        ]
      }, {safe:true}, callback)
    })
    
  }

  return supplier;
}