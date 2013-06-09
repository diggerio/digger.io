/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


// ORIGINAL CONNECT LICENSE
/*!
 * Connect - HTTPServer
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */


var utils = require('../utils');
var _ = require('lodash');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var Container = require('../container/proto');
var Router = require('./router');

// prototype

var Warehouse = module.exports = function(){}

Warehouse.factory = function(){
  function app(req, res, next){ app.handle(req, res, next); }
  _.extend(app, Warehouse.prototype);
  _.extend(app, EventEmitter.prototype);
  app.initialize();

  for (var i = 0; i < arguments.length; ++i) {
    app.use(arguments[i]);
  }

  app._diggertype = 'warehouse';

  return app;
}

Warehouse.prototype.initialize = function(){
  this.route = '/';
  this.stack = [];
  this._router = Router();
  this._prepared = true;
  this._preparestack = [];
  this._mounts = {};
}

/*

  some warehouses need to get stuff ready before they start
  processing requests

    warehouse.prepare(function(finished){
      ... do stuff perhaps async
      finished();
    })
  
*/

Warehouse.prototype.prepare = function(setupfn){
  var self = this;
  this._prepared = false;
  setupfn(function(){
    self._prepared = true;
    var callbacks = self._preparestack;
    self._preparestack = [];
    async.forEach(callbacks, function(fn, nextfn){
      fn();    
      nextfn();
    }, function(){

    })
  })
}

/*

  I totally stole the connect middleware stack

 */

Warehouse.prototype.use = function(route, fn){
  // default route to '/'
  if ('string' != typeof route) {
    fn = route;
    route = '/';
  }

  // wrap sub-apps
  if ('function' == typeof fn.handle) {
    var server = fn;
    fn.route = route;
    fn = function(req, res, next){
      server.handle(req, res, next);
    };
  }

  // wrap dispatch configs
  if ('object' == typeof fn){
    this._router.use(route, fn);
    return this;
  }

  /*
  if (fn instanceof http.Server) {
    fn = fn.listeners('request')[0];
  }
  */

  // strip trailing slash
  if ('/' == route[route.length - 1]) {
    route = route.slice(0, -1);
  }

  // add the middleware
  this.stack.push({ route: route, handle: fn });

  return this;
};

_.each([
  'head',
  'get',
  'post',
  'put',
  'del'
], function(method){

  Warehouse.prototype[method] = function(route, fn) {

    this._router[method].apply(this._router, [route, fn]);
    return this;

  }

})

/*
 
  a total ripoff of the connect middleware handler

 */

Warehouse.prototype.handle = function(req, res, parentout) {

  var self = this;

  function finish(err){

    if(res.headerSent){
      return;
    }

    if(err){
      res.sendError(err);
      return;
    }

    self._router(req, res, function(){
      if(parentout){
        parentout(req, res);
      }
      else{
        res.send404(req);
      }
    })
  }

  if(!this._prepared){
    this._preparestack.push(function(){
      self.handle(req, res, parentout);
    })
    return;
  }

  this.emit('request', req, res);

  var stack = this.stack;
  var removed = '';
  var slashAdded = false;
  var index = 0;

  function next(err) {
    var layer, url, status, c;

    if (slashAdded) {
      req.pathname = req.pathname.substr(1);
      slashAdded = false;
    }

    req.pathname = removed + req.pathname;
    removed = '';

    // next callback
    layer = stack[index];
    index++;

    // all done
    if (!layer || res.headerSent) {

      finish(err);
      
      return;
    }

    /*
    
      THIS SHOULD BE TURNED BACK ON!!!
      
    */
    //try {

      url = req.pathname;

      if (undefined === url) url = '/';

      // skip this layer if the route doesn't match.
      if (0 !== url.toLowerCase().indexOf(layer.route.toLowerCase())) return next(err);

      c = url[layer.route.length];
      if (c && '/' != c && '.' != c) return next(err);

      // Call the layer handler
      // Trim off the part of the url that matches the route
      removed = layer.route;
      req.pathname = req.pathname.substr(removed.length);  

      
      // Ensure leading slash
      if ('/' != req.pathname[0]) {
        req.pathname = '/' + req.pathname;
        slashAdded = true;
      }

      var arity = layer.handle.length;
      
      if (err) {
        if (arity === 4) {
          layer.handle(err, req, res, next);
        } else {
          next(err);
        }
      } else if (arity < 4) {
        layer.handle(req, res, next);
      } else {
        next();
      }
    //} catch (e) {
      //next(e);
    //}
  }
  next();
};