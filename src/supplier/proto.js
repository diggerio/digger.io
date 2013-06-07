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
var Container = require('../container/proto').factory;
var Warehouse = require('../warehouse/proto').factory;
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

	supplier._diggertype = 'supplier';

	/*
	
		we keep a container that can connect to radio to control this supplier remotely
		
	*/
	supplier.settings = Container(settings);

	supplier.methods = {};

	var providermode = supplier.settings.attr('provider')===true;

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

			fn.apply(supplier, [select_query, promise, nextfn]);

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

	supplier.has_select_method = function(){
		return standard_stack.length>0;
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

	/*
	
		loads a single container from the supplier

		performs a sub-request to load it
		
	*/
	supplier.load = function(id, callback){

		var target_selector = {
			diggerid:id
		}
		/*
		
			we only want meta data
			
		*/
		target_selector.laststep = true;

		/*
		
			for appends we load the container to append to automatically
			using a self referential request
			
		*/
		var load_target_req = Request({
			method:'post',
			url:'/selector',
			headers:{
				'x-json-selector':target_selector
			}
		})

		var load_target_res = Response(function(){

			if(load_target_res.hasError()){
				res.error(load_target_res.body);
				return;
			}

			var targetdata = _.isArray(load_target_res.body) ? load_target_res.body[0] : null;

			if(!targetdata){
				res.send404();
				return;
			}

			/*
			
				we now have the skeleton that is the target of the append/save/remove request
				
			*/
			callback(null, targetdata);
		})

		supplier.handle_select_query({
			req:load_target_req,
			selector:target_selector || {},
			context:[]
		}, load_target_req, load_target_res, function(){
			res.send404();
		})
	}

	/*
	
		a function used by append / save and remove

		this loads the target based on the selector =34324234324
		
	*/
	supplier.load_target = function(req, res, callback){
		var selectors = extractselectors(req);
		var target_selector = selectors[0];

		/*
		
			if there is no digger id then we assume the target to be none
			(i.e. the supplier itself)
			
		*/
		if(!target_selector.diggerid){
			callback();
			return;
		}

		supplier.load(target_selector.diggerid, callback);
		
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

			/*
			
				the POST select method - this is what is used for reducing contracts

				you post the context (can be blank)

				the selector lives inside the x-json-selector header
				
			*/
			select:function(req, res, next){
				/*
				
					are we in single selector or array mode?
					
				*/

				supplier.handle_select_query({
					req:req,
					selector:req.getHeader('x-json-selector') || {},
					context:req.body || []
				}, req, res, next)	
			},

			append:function(req, res, next){

				if(!supplier.methods.append || !supplier.has_select_method()){
					next();
					return;
				}

				supplier.load_target(req, res, function(error, target){

					var append_query = {
						req:req,
						target:target,
						body:req.body
					}

					var promise = Promise();

					promise.then(function(result){
						res.send(result);
						supplier.emit('append', req, res);
					}, function(error){
						res.sendError(error);
					})

					supplier.methods.append.apply(supplier, [append_query, promise, next]);
				})

			}

		},
		put:{
			save:function(req, res, next){

				if(!supplier.methods.save || !supplier.has_select_method()){
					next();
					return;
				}

				supplier.load_target(req, res, function(error, target){

					if(!target){
						res.send404();
						return;
					}

					var save_query = {
						req:req,
						target:target,
						body:req.body
					}

					var promise = Promise();

					promise.then(function(result){
						res.send(result);
						supplier.emit('save', req, res);
					}, function(error){
						res.sendError(error);
					})

					supplier.methods.save.apply(supplier, [save_query, promise, next]);
				})
			}
		},
		del:{
			remove:function(req, res, next){
				if(!supplier.methods.remove || !supplier.has_select_method()){
					next();
					return;
				}

				supplier.load_target(req, res, function(error, target){

					if(!target){
						res.send404();
						return;
					}

					var remove_query = {
						req:req,
						target:target,
						body:req.body
					}

					var promise = Promise();

					promise.then(function(result){
						res.send(result);
						supplier.emit('remove', req, res);
					}, function(error){
						res.sendError(error);
					})

					supplier.methods.remove.apply(supplier, [remove_query, promise, next]);
				})
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
	
		removes the URL of the supplier from the request so the supplier functions
		don't care where the supplier is mounted
		
	*/
	supplier.use(function(req, res, next){

		var warehouseurl = supplier.url() || '/';
		if(warehouseurl!=='/' && req.url.indexOf(warehouseurl)===0){
			req.pathname = req.pathname.substr(warehouseurl.replace(/^\w+:/, '').length);
		}
		next();
	})

	/*
	
		checks if we are in provider mode and extracts the first chunk of the path as the
		resource
		*/

	var reserved_resource_names = {
		resolve:true,
		select:true
	}
		
	supplier.use(function(req, res, next){
		
		if(providermode){

			req.pathname = req.pathname.replace(/^\/\w+/, function(match){
				var resource = match.substr(1);
				if(!reserved_resource_names[resource]){
					req.setHeader('x-digger-resource', resource);
					return '';
				}
				else{
					return match;
				}
			})
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


