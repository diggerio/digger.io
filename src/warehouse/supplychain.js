/*
  Copyright (c) 2012 All contributors as noted in the AUTHORS file

  This file is part of quarry.io

  quarry.io is free software; you can redistribute it and/or modify it under
  the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation; either version 3 of the License, or
  (at your option) any later version.

  quarry.io is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*

	supply chain

  a container layer ontop of the underlying req, res network

  this connects a function with the container API

  so:

    var container = digger.supplychain(function(req, res){
      // here we have a req with

      // x-json-selectors filled in

    })

    container('find me').ship(function(stuff){
      // here we have whatever the function returned
    })


  it is a neat trick to create a supplychain that proxies over
  the network to fullfull the request

  This lets us make generic objects that access network services

  It also lets us use the same code to built a socket supply chain
  (for websocket browser connections) and a HTTP supply chain (for 
  REST api's etc)

	
*/
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

var Container = require('../container/proto');
var Contract = require('../network/contract');
var Response = require('../network/response');

/*

  create a new supply chain that will pipe a req and res object into the
  provided fn

  
*/

function factory(){

  var url = '/';
  var supplierfn = null;
  var container = null;

  _.each(_.toArray(arguments), function(arg){
    if(_.isFunction(arg)){
      /*
      
        it is an existing container
        
      */
      if(_.isFunction(arg.diggerid)){
        container = arg;
      }
      /*
      
        otherwise the supplierchain function
        
      */
      else{
        supplierfn = arg;  
      }
    }
    /*
    
      it is a URL to create a container from
      
    */
    else if(_.isString(arg)){
      container = Container.factory('_supplychain');
      url = arg;
    }
    else if(_.isArray(arg) || _.isObject(arg)){
      if(!_.isArray(arg)){
        arg = [arg];
      }

      container = Container.factory(arg);
    }

  })

  if(!supplierfn){
    supplierfn = function(req, res){
      res.send404();
    }
  }
  if(!container){
    container = Container.factory('_supplychain');
  }

  if(!container.diggerwarehouse()){
    container.diggerwarehouse(url);
  }

  /*
  
    are we connected directly to some backend functions (i.e. non network mode)

    if yes then we will fake serialize the requests
    
  */
  var should_auto_serialize = supplierfn._diggertype=='warehouse' || supplierfn._diggertype=='supplier';

  function supplychain(){}

  supplychain.ship = function(contract, callback){
    var self = this;

    var res = Response.factory(function(){

      /*
      
        resolve means extracting the multipart responses
        
      */
      res.resolve(function(results, errors){
        if(should_auto_serialize){
          results = JSON.parse(JSON.stringify(results));
        }
        var answer = results;
        if(contract.getHeader('x-expect')==='digger/containers'){
          if(results && results.length>0){
            answer = container.spawn(results);
          }
          else{
            answer = container.spawn();
          }
        }

        contract.emit('shipped', answer);
        callback(answer, res);
      })

    })

    if(should_auto_serialize){
      _.each(JSON.parse(JSON.stringify(contract.toJSON())), function(v, k){
        contract[k] = v;
      })
    }
    
    supplierfn(contract, res);

    return res;
  }
  
  container.supplychain = supplychain;

  return container;
}

module.exports = factory;