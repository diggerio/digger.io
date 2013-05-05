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
var Promise = require('../network/promise');
var Request = require('../network/request').factory;
var Response = require('../network/response').factory;

var ContractResolver = require('../middleware/contractresolver');
var SelectResolver = require('../middleware/selectresolver');

var Query = require('./query');

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

	/*
	
		we keep a container that can connect to radio to control this supplier remotely
		
	*/
	supplier.settings = Container(settings);

	supplier.methods = {};

	/*
	
		the select handlers

		these can be generic or by classname/tag

			product.onsale -> onsale product handler

		each fn gets:

			function(select_query, promise){
				select_query.selector ({tagname:'prodict'....} (parsed selector)
				select_query.context [{diggerid:...}] (meta data for context)

				promise.resolve([container data...])
				promise.reject('error text')
			}
		
	*/

	/*
	
		normal selector fns:

			supplier.use(function(select_query, promise, next){
	
			})

	*/
	var standard_stack = [];

	/*
	
		provide selector fns:
		
	*/
	var specialized_stack = [];

	supplier.handle_container_response = function(req, res, result){
		/*
		
			if the request has asked for containers then we convert the answer explicetly
			
		*/

		if(req.getHeader('x-expect')==='digger/containers'){
			if(!_.isArray(result)){
				result = result ? [result] : [];
			}
			res.setHeader('content-type', 'digger/containers');	
		}

		res.send(result);
	}
	
	supplier.handle_select_query = function(select_query, req, res, next){

		var use_stack = ([]).concat(specialized_stack, standard_stack);
		if(use_stack.length<=0){
			next();
			return;
		}

		/*
		
			do we automatically prepare a query for the select function?

			(this turns the selector and context into an array of SQL/MONGO like queries that is easy to turn
			into a low level database query)
			
		*/
		if(supplier.settings.attr('preparequery')){
			if(!select_query.query){
				select_query.query = Query(select_query.selector, select_query.context);
			}
		}

		var promise = Promise();

		promise.then(function(result){
			supplier.handle_container_response(req, res, result);
		}, function(error){
			res.sendError(error);
		})

		async.forEachSeries(use_stack, function(fn, nextfn){

			fn(select_query, promise, nextfn);

		}, next);

		return promise;
	}




	/*

		a shortcut method - matches the given selector
		against the user selector and triggers this method

		this lets us do:

			supplier.provide('product.onsale', function(select_query){
		
			}
		
	*/
	supplier.specialize = function(provide_selector, fn){

		provide_selector = _.isString(provide_selector) ? ParseSelector.mini(provide_selector) : provide_selector;

		specialized_stack.push(function(select_query, promise, next){

			var query_selector = select_query.selector;

			if(provide_selector.tag!=query_selector.tag){
				next();
				return;
			}

			/*
			
				make sure all the classnames mentioned in the path are in the query selector
				
			*/
			if(!_.all(_.keys(provide_selector.class), function(classname){
				return query_selector.class[classname];
			})){
				next();
				return;
			}

			fn(select_query, promise);
		})

		return supplier;
	}

	supplier.select = function(fn){
		standard_stack.push(fn);
		return supplier;
	}

	supplier.append = function(fn){
		supplier.methods.append = fn;
		return supplier;
	}

	supplier.save = function(fn){
		supplier.methods.save = fn;
		return supplier;
	}

	supplier.remove = function(fn){
		supplier.methods.remove = fn;
		return supplier;
	}



	/*
	
			GET / = list settings
		
	*/
	supplier.get('/', function(req, res, next){
		res.send(supplier.settings);
	})

	var contractresolver = ContractResolver(supplier);
	var selectresolver = SelectResolver(supplier);

	function extractselectors(req){
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

		return selectors;
	}

	var routes = {
		get:{
			select:function(req, res, next){
				if(req.method!='get'){
					next();
					return;
				}

				var selectors = extractselectors(req);

				/*

					SINGLE SELECTOR
				
					with one selector we just trigger the select method
					
				*/
				if(selectors.length<=1){

					supplier.handle_select_query({
						selector:selectors[0],
						context:[]
					}, req, res, next)

				}
				/*
				
					MULTIPLE SELECTOR -> INTERNAL CONTRACT

					with multiple selectors we create a mini contract to resolve as a sub-request
					
				*/
				else{

					var contract = Request({
						method:'post',
						url:'/contract',
						headers:{
							'x-contract-type':'pipe'
						},
						body:_.map(selectors, function(selector, index){
							return Request({
								method:'post',
								url:'/select',
								headers:{
									'x-index':index,
									'x-expect':'digger/containers',
									'x-json-selector':selector
								}
							}).toJSON()
						})
					})

					var contract_response = Response(function(){
						supplier.handle_container_response(req, res, contract_response.body);
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

				var selectors = extractselectors(req);
				var append_query = {
					selector:selectors ? selectors[0] : null,
					selectors:selectors,
					req:req,
					body:req.body
				}

				var promise = Promise();

				promise.then(function(result){
					res.send(result);
				}, function(error){
					res.sendError(error);
				})

				supplier.methods.append(append_query, promise, next);
			},

			/*
			
				the POST select method - this is what is used for reducing contracts

				you post the context (can be blank)

				the selector lives inside the x-json-selector header
				
			*/
			select:function(req, res, next){
				/*
				
					are we in single selector or array mode?
					
				*/
				var selector = req.getHeader('x-json-selector');
				supplier.handle_select_query({
					selector:req.getHeader('x-json-selector') || {},
					context:req.body || []
				}, req, res, next)	
			}

		},
		put:{
			save:function(req, res, next){
				if(!supplier.methods.save){
					next();
					return;
				}

				var selectors = extractselectors(req);
				var save_query = {
					selector:selectors ? selectors[0] : null,
					selectors:selectors,
					req:req,
					body:req.body
				}

				var promise = Promise();

				promise.then(function(result){
					res.send(result);
				}, function(error){
					res.sendError(error);
				})

				supplier.methods.save(save_query, promise, next);
			}
		},
		del:{
			remove:function(req, res, next){
				if(!supplier.methods.remove){
					next();
					return;
				}

				var selectors = extractselectors(req);
				var remove_query = {
					selector:selectors ? selectors[0] : null,
					selectors:selectors,
					req:req,
					body:req.body
				}

				var promise = Promise();

				promise.then(function(result){
					res.send(result);
				}, function(error){
					res.sendError(error);
				})

				supplier.methods.remove(remove_query, promise, next);
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
	
		selector resolver when posted to /resolve
		
	*/
	supplier.post('/resolve', selectresolver);

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


