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

$digger._trigger_ready = function(){
	_.each(readycallbacks, function(fn){
		fn.apply($digger, [$digger]);
	})
	readycallbacks = [];
}

/*

	this connects the socket

	it is passed any config by the server
	
*/
$digger.bootstrap = function(config){
	config = _.defaults(config, {
		protocol:'http://',
		host:'digger.io',
		channel:null
	})

	var socket = io.connect([config.protocol, config.host, '/', config.channel].join(''));

	socket.on('connect', function(){
		$digger._trigger_ready();
	})

	$digger.supplychain = SupplyChain(function(req, res){
		socket.emit('request', req.toJSON(), function(rawres){
			console.log('-------------------------------------------');
			console.log('answer');
			console.dir(rawres);
			res.fill(rawres);
		})
	})

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

/*

	we export these vars to the window immediately - everything else is done inside the $digger handler
	
*/
$digger.Proto = Proto;
$digger.create = $digger.Proto.factory;

window._ = _;
window.async = async;
window.$digger = $digger;