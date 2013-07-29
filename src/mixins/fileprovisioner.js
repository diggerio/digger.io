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
var async = require('async');
var fs = require('fs');
var path = require('path');
var wrench = require('wrench');

module.exports = factory;

/*

  a mixin for any supplier that operates from within a folder

  there are 3 modes:

    database = '/home/files' -> /baseurl/user/resource -> /home/files/user/resource.json
    folder = '/home/files' -> /baseurl/file -> /home/files/file.json
    file = '/home/files/file.json' -> /baseurl -> /home/files/file.json
  
*/

function factory(supplier, provisionfn){
  
  /*
  
    in provider mode we want a directory

    we create one file per x-digger-resource header (i.e. path)

    /db/apples -> /dir/apples.json
    
  */
  var databasepath = supplier.settings.attr('database');
  var folderpath = supplier.settings.attr('folder');
  var filepath = supplier.settings.attr('file');

  if(!databasepath && !folderpath && !filepath){
    throw new Error('you must provide a database, folder for file path');
  }

  if(databasepath){
    if(!fs.existsSync(databasepath)){
      wrench.mkdirSyncRecursive(databasepath);
    }
  }
  else if(folderpath){
    if(!fs.existsSync(folderpath)){
      wrench.mkdirSyncRecursive(folderpath);
    } 
  }

  function get_provision_routes(){
    var routes = [];

    if(databasepath){
      routes = ['folder', 'file'];
    }
    else if(folderpath){
      routes = ['file'];
    }

    return routes;
  }

  function get_folderpath(resource){
    return path.dirname(get_filepath(resource));
  }

  function get_filepath(resource){

    if(databasepath){
      return databasepath + '/' + resource.folder + '/' + resource.file + '.json';
    }
    else if(folderpath){
      return folderpath + '/' + resource.file + '.json';
    }
    else{
      return filepath;
    }
  }

  supplier.get_filepath = get_filepath;

  var routes = get_provision_routes();
  routes.push(function(routes, callback){
    if(!provisionfn){
      callback('no provision method given');
      return;
    }

    var filepath = get_filepath(routes);
    provisionfn(filepath, callback);
  });

  supplier.provision.apply(supplier, routes);

  return supplier;
}