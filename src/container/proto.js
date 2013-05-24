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
var EventEmitter = require('events').EventEmitter;
var deepdot = require('./deepdot');
var async = require('async');
var utils = require('../utils');
var ModelFactory = require('./models');
var Finder = require('./search');
var Contracts = require('./contracts');

/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Factory

  create new containers with input data
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

var Container = module.exports = function Container(){}

/*

	Factory
	
*/
Container.factory = function factory(){
	/*
  
    first let's extract the model data
    
  */
  var models = ModelFactory.apply(null, _.toArray(arguments));

  /*
  
    now make the actual container which is a function that triggers it's own 'select' method
    (for JQuery style selects like):

      container('some.selector')

    which is the same as

      container.select('some.selector')
    
  */
  var instance = function container(){
    return instance.select.apply(instance, _.toArray(arguments));
  }

  /*
  
    now map in the prototype
    
  */

  _.extend(instance, Container.prototype);
  _.extend(instance, EventEmitter.prototype);

  instance.build(models);
  
  return instance;
}

Container.prototype.build = function(models){
	var self = this;
	this.models = models;
}

/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Data exporting

  these methods will output the underlying models in the given format
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

Container.prototype.toJSON = function(){
	return this.models;
}

Container.prototype.toXML = function(){
	return ModelFactory.toXML(this.models);
}

/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Spawning - these methods generate new containers using the provided model data

  The new containers will have the same supplychain as the spawning (parent) container
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */


Container.prototype.spawn = function(models){
  models = models || [];
	var container = Container.factory(models);
	container.supplychain = this.supplychain;
	return container;
}

Container.prototype.children = function(){
  var models = [];
  this.each(function(container){
    models = models.concat(container.get(0).__children__);
  })
	return this.spawn(models);
}

Container.prototype.recurse = function(fn){
  this.descendents().each(fn);
  return this;
}

Container.prototype.descendents = function(){
  var ret = [];

  function scoopmodels(container){
    ret = ret.concat(container.models);
    container.children().each(scoopmodels);
  }

  scoopmodels(this);

  return this.spawn(ret);
}

Container.prototype.containers = function(){
  var self = this;
  return _.map(this.models, function(model){
    return self.spawn([model]);
  })
}

Container.prototype.skeleton = function(){
  return _.map(this.models, function(model){
    return model.__digger__ || {};
  })
}

Container.prototype.add = function(container){
  var self = this;
  if(_.isArray(container)){
    _.each(container, function(c){
      self.add(c);
    })
  }
  else{
    this.models = this.models.concat(container.models);
  }
  return this;
}

/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Models

  Iteration and access methods for the underlying model array
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

Container.prototype.each = function(fn){
	_.each(this.containers(), fn);
	return this;
}

Container.prototype.map = function(fn){
	return _.map(this.containers(), fn);
}

Container.prototype.count = function(){
	return this.models.length;
}

Container.prototype.first = function(){
	return this.eq(0);
}

Container.prototype.last = function(){
	return this.eq(this.count()-1);
}

Container.prototype.eq = function(index){
	return this.spawn(this.get(index));
}

Container.prototype.get = function(index){
	return this.models[index];
}

/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Property Accessors
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

/*

  generic wrapper function to handle our array of models via a single function

  
*/

function valuereader(model, name){
  return deepdot(model, name);
}
function valuesetter(models, name, value, silent){
  _.each(models, function(model){
    deepdot(model, name, value);
  })
}

