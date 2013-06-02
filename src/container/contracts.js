/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Module dependencies.
*/

var _ = require('lodash');

var Contract = require('../network/contract').factory;
var Request = require('../network/request').factory;
var ParseSelector = require('./selector');

module.exports = {
  select:select,
  append:append,
  save:save,
  remove:remove
}

/*

  SELECT 
  turns an array of selector strings into a pipe contract

  the strings are reversed as in:

    "selector", "context"

  becomes

    context selector

  in the actual search (this is just how jQuery works)
  
*/
function select(){

  /*
  
    first get an array of selector objects

    we make a pipe contract out of these

    then duplicate that pipe contract for each different diggerwarehouse

    
  */
  var selector_strings = _.toArray(arguments).reverse();
  var selectors = _.map(selector_strings, function(string){
    return _.isString(string) ? ParseSelector(string) : string;
  })
  
  /*
  
    the 'context' are the models inside 'this' container

    the _digger objects will be sent as the body of the select request
    for each supplier to use as the context (i.e. starting point for the query)

    _supplychain objects are ignored from the context
    
  */
  var context = this.containers();/*.filter(function(container){
    return container.tag()!='_supplychain';
  })*/

  /*
  
    split out the current context into their warehouse origins
    
  */
  var groups = _.groupBy(context, function(container){
    return container.diggerwarehouse() || '/';
  })

  var warehouseids = _.keys(groups);

  /*
  
    the top level contract - this will be resolved in the holdingbay

    it is a merge of the various warehouse targets
    
  */
  var contract = Contract('merge');
  contract.method = 'post';
  contract.url = 'reception:/';

  contract.body = _.map(warehouseids, function(diggerwarehouse){

    /*
    
      the contract directed torwards the supplier warehouse

      a PIPE of the selector strings, reversed

      we input the context as the group of containers living in the given warehouse
      
    */
    var containers = _.filter(groups[diggerwarehouse], function(container){
      return container.tag()!='_supplychain';
    })

    var skeleton = _.map(containers, function(c){
      return c.meta();
    })

    /*
    
      the top level that pipes selector strings (in reverse)
      
    */
    var suppliercontract = Request({
      method:'post',
      headers:{
        'x-json-selector-strings':selectors
      },
      url:((diggerwarehouse=='/' ? null : diggerwarehouse) || '') + '/resolve',
      body:skeleton || []
    })    

    return suppliercontract.toJSON();
  })

  contract.supplychain = this.supplychain;
  contract.expect('digger/containers');
  return contract;
}

/*

  POST

  
*/
function append(childarray){

  var contract = Contract('merge');
  contract.method = 'post';
  contract.url = 'reception:/';

  /*
  
    in both these cases there is nothing to do
    
  */
  if(arguments.length<=0){
    return contract;
  }

  if(this.count()<=0){
    return contract;
  }

  if(!_.isArray(childarray)){
    childarray = [childarray];
  }
  
  var appendmodels = [];
  _.each(childarray, function(child){
    appendmodels = appendmodels.concat(child.models);
  })

  var appendto = this.get(0);
  var appendcontainer = this.spawn(appendmodels);
  var appendwarehouse = this.diggerwarehouse();

  appendcontainer.recurse(function(des){
    des.diggerwarehouse(appendwarehouse);
  })

  appendto._children = appendto._children.concat(appendmodels);

  var suppliercontract = Request({
    method:'post',
    url:this.diggerurl(),
    body:appendmodels || []
  })    

  contract.body = [suppliercontract.toJSON()];
  
  contract.supplychain = this.supplychain;
  return contract;
}

/*

  PUT
  
*/
function save(){

  var contract = Contract('merge');
  contract.method = 'post';
  contract.url = 'reception:/';

  var url = contract.url;
  var data = this.get(0);

  var suppliercontract = Request({
    method:'put',
    url:this.diggerurl(),
    body:this.eq(0).toJSON()[0]
  })

  contract.body = [suppliercontract.toJSON()];
  
  contract.supplychain = this.supplychain;
  return contract;
}

/*

  DELETE
  
*/
function remove(){

  var contract = Contract('merge');
  contract.method = 'post';
  contract.url = 'reception:/';

  var suppliercontract = Request({
    method:'delete',
    url:this.diggerurl()
  })    

  contract.body = [suppliercontract.toJSON()];

  contract.supplychain = this.supplychain;
  return contract;
}