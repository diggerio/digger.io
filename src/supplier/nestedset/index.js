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
var RationalEncoder = require('rationalnestedset');

module.exports = factory;

function factory(options){

  var supplier = BaseSupplier(options);

  supplier.prepare_select_query = function(select_query){
    select_query.query = query_factory(select_query.selector, select_query.context);
    return this;
  }

  supplier.encode = RationalEncoder;
  supplier.generate_tree_query = generate_tree_query;
  supplier.assign_tree_encodings = assign_tree_encodings;

  return supplier;
}

function assign_tree_encodings(diggerdata){

  var encodings = RationalEncoder(diggerdata.diggerpath);
    
  //diggerdata.left = tools.getEncodingValue(encodings.left.numerator, encodings.left.denominator);
  //diggerdata.right = tools.getEncodingValue(encodings.right.numerator, encodings.right.denominator);

  diggerdata.left = encodings.left.encoding;
  diggerdata.right = encodings.right.encoding;
}


function query_factory(selector, contextmodels){
  var query = parse_selector(selector, contextmodels);
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
        field:'_digger.diggerparentid',
        operator:'=',
        value:contextmodel.diggerid
      })
    }
    // parent mode
    else if(splitter=='<'){
      or_array.push({
        field:'_digger.diggerid',
        operator:'=',
        value:contextmodel.diggerparentid
      })
    }
    // ancestor mode
    else if(splitter=='<<'){
      or_array.push([{
        field:'_digger.left',
        operator:'<',
        value:contextmodel.left
      },{
        field:'_digger.right',
        operator:'>',
        value:contextmodel.right
      }])
    }
    // descendent mode
    else{
      or_array.push([{
        field:'_digger.left',
        operator:'>',
        value:contextmodel.left
      },{
        field:'_digger.right',
        operator:'<',
        value:contextmodel.right
      }])
    }
  })

  return or_array;
}

function parse_selector(selector, contextmodels){

  var main_query = [];

  // this is for a thing like:
  //    > folder.red product
  // i.e. folders on the root
  if(selector.diggerid){
    main_query.push({
      field:'_digger.diggerid',
      operator:'=',
      value:selector.diggerid
    })
  }
  /*
  
    we are actually finding the context
    
  */
  else if(selector.tag==='self'){

    var ors = _.map(contextmodels, function(model){
      return {
        field:'_digger.diggerid',
        operator:'=',
        value:model.diggerid
      }
    })

    if(ors.length<=0){

    }
    else if(ors.length==1){
      main_query.push(ors[0]);
    }
    else{
      main_query.push({
        '$or':ors
      })
    }
    

  }
  else{
    if(selector.splitter=='>' && (!contextmodels || contextmodels.length<=0)){
      main_query.push({
        field:'_digger.diggerparentid',
        operator:'=',
        value:null
      })
    }

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