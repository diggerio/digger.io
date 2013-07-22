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



/*

   Mongo is an abstract supplier (inherits nestedset) - the actual mongodb lives as a seperate module (so we remain pureJS)

   The nedb supplier (pureJS) uses the same query style hence this being part of the digger core
   
  
*/
var _ = require('lodash');
var NestedSetSupplier = require('../nestedset');
var async = require('async');

var Select = require('./select');
var Append = require('./append');
var Save = require('./save');
var Remove = require('./remove');

var utils = require('digger-utils');

module.exports = factory;

/*

  we use these functions to map what comes out of the nested set supplier in digger

  each on does something like this:

  {
    field:'something',
    operator:'!=',
    value:10
  }

  into this:

  {
    something:{
      '$ne':10
    }
  }
  
*/

var operator_functions = {
  "exists":function(query){
    var ret = {};
    ret[query.field] = {
      '$exists':true
    }
    return ret;
  },
  "=":function(query){
    var ret = {};
    ret[query.field] = query.value;
    return ret;
  },
  "!=":function(query){
    var ret = {};
    ret[query.field] = {
      '$ne':query.value
    }
    return ret;
  },
  ">":function(query){
    var ret = {};
    ret[query.field] = {
      '$gt':query.field==='_digger.left' ? query.value : parseFloat(query.value)
    }
    return ret;
  },
  ">=":function(query){
    var ret = {};
    ret[query.field] = {
      '$gte':query.field==='_digger.left' ? query.value : parseFloat(query.value)
    }
    return ret;
  },
  "<":function(query){
    var ret = {};
    ret[query.field] = {
      '$lt':query.field==='_digger.right' ? query.value : parseFloat(query.value)
    }
    return ret;
  },
  "<=":function(query){
    var ret = {};
    ret[query.field] = {
      '$lte':query.field==='_digger.right' ? query.value : parseFloat(query.value)
    }
    return ret;
  },
  "^=":function(query){
    var ret = {};
    ret[query.field] = new RegExp('^' + utils.escapeRegexp(query.value), 'i');
    return ret;
  },
  "$=":function(query){
    var ret = {};
    ret[query.field] = new RegExp(utils.escapeRegexp(query.value) + '$', 'i');
    return ret;
  },
  "~=":function(query){
    var ret = {};
    ret[query.field] = new RegExp('\\W' + utils.escapeRegexp(query.value) + '\\W', 'i');      
    return ret;
  },
  "|=":function(query){
    var ret = {};
    ret[query.field] = new RegExp('^' + utils.escapeRegexp(query.value) + '-', 'i');
    return ret;
  },
  "*=":function(query){
    var ret = {};
    ret[query.field] = new RegExp(utils.escapeRegexp(query.value), 'i');
    return ret;
  }
}

function filterterm(term){
  return operator_functions[term.operator] ? true : false;
}

function processterm(term){
  if(_.isArray(term)){
    return {
      '$and':_.map(term, processterm)
    }
  }
  else{
    return operator_functions[term.operator].apply(null, [term]);  
  }
  
}

function extractskeleton(model){
  return model._digger;
}

