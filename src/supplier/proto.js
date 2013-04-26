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


var utils = require('../utils');
var _ = require('lodash');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var Container = require('../container');
var Warehouse = require('../warehouse');
var ParseSelector = require('../container/selector');
var Request = require('../network/request').factory;
var Response = require('../network/response').factory;

// prototype

var Supplier = module.exports = function(){}

Supplier.factory = function(settings){

	settings = settings || {};

	if(_.isString(settings)){
		settings = {
			url:settings
		}
	}

	var supplier = Warehouse();
	supplier.settings = Container(settings);
	supplier.methods = {};
	
	_.extend(supplier, Supplier.prototype);

	supplier.get('/', function(req, res, next){
		res.send(supplier.settings);
	})

	var contractresolver = function(req, res, next){


		console.log('-------------------------------------------');
		console.log('-------------------------------------------');
		console.log('-------------------------------------------');
		console.log('CONTRACT RESOLVER');
		next();
	}

	function process_selector_string(string){
		var selector = {
			class:{}
		}
		selector_string = selector_string.replace(/#(\w+?)/, function(match){
			selector.id = match[1];
			return '';
		})
		selector_string = selector_string.replace(/\.(\w+?)/g, function(match){
			selector.class[match[1]] = true;
			return '';
		})
		if(selector_string.match(/\d/)){
			selector.diggerid = selector_string;
		}
		else{
			selector.tag = selector_string;
		}
		return selector;
	}

	var routes = {
		get:{
			select:function(req, res, next){
				if(req.method!='get'){
					next();
					return;
				}

				if(!supplier.methods.select){
					next();
					return;
				}

				var path = req.pathname;

				if(path.indexOf('/dig')===0 || path.indexOf('/container')===0){
					path = path.replace(/^\/\w+/, '');
				}

				if(path.charAt(0)=='/'){
					path = path.substr(1);
				}

				var parts = path.split('/');

				var selectors = _.map(parts, function(part){
					return ParseSelector.mini(part);
				})

				/*
				
					with one selector we just trigger the select method
					
				*/
				if(selectors.length<=1){
					var answer = supplier.methods.select({
						selector:selectors[0]
					})

					answer.then(function(result){
						res.send(result);
					}, function(error){
						res.sendError(error);
					})
				}
				/*
				
					with multiple selectors we create a mini contract to resolve as a sub-request
					
				*/
				else{

					var contract = Request({
						method:'post',
						url:'/contract',
						headers:{
							'x-contract-type':'pipe'
						},
						body:_.map(selectors, function(selector){
							return Request({
								method:'post',
								url:'/selector',
								headers:{
									'x-json-selector':selector
								}
							}).toJSON()
						})
					})

					var contract_response = Response(function(){
						res.fill(contract_response);
					})

					supplier(contract, contract_response, next);
				}

			}
		},
		post:{
			contract:function(req, res, next){
				contractresolver(req, res, next);
			},
			radio:function(req, res, next){
				next();
			},
			append:function(req, res, next){
				if(!supplier.methods.append){
					next();
					return;
				}

				next();
			},
			/*
			
				the POST select method - this is what is used for reducing contracts

				you post the context (can be blank)

				the selector lives inside the x-json-selector header
				
			*/
			select:function(req, res, next){
				if(!supplier.methods.select){
					next();
					return;
				}

				var query = supplier.methods.select({
					selector:req.getHeader('x-json-selector'),
					context:req.body
				})

				query.then(function(result){
					res.send(result);
				}, function(error){
					res.sendError(error);
				})
			}
		},
		put:{
			save:function(req, res, next){
				next();
			}
		},
		del:{
			remove:function(req, res, next){
				next();
			}
		}
	}

	/*
	
		/dig/product.onsale
		/dig/product
		/dig/123 -> /dig/=123
	
	*/

	supplier.use(routes.get.select);

	/*
	
		resolve a contract within the context of this supplier
		
	*/
	supplier.post('/contract', routes.post.contract);

	/*
	
		resolve a select stage as part of a contract
		
	*/
	supplier.post('/select', routes.post.select);

	/*
	
		speak over radio from HTTP
		
	*/
	supplier.post('/radio', routes.post.radio);
	supplier.post('/radio/:id', routes.post.radio);

	/*
	
		add some containers
		
	*/
	supplier.post('/', routes.post.append);
	supplier.post('/:id', routes.post.append);
	supplier.post('/container/:id', routes.post.append);

	/*
	
		save a container
		
	*/
	supplier.put('/:id', routes.put.save);
	supplier.put('/container/:id', routes.put.save);

	/*
	
		delete a container
		
	*/
	supplier.del('/:id', routes.del.remove);
	supplier.del('/container/:id', routes.del.remove);

	/*
	
		this will pull out the context details for the targeted container
		and stick them into the digger object upon the request
		
	*/

	return supplier;
}

Supplier.prototype.select = function(fn){
	this.methods.select = fn;
	return this;
}

Supplier.prototype.append = function(fn){
	this.methods.append = fn;
	return this;
}

Supplier.prototype.save = function(fn){
	this.methods.save = fn;
	return this;
}

Supplier.prototype.remove = function(fn){
	this.methods.remove = fn;
	return this;
}
