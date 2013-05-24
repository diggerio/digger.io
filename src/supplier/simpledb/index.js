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
var NestedSetSupplier = require('../nestedset');
var Container = require('../../container');
var async = require('async');
var fs = require('fs');

module.exports = factory;

function factory(options){
  var supplier = NestedSetSupplier(options);

  if(!supplier.settings.attr('filepath')){
    throw new Error('filepath requiired for simpledb');
  }

  var filepath = supplier.settings.attr('filepath');
  var autocreate = supplier.settings.attr('autocreate');

  var rootcontainer = Container();

  function buildsupplier(){


    /*
    
      SELECT
      
    */
    supplier.select(function(select_query, promise){

      var context = rootcontainer;

      if(select_query.context && select_query.context.length>0){

        var models = _.filter(_.map(select_query.context, function(skeleton){
          return rootcontainer.find('=' + skeleton.diggerid).get(0);
        }), function(model){
          return model!==null;
        })

        context = rootcontainer.spawn(models);
        
      }
      else{
        context = rootcontainer;
      }

      var results = context.find({string:'', phases:[[select_query.selector]]});

      promise.resolve(results.toJSON());
    })

    /*
    
      APPEND
      
    */
    supplier.append(function(append_query, promise){
      console.log('-------------------------------------------');
      console.dir(append_query);
    })
  }

  /*
  
    PREPARE FILE
    
  */
  supplier.prepare(function(finished){
    var filedata = null;
    async.series([
      function(next){

        fs.readFile(filepath, 'utf8', function(error, content){

          if((error || !content) && !autocreate){
            supplier = function(req, res){
              res.error('file: ' + filepath + ' does not exist');
            }
          }
          else{
            filedata = content;
            next();
          }
        })
      },

      function(next){
        rootcontainer = Container(filedata);
        buildsupplier();
        next();
      }
    ], finished)
  })

  return supplier;
}