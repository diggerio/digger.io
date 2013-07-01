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

var _ = require('lodash'),
    async = require('async');

module.exports = function select(){

  return function(select_query, promise){

    /*
    
      this is the Nested Set supplier
      
    */
    var self = this;

    var mongoquery = self.generate_mongo_query(select_query);

    if(!mongoquery){
      promise.resolve([]);
      return;
    }

    console.log('-------------------------------------------');
    console.log(JSON.stringify(mongoquery, null, 4));

    self._select(select_query.req, mongoquery, function(error, results){
      if(error){
        promise.reject(error);
        return;
      }

      var treequery = mongoquery.get_tree_query(results);

      if(!treequery){
        promise.resolve(results);
        return;
      }
      else{
        self._select(select_query.req, treequery, function(error, descendent_results){
          if(error){
            promise.reject(error);
            return;
          }

          var finalresults = mongoquery.combine_tree_results(results, descendent_results);

          promise.resolve(finalresults);
        })
      }  
    })
  }
}