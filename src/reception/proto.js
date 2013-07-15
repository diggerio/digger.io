/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/**
 * Module dependencies.
 */


var utils = require('digger-utils');
var _ = require('lodash');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var digger = require('digger');

var Container = digger.create;
var Warehouse = require('../warehouse/proto').factory;

var ContractResolver = require('../middleware/contractresolver');

// prototype
var Reception = module.exports = function(){}

Reception.factory = function(settings){

	settings = _.clone(settings || {});

	settings = _.defaults(settings, {
		
	})

	var reception = Warehouse();

	var contractresolver = ContractResolver(reception);
	/*
	
		prevent warehouses from messing with the path
		
	*/
	reception._fixedpaths = true;

	/*
	
		we keep a container that can connect to radio to control this supplier remotely
		
	*/
	reception.settings = Container(settings);

	reception.use(contractresolver);

	return reception;
}


