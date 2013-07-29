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

var Network = require('digger-network');

var Request = Network.request;
var Response = Network.response;
var Contract = Network.contract;

var EventEmitter = require('events').EventEmitter;
//var debug = require('debug')('contractresolver');

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
    
    var branches = [];
    
    //debug('merge contract');
    async.forEach(req.body || [], function(raw, next){


      var contract_req = Request(raw);
      var contract_res = Response(function(){
        res.add(contract_res);
        branches = branches.concat(contract_res.getHeader('x-json-branches') || []);
        next();
      })

      req.inject(contract_req);      

      //debug('merge contract - part: %s %s', contract_req.method, contract_req.url);
      supplychain(contract_req, contract_res);
    }, function(error){

      if(branches.length>0){
        /*
        
          this is a sub-contract that enables us to wait for branches of branches
          
        */
        var branch_req = Contract('merge');
        branch_req.method = 'post';
        branch_req.url = '/reception';
        branch_req.body = branches;

        var branch_res = Response(function(){
          res.add(branch_res);
          res.send();
        })

        resolver(branch_req, branch_res);
      }
      else{
        res.send();  
      }
      
    })
  }

  /*
  
    run each query in sequence and pass the previous results onto the next stage as the body
    of the request

    the pipe contract assumes that there is always a post (or a request with a body) in each step
    
  */
  resolver.pipe = function(req, res, next){
    var lastresults = null;
    //debug('pipe contract');
    async.forEachSeries(req.body || [], function(raw, next){
      var contract_req = Request(raw);
      req.inject(contract_req);
      contract_req.body = lastresults || contract_req.body;
      var contract_res = Response(function(){
        if(contract_res.hasError()){
          res.fill(contract_res);
        }
        else{
          lastresults = contract_res.body;
          next();
        }
      })
      //debug('pipe contract - part: %s %s', contract_req.method, contract_req.url);
      supplychain(contract_req, contract_res, next);
    }, function(error){
      res.send(lastresults);
    })
  }

  /*
  
    run each query one after the other but do not inject data like pipe
    
  */
  resolver.sequence = function(req, res, next){
    var lastresults = null;
    //debug('sequence contract');
    async.forEachSeries(req.body || [], function(raw, next){
      var contract_req = Request(raw);
      req.inject(contract_req);
      var contract_res = Response(function(){
        if(contract_res.hasError()){
          res.fill(contract_res);
        }
        else{
          lastresults = contract_res.body;  
          next();
        }
      })
      //debug('sequence contract - part: %s %s', contract_req.method, contract_req.url);
      supplychain(contract_req, contract_res, next);
    }, function(error){
      res.send(lastresults);
    })
  }

  resolver.handle = function(req, res, next){

    /*
    
      make sure we actually have a contract
      
    */
    if(req.getHeader('content-type')!='digger/contract' && !req.getHeader('x-contract-type')){
      next();
      return;
    }

    var contracttype = req.getHeader('x-contract-type') || 'merge';

    resolver[contracttype].apply(resolver, [req, res, next]);
  }

  return resolver;

}

