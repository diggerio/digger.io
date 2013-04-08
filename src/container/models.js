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
var XML = require('./xml');

/*

  model factory

  turns input data into a container data array
  
*/


/*

  takes data in as string (XML, JSON) or array of objects or single object

  returns container data
  
*/
function extractdata(data, attr){

  if(_.isString(data)){
    // we assume XML
    if(data.match(/^\s*\</)){
      data = XML.parse(data);
    }
    // or JSON string
    else if(data.match(/^\s*[\[\{]/)){
      data = JSON.parse(data);
    }
    // we could do YAML here
    else{
      data = [{
        meta:{
          tag:data
        },
        attr:attr || {}
      }]
    }
  }
  else if(!_.isArray(data)){
    if(!data){
      data = {};
    }
    data = [data];
  }

  return data;
}

/*

  extract the raw data array and then map it for defaults
  
*/
module.exports = function modelfactory(data, attr){
  var models = extractdata(data, attr);

  /*
  
    prepare the data
    
  */
  models = _.map(data || [], function(model){

    model._meta = model._meta || {};
    model._meta.class = model._meta.class || [];
    model._children = model._children || [];
    model.meta.diggerid = model._meta.diggerid || utils.diggerid();

    return model;
  })

  return models;
}