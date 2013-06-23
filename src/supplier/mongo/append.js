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


module.exports = function append(){

  return function(append_query, promise){
    var self = this;

    // assigns the links needed to add one container to another - recursivly down the tree
    

    var parent_data = append_query.target;
    var results = [];

    /*
    
      run through each of the appending containers and insert them into the DB
      
    */
    async.forEachSeries(append_query.body || [], function(data, next_data){

      self.cascade_insert(append_query.req, data, parent_data, function(error){

        if(!error){
          results = results.concat(data);  
        }

        next_data(error);

      })

    }, function(error){


      if(error){
        promise.reject(error);
      }
      else{
        promise.resolve(results);
      }
      
    })
  }
}