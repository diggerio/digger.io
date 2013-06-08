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
var BaseSupplier = require('../proto').factory;
var Container = require('../../container/proto').factory;
var async = require('async');
var fs = require('fs');
var path = require('path');
var wrench = require('wrench');

module.exports = factory;

function factory(options){
  
  var supplier = BaseSupplier(options);

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

  /*
  
    the in-memory container that holds our data

    this will be some slow-ass shiiiiiiiit but it's bootstrap (again)
    
  */
  
  var containers = {};

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


  /*
  
    this is called once per file
    
  */
  function provision_container(filepath, loaded){
    if(containers[filepath]){
      loaded(null, containers[filepath]);
      return;
    }

    var dir = path.dirname(filepath);

    function ensurefolder(done){
      fs.exists(dir, function(exists){
        if(!exists){
          fs.mkdir(dir, done);    
        }
        else{
          done();
        }
      })
    }

    function ensurefile(done){
      fs.exists(filepath, function(exists){
        if(!exists){
          fs.writeFile(filepath, JSON.stringify([]), 'utf8', done);
        }
        else{
          done();
        }
      })
    }

    function loadfile(done){
      fs.readFile(filepath, 'utf8', done);
    }

    function savefile(done){
      fs.writeFile(filepath, JSON.stringify(this.toJSON(), null, 4), 'utf8', done);
    }

    async.series([
      ensurefolder,

      ensurefile,

      function(next){
        loadfile(function(error, data){
          var container = Container(data);

          container.ensure_meta();

          container.savefile = savefile;

          container.savefile(function(){
            containers[filepath] = container;
            next()
          })
        })
      }

    ], loaded)

  }

  
  /*
  
    this is called each time to get the container into the methods
    
  */
  function load_container(req, loaded){
    var filepath = get_filepath(req.getHeader('x-json-resource'));

    loaded(null, containers[filepath]);
  }

  /*
  

    ----------------------------------------------
    PROVISION
    ----------------------------------------------
    
  */
  var provisionfn = function(routes, callback){
    var filepath = get_filepath(routes);

    provision_container(filepath, callback);
  }

  var routes = get_provision_routes();
  routes.push(provisionfn);

  supplier.provision.apply(supplier, routes);

  /*
  

    ----------------------------------------------
    SELECT
    ----------------------------------------------
    
  */
  supplier.select(function(select_query, promise){

    load_container(select_query.req, function(error, rootcontainer){

      if(!rootcontainer){
        promise.reject('file not found');
        return;
      }
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

      //results
      promise.resolve(results.toJSON());
    })
  })

  /*
  
    ----------------------------------------------
    APPEND
    ----------------------------------------------
    
  */
  supplier.append(function(append_query, promise){

    load_container(append_query.req, function(error, rootcontainer){
      
      if(!rootcontainer){
        promise.reject('file not found');
        return;
      }

      var append_to = append_query.target ? rootcontainer.spawn(append_query.target) : rootcontainer;
      var append_what = rootcontainer.spawn(append_query.body);

      /*
      
        add one to the top level path number
        
      */
      if(!append_query.target){
       
        /*
        
          it's a root append
          
        */
        var pos = 0;
        rootcontainer.each(function(rootcontainer){
          if(rootcontainer.digger('rootposition')>pos){
            pos = rootcontainer.digger('rootposition');
          }
        })
        append_what.inject_paths([pos]);
        rootcontainer.add(append_what);
      }
      else{

        var next_child_position = append_to.digger('next_child_position') || 0;

        append_what.inject_paths(([]).concat(append_to.diggerpath(), [next_child_position]))
        next_child_position++;

        /*
        
          save the append count for next time
          
        */
        append_to.digger('next_child_position', next_child_position);
        append_what.diggerparentid(append_to.diggerid());
        append_to.append(append_what);  
      }

      /*
      
        we save the file and wait for confirmation before returning
        
      */
      rootcontainer.savefile(function(error){
        if(error){
          promise.reject(error);
        }
        else{
          promise.resolve(append_what.toJSON());  
        }
      })
    })

  })

  /*
  
    ----------------------------------------------
    SAVE
    ----------------------------------------------
    
  */

  supplier.save(function(save_query, promise){

    load_container(save_query.req, function(error, rootcontainer){

      if(!rootcontainer){
        promise.reject('file not found');
        return;
      }

      var data = save_query.body;
      /*
      
        update the in-memory model
        
      */
      _.each(data, function(val, key){
        save_query.target[key] = data[key];
      })

      rootcontainer.savefile(function(error){
        if(error){
          promise.reject(error);
        }
        else{
          promise.resolve(data);  
        }
      })

    })

  })

  /*
  
    ----------------------------------------------
    REMOVE
    ----------------------------------------------
    
  */

  supplier.remove(function(remove_query, promise){

    load_container(remove_query.req, function(error, rootcontainer){

      if(!rootcontainer){
        promise.reject('file not found');
        return;
      }
      
      var target = rootcontainer.spawn(remove_query.target);
      var parent = rootcontainer;

      if(target.diggerparentid()){
        parent = rootcontainer.find('=' + target.diggerparentid());
      }

      parent.get(0)._children = _.filter(parent.get(0)._children, function(model){
        return model._digger.diggerid!=target.diggerid();
      })

      rootcontainer.savefile(function(error){
        if(error){
          promise.reject(error);
        }
        else{
          promise.resolve();  
        }
      })

    })

  })    

  return supplier;
}