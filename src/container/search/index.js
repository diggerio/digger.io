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
var find = require('./find');
var search = require('./search');
var inspectselect = require('../selector');

var finder = find(search.searcher);

var sortfns = {
  title:function(a, b){
    if ( a.title().toLowerCase() < b.title().toLowerCase() )
      return -1;
    if ( a.title().toLowerCase() > b.title().toLowerCase() )
      return 1;
    return 0;
  }
}

module.exports = {
  find:function(){
    var selectors = _.map(_.toArray(arguments), inspectselect);
    return finder(selectors, this);
  },

  sort:function(fn){
    if(!fn){
      fn = sortfns.title;
    }

    this.each(function(container){
      var newchildren = container.children().containers().sort(fn);
      var model = container.get(0);
      model.children = _.map(newchildren, function(container){
        return container.get(0);
      })
    })

    return this;
  },

  filter:function(filterfn){

    /*
    
      turn anything other than a function into the filter function

      the compiler looks after turning strings into selector objects
      
    */
    if(!_.isFunction(filterfn)){
      filterfn = search.compiler(filterfn);
    }

    var matching_container_array = _.filter(this.containers(), filterfn);

    return this.spawn(_.map(matching_container_array, function(container){
      return container.get(0);
    }))
  },

  match:function(selector){

    if(this.count()<=0){
      return false;
    }

    var results = this.filter(selector);

    return results.count()>0;
  }
}