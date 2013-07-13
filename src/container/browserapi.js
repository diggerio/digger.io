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
var Proto = require('./proto');
var SupplyChain = require('../warehouse/supplychain');

var _ = require('lodash');
var async = require('async');

/*

	$digger is the default on ready handler
	
*/

var isready = false;
var readycallbacks = [];

var version = require('../../package.json').version;

function $digger(){
	/*
	
		a ready handler
		
	*/
	if(_.isFunction(arguments[0])){
		if(isready){
			arguments[0].apply($digger, [$digger]);
		}
		else{
			readycallbacks.push(arguments[0]);
		}
	}
}

$digger.version = version;

$digger._trigger_ready = function(){
	_.each(readycallbacks, function(fn){
		fn.apply($digger, [$digger]);
	})
	readycallbacks = [];
	isready = true;
}

/*

	this connects the socket

	it is passed any config by the server
	
*/
$digger.bootstrap = function(config){

	config = _.extend({}, config.windowconfig, config.userconfig);
	readycallbacks = readycallbacks.concat(config.readycallbacks || []);
	
	config = _.defaults(config, {
		protocol:'http://',
		host:'digger.io',
		channel:null
	})

	console.log('-------------------------------------------');
	console.log('digger.io browserapi version: ' + $digger.version);
	console.dir(config);

	var socket_address = [config.protocol, config.host, '/', config.channel].join('');
	console.log('connecting to socket: ' + socket_address);

	var socket = io.connect(socket_address);

	/*
	
		this is run the first time the socket connects

		this triggers the digger ready phase
		
	*/

	function diggerready(){
		if(config.user){
			$digger.user = Proto.factory(config.user); 
			console.log('digger user: ' + $digger.user.attr('name'));
		}
		if(config.blueprints){
			$digger.blueprint.add(config.blueprints);
			console.log('adding digger blueprints: ' + _.keys(config.blueprints).length);
			_.each(config.blueprints, function(print, name){
				console.log('   - ' + name);
			})
		}
		
		$digger._trigger_ready();	
	}

	/*
	
		a counter of how many times the socket came online
		
	*/
	var connections = 0;

	socket.on('connect', function(){
		console.log('socket connected');
		connections++;

		if(connections<=1){
			diggerready();
		}
	})

	/*
	
		this is the client side container plugged into the socket.io transport
		
	*/
	$digger.supplychain = SupplyChain(function(req, res){
		if($digger.config.debug){
			console.log(JSON.stringify(req.toJSON(), null, 4));	
		}
		
		socket.emit('request', req.toJSON(), function(rawres){
			if($digger.config.debug){
				console.log(JSON.stringify(rawres, null, 4));
			}
			res.fill(rawres);
		})
	})

	$digger.config = _.extend({}, config, window.$diggerconfig);	
}

/*

	get a container that has a socket supply chain hooked up to the given stackpath
	
*/
$digger.connect = function(stackpath){
	if(!this.supplychain){
		throw new Error('there is no supplychain - this means we are not yet connected - place code inside of $digger(function(){})');
	}

	return $digger.supplychain.connect(stackpath);
}

var blueprints = {};
var templates = {};

$digger.blueprint = {
  add:function(prints){
    for(var i in prints){
      blueprints[i] = prints[i];
    }
    return this;
  },
  get:function(name){
    if(arguments.length<=0){
      return blueprints;
    }
    return blueprints[name];
  },
  create:function(name){
		var blueprint = this.get(name);
		var data = JSON.parse(JSON.stringify({
			_digger:blueprint._digger
		}))

		var container = $digger.create([data]);
		container.digger('new', true);

		return container;
  }
}

$digger.template = {
	add:function(plates){
    for(var i in plates){
      templates[i] = plates[i];
    }
    return this;
  },
  get:function(name){
    if(arguments.length<=0){
      return templates;
    }
    return templates[name];
  }
}

/*

	we let the client re-route requests
	
*/
var routes = {};

$digger.router = function(from, to){
	routes[from] = to;
}
/*

	we export these vars to the window immediately - everything else is done inside the $digger handler
	
*/
$digger.Proto = Proto;
$digger.create = Proto.factory;
$digger.config = {};
$digger.user = null;

window._ = _;
window.async = async;
window.$digger = $digger;