function factory(options){

  var supplier = NestedSetSupplier(options);

  /*
  
    SELECT
    
  */
  supplier.generate_mongo_query = function(select_query){
    var self = this;

    var search_terms = _.map(_.filter(select_query.query.search, filterterm), processterm);
    var skeleton_terms = _.map(select_query.query.skeleton, processterm);
    var selector = select_query.selector;
    var modifier = selector.modifier;

    var includedata = selector.modifier.laststep;
    var includechildren = includedata && selector.modifier.tree;

    var iscountermode = false;

    if(search_terms.length<=0){
      return null;
    }

    if(skeleton_terms.length>0 && selector.tag!=='self'){
      search_terms.push({
        '$or':skeleton_terms
      })
    }

    var query = search_terms.length>1 ? {
      '$and':search_terms
    } : search_terms[0]

    var options = {};

    if(modifier.first){
      options.limit = 1;
    }
    else if(modifier.limit){
      var val = '' + modifier.limit;
      if(val.match(/,/)){
        var parts = _.map(val.split(','), function(st){
          return st.replace(/\D/g, '');
        })
        options.skip = parseInt(parts[0], null);
        options.limit = parseInt(parts[1], null);
      }
      else{
        options.limit = modifier.limit;
      }
    }

    if(modifier.count){
      iscountermode = true;
    }

    var usesort = null;

    if(modifier.sort){
      var directions = {
        asc:1,
        desc:-1
      }

      var direction = 1;
      var field = modifier.sort;

      if(_.isBoolean(field)){
        field = null;
      }

      field = (field || '').replace(/ (asc|desc)/i, function(match, dir){
        direction = directions[dir] ? directions[dir] : dir;
        return '';
      })

      field = (field || '').replace(/-/i, function(match, dir){
        direction = -1;
        return '';
      })

      if(!field.match(/\w/)){
        field = 'name';
      }

      var sort = {};
      sort[field] = direction;
      options.sort = sort;
      usesort = sort;
    }

    var fields = includedata ? null : {
      "_digger":true
    }

    var results_map = {};

    function get_tree_query(results){

      /*
      
        only if :tree and there is no :count mode
        
      */
      if(!iscountermode && includechildren && results.length>0){
        // first lets map the results we have by id
        
        _.each(results, function(result){
          results_map[result._digger.diggerid] = result;
        })

        // now build a descendent query based on the results
        var descendent_tree_query = self.generate_tree_query('', _.map(results, extractskeleton));
        descendent_tree_query = _.map(descendent_tree_query, processterm);

        var descendent_query = descendent_tree_query.length>1 ? 
          {'$or':descendent_tree_query} :
          {'$and':descendent_tree_query}

        return {
          query:descendent_query,
          fields:null,
          options:{
            sort:usesort
          }
        }
      }
      else{
        return null;
      }
    }

    function combine_tree_results(results, descendent_results){
      // loop each result and it's links to see if we have a parent in the original results
      // or in these results
      _.each(descendent_results, function(descendent_result){
        results_map[descendent_result._digger.diggerid] = descendent_result;
      })

      _.each(descendent_results, function(descendent_result){
        var parent = results_map[descendent_result._digger.diggerparentid];

        if(parent){
          parent._children = parent._children || [];
          parent._children.push(descendent_result);
        }
      })

      return results;
    }

    var ret = {
      query:query,
      fields:fields,
      options:options,
      countermode:iscountermode,
      get_tree_query:get_tree_query,
      combine_tree_results:combine_tree_results
    }

    return ret;
  
  }

  /*
  
    APPEND
    
  */
  supplier.cascade_insert = function(req, data, parent_data, finishedcallback){

    var self = this;
    data._id = data._digger.diggerid;

    /*
    
      this means we are appending to the top of the database
      
    */
    if(!parent_data){

      self._get_next_root_position(req, function(error, next_root_position){

        data._digger.diggerpath = [next_root_position];
        data._digger.rootposition = next_root_position;

        delete(data._data);
        self.assign_tree_encodings(data._digger);

        self._insert(req, data, function(error){

          async.forEach(data._children || [], function(child_data, next_child){
            
            self.cascade_insert(req, child_data, data, next_child);
            
          }, function(error){

            finishedcallback(error, data);
          })

        })


      })
    }
    else{

      parent_data._digger.next_child_position = parent_data._digger.next_child_position || 0;
      parent_data._digger.next_child_position++;
      
      data._digger.diggerpath = parent_data._digger.diggerpath.concat([parent_data._digger.next_child_position]);
      data._digger.diggerparentid = parent_data._digger.diggerid;
      delete(data._data);
      
      self.assign_tree_encodings(data._digger);

      self._update(req, parent_data, function(){

        self._insert(req, data, function(){

          async.forEach(data._children || [], function(child_data, next_child){
            self.cascade_insert(req, child_data, data, next_child);
          }, function(error){

            finishedcallback(error, data);
          })

        })
      })
    }
  }

  /*
  
    I like the name of this function - tis gangster

    mongo do not like fields with dollars
    
  */
  supplier.strip_dollars = function(obj){
    var self = this;
    _.each(obj, function(val, field){
      if(('' + field).charAt(0)==='$'){
        delete(obj[field]);
      }
      else{
        if(_.isObject(val)){
          self.strip_dollars(val);
        }
      }
    })  
  }


  supplier._select = function(req, mongoquery, callback){
    callback('_select: this is an abstract supplier method - it must be overriden');
  }

  supplier._insert = function(req, data, callback){
    callback('_insert: this is an abstract supplier method - it must be overriden'); 
  }

  supplier._update = function(req, data, callback){
    callback('_update: this is an abstract supplier method - it must be overriden'); 
  }

  supplier._remove = function(req, data, callback){
    callback('_remove: this is an abstract supplier method - it must be overriden'); 
  }

  supplier._get_next_root_position = function(req, callback){
    callback('_get_next_root_position: this is an abstract supplier method - it must be overriden');
  }

  supplier.select(Select());
  supplier.append(Append());
  supplier.save(Save());
  supplier.remove(Remove());

  return supplier;
}