function wrapper(key, options){

  options = options || {};

  if(_.isString(options)){
    options = {
      leaf:options
    }
  }

  var leaf = options.leaf;
  var fullkey = leaf ? (key ? key + '.' : '') + leaf : (key || '');

  fullkey = fullkey.replace(/^\./, '');

  return function(){
    var self = this;

    /*
    
      READ
      -----
      wholesale getter of the object
      
    */
    if(arguments.length<=0){
      return valuereader(this.models[0], fullkey);
    }
    /*
    
      READ
      -----
      we are reading a first model value

    */
    else if(arguments.length==1 && _.isString(arguments[0]) && !leaf){
      return valuereader(this.models[0], [key, arguments[0]].join('.'));
    }
    /*
    
      WRITE
      -----
      we are setting an object
      
    */
    else if(arguments.length==1){
      var name = fullkey;
      valuesetter(this.models, fullkey, arguments[0], this._silent);
      return self;
    }
    /*
    
      WRITE
      -----
      we are setting a string value
      
    */
    else if(arguments.length>1){
      valuesetter(this.models, [fullkey, arguments[0]].join('.'), arguments[1], this._silent);
      return self;
    }
  }
  
}

function remove_wrapper(topprop){
  return function(prop){
    var self = this;
    if(arguments.length<=0){
      return this;
    }
    if(!_.isArray(prop)){
      prop = [prop];
    }
    _.each(prop, function(p){
      self[topprop](p, null);
    })
    return this;
  }
}

Container.prototype.attr = wrapper();
Container.prototype.removeAttr = remove_wrapper();

Container.prototype.digger = wrapper('__digger__');

Container.prototype.meta = wrapper('__digger__');
Container.prototype.removeMeta = remove_wrapper('__digger__');

Container.prototype.data = wrapper('__data__');
Container.prototype.removeData = remove_wrapper('__data__');

Container.prototype.diggerid = wrapper('__digger__', 'diggerid');
Container.prototype.diggerwarehouse = wrapper('__digger__', 'diggerwarehouse');

Container.prototype.diggerurl = function(){
  var warehouse = this.diggerwarehouse();
  var id = this.diggerid();
  return (warehouse ? warehouse : '') + (id ? '/' + id : '');
}

Container.prototype.id = wrapper('__digger__', 'id');
Container.prototype.tag = wrapper('__digger__', 'tag');
Container.prototype.classnames = wrapper('__digger__', 'class');

Container.prototype.addClass = function(classname){
  var self = this;
  _.each(this.models, function(model){
		model.__digger__.class.push(classname);
		model.__digger__.class = _.uniq(model.__digger__.class);
  })
  return this;
}

Container.prototype.removeClass = function(classname){
  var self = this;
  _.each(this.models, function(model){
    model.__digger__.class = _.without(model.__digger__.class, classname);
  })
  return this;
}

Container.prototype.hasClass = function(classname){
   return _.contains((this.classnames() || []), classname);
}

Container.prototype.hasAttr = function(name){
  return !_.isEmpty(this.attr(name));
}


/*

  string summary
  
*/
Container.prototype.summary = function(options){

  options = options || {};

  var parts = [];

  var title = (this.attr('name') || this.attr('title') || '')
  if(title.length>0 && options.title!==false){
    parts.push(title + ': ');
  }

  parts.push(this.tag());

  var id = this.id() || '';
  if(id.length>0){
    parts.push('#' + id);
  }

  var classnames = this.classnames() || [];
  if(classnames.length>0){
    parts = parts.concat(_.map(classnames, function(classname){
      return '.' + classname
    }))
  }



  return parts.join('');
}

Container.prototype.toString = function(){
  return this.summary();
}

/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  FINDER
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */



/*

  sync search through local container data matching selectors
  
*/
Container.prototype.find = Finder.find;

/*

  sync search through local container data matching selectors
  
*/
Container.prototype.sort = Finder.sort;

/*

  run the filter function over each container individually
  and return a container with the ones that passed (by return true classic filter style)
  
*/
Container.prototype.filter = Finder.filter;

Container.prototype.match = Finder.match;


/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  CONTRACT ACTIONS
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

Container.prototype.bindcontract = Contracts.bindcontract;
Container.prototype.select = Contracts.select;
Container.prototype.append = Contracts.append;
Container.prototype.save = Contracts.save;
Container.prototype.remove = Contracts.remove;