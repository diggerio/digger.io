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

var debug = require('debug')('supplier');

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

	supplier.url = function(){
		return this.settings.attr('url') || '/';
	}

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

	/*
	
		suppliers always return container data

		this converts any straggling data into containers

		it also 'stamps' the containers (i.e. injects a diggerwarehouse path into the meta)
		
	*/
	supplier.handle_container_response = function(req, res, result){

		if(!result || (_.isArray(result) && result.length<=0)){
			result = [];
		}
		else{
			if(!_.isArray(result)){
				result = [result];
			}

			var warehouseurl = this.url() || '/';

			result = _.map(result, function(item){
				if(!_.isObject(item)){
					item = {
						data:item
					}
				}

				if(!item._digger){
					item._digger = {};
				}

				if(!item._digger.diggerwarehouse){
					item._digger.diggerwarehouse = warehouseurl || '/';
					//item._digger.diggerwarehouse = req.getHeader('x-warehouse-url') || '/';
				}

				return item;
			})
		}

		res.setHeader('content-type', 'digger/containers');	
		res.send(result);
	}

	/*
	
		this stub for query preparation

		depending on what flavour supplier will decide what happens here
		
	*/
	supplier.prepare_select_query = function(select_query){
		return this;
	}
	
	/*
	
		each iteration of a nested selector ends up here

		each different supplier can hook into the select query event
		
	*/
	supplier.handle_select_query = function(select_query, req, res, next){

		var use_stack = ([]).concat(specialized_stack, standard_stack);
		if(use_stack.length<=0){
			next();
			return;
		}

		//supplier.emit('select_query', select_query);

		supplier.prepare_select_query(select_query);

		var promise = Promise();

		promise.then(function(result){
			if(result && !_.isArray(result)){
				result = [result];
			}
			else if(!result){
				result = [];
			}
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
						req:req,
						selector:selectors[0],
						context:[]
					}, req, res, next)

				}
				/*
				
					MULTIPLE SELECTOR -> INTERNAL CONTRACT

					with multiple selectors we create a mini contract to resolve as a sub-request
					
				*/
				else{

					/*
					
						fake up the selectors into a proper query that is passed to /resolve

						this means sticking the flat selector array into a phase then a string

						[selectorA, selectorB] -> [[[selectorA, selectorB]]]
						
					*/
					var strings = [{
						string:req.url.replace(/^\//, '').replace(/\//g, ' '),
						phases:[selectors]
					}]

					var selector_request = Request({
						method:'post',
						url:'/resolve',
						headers:{
							'x-json-selector-strings':strings
						}
					})

					var selector_response = Response(function(){
						supplier.handle_container_response(req, res, selector_response.body);
					})

					supplier(selector_request, selector_response);
				}

			}
		},
		post:{
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
					supplier.emit('append', req, res);
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
					req:req,
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
					supplier.emit('save', req, res);
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
					supplier.emit('remove', req, res);
				}, function(error){
					res.sendError(error);
				})

				supplier.methods.remove(remove_query, promise, next);
			}
		}
	}


	/*
	
		the built in contract resolver

		when running in network mode - this will not usually get hit because
		the reception contract resolver will have filtered out the contract layer
		and sent on just the requests to the suppliers


		however - when running a supplychain directly onto a supplier and not via reception
		this middleware will pick up contract requests and process them self-referencing
		to ourselves for the supplychain
		
	*/
	supplier.use(contractresolver);

	/*
	
		this picks up the x-warehouse-url (if present)
		and removes that from the start of the url

		this enables all routing to not have to touch the url

		i.e. each supplier looks after the following:

			/some/long/path/to/get/here/product/caption

		becomes locally to the supplier

			/product/caption

		and

			/some/long/path/to/get/here

		is injected into each containers _digger.diggerwarehouse property

		x-warehouse-url is ONLY set from reception
		
	*/
	supplier.use(function(req, res, next){
		var warehouseurl = supplier.url() || '/';
		if(warehouseurl!=='/' && req.url.indexOf(warehouseurl)===0){
			req.url = req.url.substr(warehouseurl.length);
		}
		next();
	})

	/*
	
		/dig/product.onsale
		/dig/product
		/dig/123 -> /dig/=123
	
	*/

		/*
	
			GET / = list settings
		
	*/
	supplier.get('/', function(req, res, next){
		res.send(supplier.settings);
	})
	
	/*
	
		why this is not get I do not know
		
	*/
	supplier.use(routes.get.select);

	/*
	
		POST /resolve -> SELECT single selector
		
	*/
	supplier.post('/select', routes.post.select);

	/*
	
		POST /resolve -> SELECT multiple selector
		
	*/
	supplier.post('/resolve', selectresolver);

	/*
	
		POST / APPEND
		
	*/

	supplier.post('/', routes.post.append);
	supplier.post('/:id', routes.post.append);

	/*
	
		PUT / SAVE
		
	*/
	supplier.put('/:id', routes.put.save);

	/*
	
		DELETE / REMOVE
		
	*/
	supplier.del('/:id', routes.del.remove);

	/*
	
		this will pull out the context details for the targeted container
		and stick them into the digger object upon the request
		
	*/

	return supplier;
}


