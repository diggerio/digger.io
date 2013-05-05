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
var utils = require('../utils');
var Request = require('./request');

/*


  
*/

module.exports = Contract;

function Contract(data){
  var self = this;
  data = data || {};
  if(_.isString(data)){
    data = {
      headers:{
        'x-contract-type':data
      }
    }
  }
  Request.apply(this, [data]);

  this.setHeader('content-type', 'digger/contract');

  if(!this.getHeader('x-contract-type')){
    this.setHeader('x-contract-type', 'merge');
  }

  if(!this.getHeader('x-contract-id')){
    this.setHeader('x-contract-id', utils.diggerid());
  }

  if(!this.body){
    this.body = [];
  }
}

util.inherits(Contract, Request);

Contract.factory = function(data){
  return new Contract(data);
}

Contract.prototype.add = function(req){
  var self = this;
  if(_.isArray(req)){
    _.each(req, function(item){
      self.add(item);
    })
  }
  else{
    this.body.push(_.isFunction(req.toJSON) ? req.toJSON() : req);  
  }
  return this;
}