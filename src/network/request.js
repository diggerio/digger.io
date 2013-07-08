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
var url = require('url');
var _ = require('lodash');

/*


  
*/

module.exports = Request;

var url_fields = [
  'protocol',
  'hostname',
  'port',
  'pathname',
  'hash'
]

var default_fields = {
  'protocol':'http:',
  'hostname':'localhost',
  'port':null,
  'pathname':'/',
  'hash':null
}

function Request(data){
  var self = this;
  data = data || {};
  Message.apply(this, [data]);

  this.url = data.url || '/';
  this.method = data.method || 'get';
  this.query = data.query || {};

  var parsed = url.parse(this.url);

  if(parsed.query){
    _.each(parsed.query.split('&'), function(part){
      var parts = part.split('=');
      self.query[parts[0]] = parts[1];
    })
  }

  _.each(url_fields, function(field){
    self[field] = parsed[field] || default_fields[field];
  })
}


Request.factory = function(data){
  return new Request(data);
}


util.inherits(Request, Message);

Request.prototype.clone = function(){
  return Request.factory(JSON.parse(JSON.stringify(this.toJSON())));
}

Request.prototype.debug = function(){
  this.setHeader('x-digger-debug', true);
  return this;
}

Request.prototype.inject = function(child){
  var self = this;
  _.each([
    'x-digger-debug',
    'x-json-resource',
    'x-json-meta',
    'x-json-user',
    'x-contract-id'
  ], function(field){
    var val = self.getHeader(field);
    if(val){
      child.setHeader(field, val);  
    }
  })
  return this;
}

Request.prototype.toJSON = function(){
  var self = this;
  var ret = Message.prototype.toJSON.apply(this);

  ret.url = this.url;
  ret.method = this.method;
  ret.query = this.query;

  _.each(url_fields, function(field){
    ret[field] = self[field];
  })

  return ret;
}

Request.prototype.expect = function(content_type){
  this.setHeader('x-expect', content_type);
  return this;
}