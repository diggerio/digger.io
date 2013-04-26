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
var Request = require('../network/request').factory;
var Response = require('../network/response').factory;
var EventEmitter = require('events').EventEmitter;

/*
  digger.io - Contract Resolver
  -----------------------------

  Middleware that knows how to merge and pipe

  You provide it with a handler function to issue
  indivudal requests to




 */

module.exports = factory;

function factory(supplychain){

  var resolver = function(req, res, next){
    resolver.handle(req, res, next);
  }

  _.extend(resolver, EventEmitter.prototype);

  /*
  
    run each query in parallel and merge the results
    
  */
  resolver.merge = function(req, res, next){
    async.forEach(req.body || [], function(raw, next){
      var contract_req = Request(raw);
      var contract_res = Response(function(){
        res.add(contract_res);
        next();
      })
      supplychain(contract_req, contract_res, next);
    }, function(error){
      res.send();
    })
  }

  /*
  
    run each query in sequence and pass the previous results onto the next stage as the body
    of the request

    the pipe contract assumes that there is always a post (or a request with a body) in each step
    
  */
  resolver.pipe = function(req, res, next){
    var lastresults = null;
    async.forEachSeries(req.body || [], function(raw, next){
      var contract_req = Request(raw);
      contract_req.body = lastresults || contract_req.body;
      var contract_res = Response(function(){
        if(contract_res.hasError()){
          res.sendError(contract_res.body);
        }
        else{
          lastresults = contract_res.body;  
        }
        next();
      })
      supplychain(contract_req, contract_res, next);
    }, function(error){
      res.send(lastresults);
    })
  }

  resolver.handle = function(req, res, next){
    if(req.getHeader('content-type')!='digger/contract'){
      next();
      return;
    }

    var contracttype = req.getHeader('x-contract-type') || 'merge';

    resolver[contracttype].apply(resolver, [req, res, next]);
  }

  return resolver;

}

