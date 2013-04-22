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

Response.factory = function(data, errorhandler){

  /*
  
    sort out the constructor so you can quickly
    create responses with the callback hooked up
    
  */
  var fn = null;

  if(_.isFunction(data)){
    fn = data;
    data = null;
  }

  var ret = new Response(data);

  ret.on('send', function(){
    

    if(ret.statusCode===200){
      ret.emit('success', ret.body);

    }
    else{
      ret.emit('failure', ret.statusCode);
    }
  })

  if(fn){
    ret.on('success', fn);
  }

  if(errorhandler){
    ret.on('failure', errorhandler);
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

Response.prototype.send404 = function(text){
  this.statusCode = 404;
  this.send(text);
}

Response.prototype.redirect = function(location){
  this.statusCode = 302;
  this.send(location);
}