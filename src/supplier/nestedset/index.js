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

   this is an abstract supplier that turns the given selector into a MONGO style query based on the
   nested set left & right necodings

   this can be extended to use any nested set encoding

   
  
*/
var _ = require('lodash');
var BaseSupplier = require('../proto').factory;
var RationalEncoder = require('./rationalencoder');

module.exports = factory;

function factory(options){
  var supplier = BaseSupplier(options);

  supplier.prepare_select_query = function(select_query){
    select_query.query = query_factory(select_query.selector, select_query.context);
    return this;
  }

  supplier.generate_tree_query = generate_tree_query;
  supplier.encode = RationalEncoder;

  return supplier;
}

function query_factory(selector, contextmodels){
  var query = parse_selector(selector);
  var skeleton = [];

  if(contextmodels && contextmodels.length>0){
    skeleton = generate_tree_query(selector.splitter, contextmodels);
  }

  return {
    search:query,
    skeleton:skeleton
  }
}

function generate_tree_query(splitter, contextmodels){

  var or_array = [];

  _.each(contextmodels, function(contextmodel){

    // child mode
    if(splitter=='>'){
      or_array.push({
        field:'_digger.parentid',
        operator:'=',
        value:contextmodel.diggerid
      })
    }
    // parent mode
    else if(splitter=='<'){
      or_array.push({
        field:'_digger.diggerid',
        operator:'=',
        value:contextmodel.parentid
      })
    }
    // ancestor mode
    else if(splitter=='<<'){
      or_array.push({
        field:'_digger.left',
        operator:'<',
        value:contextmodel.left
      })
      or_array.push({
        field:'_digger.right',
        operator:'>',
        value:contextmodel.right
      })
    }
    // descendent mode
    else{
      or_array.push({
        field:'_digger.left',
        operator:'>',
        value:contextmodel.left
      })
      or_array.push({
        field:'_digger.right',
        operator:'<',
        value:contextmodel.right
      })
    }
  })

  return or_array;
}

function parse_selector(selector){

  var main_query = [];

  // this is for a thing like:
  //    > folder.red product
  // i.e. folders on the root
  if(selector.splitter=='>' && skeleton_array.length<=0){
    main_query.push({
      field:'_digger.parentid',
      operator:'=',
      value:null
    })
  }
  else if(selector.diggerid){
    main_query.push({
      field:'_digger.diggerid',
      operator:'=',
      value:selector.diggerid
    })
  }
  else{
    if(selector.tag==='*'){
      main_query.push({
        field:'_digger',
        operator:'exists'
      })
    }
    else {
      if(selector.tag){
        main_query.push({
          field:'_digger.tag',
          operator:'=',
          value:selector.tag
        })
      }

      if(selector.id){
        main_query.push({
          field:'_digger.id',
          operator:'=',
          value:selector.id
        })
      }

      if(_.keys(selector.class).length>0){

        _.each(_.keys(selector.class), function(classname){

          main_query.push({
            field:'_digger.class',
            operator:'=',
            value:classname
          })
          
        })
      }

      if(selector.attr){
        _.each(selector.attr, function(attr){
          
          var operator = attr.operator;
          var value = attr.value;

          if(_.isEmpty(attr.operator)){
            attr.operator = 'exists';
          }
          
          main_query.push(attr);
        })
      }
    }
  }

  return main_query;
}




/*




    // are we looking within other results?
    if(skeleton_array.length>0){
     
      // the query that applies nested set on the links inside the _meta
      var tree_query = getTreeQuery(selector.splitter, skeleton_array);

      if(tree_query){
        query_array.push(tree_query);  
      }
    }

    main_query = query_array.length<=1 ? query_array[0] : {
      '$and':query_array
    }
  }

  var queryoptions = {

  }

  return {
    query:main_query,
    //fields:fields,
    fields:includedata ? null : {
      "meta":true
    },
    options:queryoptions,
    tree:includechildren
  }

}

var select = module.exports = function(mongoclient){

  return function(req, res, next){

    var selector = req.getHeader('x-json-selector');

    ensure_skeleton(mongoclient, req, res, function(){

      var skeleton = req.getHeader('x-json-skeleton');

      var query = getQuery({
        skeleton:skeleton,
        selector:selector
      })

      var self = this;

      mongoclient.find(query, function(error, results){

        if(error){
          res.error(error);
          return;
        }

        // here are the final results
        // check for a tree query to load all descendents also
        if(query.tree && results.length>0){

          // first lets map the results we have by id
          var results_map = {};

          _.each(results, function(result){
            results_map[result.meta.quarryid] = result;
          })

          // now build a descendent query based on the results
          var descendent_tree_query = getTreeQuery('', _.map(results, extractskeleton));

          descendent_query = {
            query:descendent_tree_query,
            fields:query.fields
          }
          
          // trigger the find of the descendents
          mongoclient.find(descendent_query, function(error, descendent_results){

            // loop each result and it's links to see if we have a parent in the original results
            // or in these results
            _.each(descendent_results, function(descendent_result){
              results_map[descendent_result.meta.quarryid] = descendent_result;
            })

            _.each(descendent_results, function(descendent_result){
              var parent = results_map[descendent_result.meta.parent_id];

              if(parent){
                parent.children || (parent.children = []);
                parent.children.push(descendent_result);
              }
            })

            res.containers(results).send();
          })
        }
        else{
          res.containers(results).send();
        }      
      })
    })
  }
}*/