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

var util = require('util');
var Message = require('./message');
var _ = require('lodash');
var Q = require('q');

/*

  
*/

module.exports = Response;

function Response(data){
  Message.apply(this, [data]);
  this.statusCode = data ? data.statusCode : 200;
}

Response.factory = function(data, errorfn){

  /*
  
    sort out the constructor so you can quickly
    create responses with the callback hooked up
    
  */
  var fn = null;
  var autoresolve = false;
  if(_.isFunction(data)){
    fn = data;
    data = null;
  }
  else if(_.isBoolean(data)){
    autoresolve = data;
    data = null;
  }

  var ret = new Response(data);

  var sent = false;

  /*
  
    AUTO RESOLVE

    this is for client sided responses that will parse the body
    for multipart messages

    server side responses are more often concerned with just moving stuff
    around to want to open the content and process - hence not 'resolving'
    
  */
  if(autoresolve){
    ret.on('send', function(){
      ret.resolve();
    })
  }

  if(fn){
    ret.on('send', fn);
  }

  return ret;
}

util.inherits(Response, Message);

/*

  inject the raw data from an over the wire response
  and trigger the appropriate event
  
*/
Response.prototype.fill = function(answer){
  if(!answer){
    return this;
  }
  this.statusCode = answer.statusCode;
  this.headers = answer.headers;
  this.body = answer.body;
  this.send(answer.body);
}

Response.prototype.statusCode = 200;

Response.prototype.send = function(body){
  if(this.headerSent===true){
    throw new Error('cannot send response after headers have been sent');
  }

  this.body = arguments.length>0 ? body : this.body;
  this.emit('beforesend', body);
  this.emit('send', body);
  this.emit('aftersend', body);
  this.headerSent = true;
  return this;
}

Response.prototype.resolve = function(fn){

  if(!this.statusCode){
    this.statusCode = 200;
  }

  var results = [];
  var errors = [];
  var branches = this.getHeader('x-json-branches') || [];

  function resolvemutlipart(multires){
    if(multires.statusCode==200){
      if(multires.getHeader('content-type')=='digger/multipart'){
        _.each(multires.body, function(raw){
          if(!raw.statusCode){
            raw.statusCode = 200;
          }
          resolvemutlipart(new Response(raw));
        })
      } 
      else{
        var subbranches = multires.getHeader('x-json-branches') || [];
        branches = branches.concat(subbranches);
        if(_.isArray(multires.body)){
          results = results.concat(multires.body);
        }
        else{
          results.push(multires.body);
        }
      }
    }
    else{
      errors.push(multires.body);
    }
  }

  if(this.statusCode===200){
    if(this.getHeader('content-type')=='digger/multipart'){
      resolvemutlipart(this);
      if(results.length>0){
        this.emit('success', results, this);
      }

      if(errors.length>0){
        this.emit('failure', errors, this);    
      }
    }
    else{
      results = this.body;
      this.emit('success', this.body, this);
    }
  }
  else{
    errors = this.body;
    this.emit('failure', this.body, this);
  }

  this.setHeader('x-json-branches', branches);

  if(fn){
    fn(results, errors);
  }  
}

Response.prototype.toJSON = function(){
  var ret = Message.prototype.toJSON.apply(this);
  ret.statusCode = this.statusCode;
  return ret;
}

Response.prototype.hasError = function(){
  return this.statusCode!==200;
}

Response.prototype.sendError = function(text){
  this.statusCode = 500;
  this.send(text);
}

Response.prototype.send404 = function(req){
  this.statusCode = 404;
  this.send(req ? req.toJSON() : null);
}

Response.prototype.redirect = function(location){
  this.statusCode = 302;
  this.send(location);
}

Response.prototype.add = function(childres){
  this.setHeader('content-type', 'digger/multipart');
  if(!this.body){
    this.body = [];
  }
  this.body.push(_.isFunction(childres.toJSON) ? childres.toJSON() : childres);
  return this;
}