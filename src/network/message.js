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

var _ = require('lodash');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

/*

  telegraft - network request

  basic version of http.serverRequest
  
*/

module.exports = Message;

function Message(data){
  data = data || {};
  EventEmitter.call(this);
  this.headers = data.headers || {};
  this.body = data.body || null;
  this.headerSent = false;
}

util.inherits(Message, EventEmitter);

Message.prototype.toJSON = function(){
  return {
    headers:this.headers,
    body:this.body
  }
}

/*

  copied mostly from node.js/lib/http.js
  
*/
Message.prototype.setHeader = function(name, value) {
  if (arguments.length < 2) {
    throw new Error('`name` and `value` are required for setHeader().');
  }

  if (this.headerSent) {
    throw new Error('Can\'t set headers after they are sent.');
  }

  var key = name.toLowerCase();
  this.headers = this.headers || {};
  this.headers[key] = value;
  return this;
}


Message.prototype.getHeader = function(name) {
  if (arguments.length < 1) {
    throw new Error('`name` is required for getHeader().');
  }

  if (!this.headers) return;

  var key = name.toLowerCase();
  var value = this.headers[key];

  if(!value){
    return value;
  }

  if(name.indexOf('x-json')===0 && _.isString(value)){
    value = this.headers[key] = JSON.parse(value);
  }
  
  return value;
}


Message.prototype.removeHeader = function(name) {
  if (arguments.length < 1) {
    throw new Error('`name` is required for removeHeader().');
  }

  if (this.headerSent) {
    throw new Error('Can\'t remove headers after they are sent.');
  }

  if (!this.headers) return;

  var key = name.toLowerCase();
  delete this.headers[key];
}