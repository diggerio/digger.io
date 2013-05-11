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
var Container = require('./container/proto');

/*

  create a new supply chain that will pipe a req and res object into the
  provided fn


  
*/

function factory(fn){
  var container = Container.factory('supplychain');
  container.supplychain = fn;
  return container;
}

module.exports = factory;