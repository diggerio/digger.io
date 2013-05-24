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
var utils = require('../../utils');
var async = require('async');

/*
  Quarry.io - Container Search
  ----------------------------

  Takes a search_from container and an array of strings

  It reverses the strings and does a simulated pipe


 */

module.exports.searcher = search;
module.exports.compiler = compile;

/*
  These functions are used to run attribute selectors over in-memory containers
 */
var attr_compare_functions = {
  "=":function(check, target){
    return !_.isUndefined(check) && check==target;
  },
  "!=":function(check, target){
    return !_.isUndefined(check) && check!=target;
  },
  ">":function(check, target){
    target = parseFloat(target);
    return !_.isUndefined(check) && !isNaN(target) ? check > target : false;
  },
  ">=":function(check, target){
    target = parseFloat(target);
    return !_.isUndefined(check) && !isNaN(target) ? check >= target : false;
  },
  "<":function(check, target){
    target = parseFloat(target);
    return !_.isUndefined(check) && !isNaN(target) ? check < target : false;
  },
  "<=":function(check, target){
    target = parseFloat(target);
    return !_.isUndefined(check) && !isNaN(target) ? check <= target : false;
  },
  "^=":function(check, target){
    return !_.isUndefined(check) && check.match(new RegExp('^' + utils.escapeRegexp(target), 'i')) !== null;
  },
  "$=":function(check, target){
    return !_.isUndefined(check) && check.match(new RegExp(utils.escapeRegexp(target) + '$', 'i')) !== null;
  },
  "~=":function(check, target){
    return !_.isUndefined(check) && check.match(new RegExp('\\W' + utils.escapeRegexp(target) + '\\W', 'i')) !== null;
  },
  "|=":function(check, target){
    return !_.isUndefined(check) && check.match(new RegExp('^' + utils.escapeRegexp(target) + '-', 'i')) !== null;
  },
  "*=":function(check, target){
    return !_.isUndefined(check) && check.match(new RegExp(utils.escapeRegexp(target), 'i')) !== null;
  }
}

/*

  Turn a selector object into a compiled function to have containers run through
  
 */

function compile(selector){

  // return a function that will return boolean for a container matching this selector
  return function(container){

    // we step through one at a time - as soon as something fails we do not match

    // if we have a wildcard then we pass
    if(selector.tag=='*'){
      return true;
    }

    // #id
    if(selector.id && container.id()!=selector.id){      
      return false;
    }

    // =diggerid
    if(selector.diggerid && container.diggerid()!=selector.diggerid){
      return false;
    }

    // tagname
    if(selector.tag && container.tag()!=selector.tag){
      return false;
    }
  
    // classnames
    if(selector.class){
      // make sure ALL of the classnames in the selector are in the container
      return _.all(_.keys(selector.class), function(classname){
        return container.hasClass(classname);
      })
    }
    
    if(selector.attr){

      var all_attributes_passed = _.all(selector.attr, function(attr_filter){

        var check_value = container.attr(attr_filter.field);
        var operator_function = attr_compare_functions[attr_filter.operator];

        // [size]
        if(!attr_filter.value){
          return check_value !== null;
        }
        // [size>100]
        else if(operator_function){
          return operator_function.apply(null, [check_value, attr_filter.value]);
        }
        // no operator function found
        else{
          return false;
        }
      })

      if(!all_attributes_passed){
        return false;
      }

    }

    return true;
      
  }
}

function search(selector, context){

  var selector_filter = compile(selector);

  var search_in = context;

  // we must now turn the search_from container into a flat array of the things to actually search

  // direct child mode
  if(selector.splitter=='>'){
    search_in = context.children();
  }
  // direct parent mode
  else if(selector.splitter=='<'){
    throw new Error('we do not support the parent splitter at the moment');
  }
  // all descendents mode
  else{
    search_in = context.descendents();
  }

  // now we loop each child container piping it via the selector filter
  return search_in.filter(selector_filter);
}