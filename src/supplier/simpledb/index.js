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
var wrench = require('wrench');

module.exports = factory;

function factory(options){
  
  var supplier = BaseSupplier(options);
  //  var filepath = supplier.settings.attr('filepath');
  var autocreate = supplier.settings.attr('autocreate');

  var get_filepath = function(){}
  /*
  
    in provider mode we want a directory

    we create one file per x-digger-resource header (i.e. path)

    /db/apples -> /dir/apples.json
    
  */
  if(supplier.settings.attr('provider')){
    if(!supplier.settings.attr('folder')){
      throw new Error('folder requiired for simpledb provider');
    }

    if(!fs.existsSync(supplier.settings.attr('folder'))){
      if(!autocreate){
        throw new Error('The folder: ' + supplier.settings.attr('folder') + ' does not exist');  
      }
      else{
        wrench.mkdirSyncRecursive(dir, 0777);
      }
    }

    get_filepath = function(req){
      return supplier.settings.attr('folder') + '/' + req.getHeader('x-digger-resource') + '.json';
    }
  }
  /*
  
    in this mode we are speaking to just one file

    we expect a filepath to say where it is
    
  */
  else{
    if(!supplier.settings.attr('filepath')){
      throw new Error('filepath requiired for simpledb');
    }

    if(!fs.existsSync(supplier.settings.attr('filepath')) && !autocreate){
      throw new Error('The folder: ' + supplier.settings.attr('folder') + ' does not exist');
    }

    get_filepath = function(req){
      return supplier.settings.attr('filepath');      
    }
  }


  /*
  
    the in-memory container that holds our data

    this will be some slow-ass shiiiiiiiit but it's bootstrap (again)
    
  */
  
  var containers = {};


  

  /*
  
    keep a count of how many requests to save each file

    if the count is above zero when we get back then do again

    if the count is zero when we trigger then we are the one that does it

  */
  var savecallbacks = {};

  function savefile(container, filepath, done){

    if(!savecallbacks[filepath]){
      savecallbacks[filepath] = [];
    }

    savecallbacks[filepath].push(done);

    /*
    
      this means we are already saving
      
    */
    if(savecallbacks[filepath].length>1){
      return;
    }

    fs.writeFile(filepath, JSON.stringify(container.toJSON(), null, 4), 'utf8', function(error){

      _.each(savecallbacks[filepath], function(fn){
        fn(error);
      })

      /*
      
        this means others have arrived in the meantime
        
      */
      if(savecallbacks[filepath].length>1){
        savefile(container, filepath, function(){

        })
      }

      savecallbacks[filepath] = [];
    })
  }

  /*
  
    PREPARE FILE
    
  */
  function load_file(req, finished){

    var path = get_filepath(req);

    var container = containers[path];

    if(container){
      finished(null, container);
      return;
    }

    var filedata = null;
    async.series([
      function(next){

        fs.readFile(path, 'utf8', function(error, content){

          if((error || !content) && !autocreate){
            finished(error);
            return;
          }
          else{
            filedata = content;
            next();
          }
        })
      },

      function(next){
        container = Container(filedata);

        container.ensure_meta();

        container.savefile = function(callback){
          savefile(container, path, callback);
        }

        container.savefile(function(){
          containers[path] = container;
          finished(null, container);
        })
        
      }
    ])
  }

  /*
  

    ----------------------------------------------
    SELECT
    ----------------------------------------------
    
  */
  supplier.select(function(select_query, promise){
    load_file(select_query.req, function(error, rootcontainer){

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

    load_file(append_query.req, function(error, rootcontainer){
      
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
      }
      else{

        var next_child_position = append_to.digger('next_child_position') || 0;

        append_what.inject_paths(([]).concat(append_to.diggerpath(), [next_child_position]))
        next_child_position++;

        /*
        
          save the append count for next time
          
        */
        append_to.digger('next_child_position', next_child_position);
      }

      append_what.diggerparentid(append_to.diggerid());
      append_to.append(append_what);

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

    load_file(save_query.req, function(error, rootcontainer){

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

    load_file(remove_query.req, function(error, rootcontainer){

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