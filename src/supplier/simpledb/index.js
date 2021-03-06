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

  
  
*/
var _ = require('lodash');
var BaseSupplier = require('../proto').factory;
var FileProvisioner = require('../../mixins/fileprovisioner');

var Container = require('digger-container');
var async = require('async');
var fs = require('fs');
var path = require('path');
var wrench = require('wrench');

module.exports = factory;

function factory(options){
  
  var supplier = BaseSupplier(options);

  var containers = {};


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
  load_container = function(filepath, loaded){
    loaded(null, containers[filepath]);
  }

  FileProvisioner(supplier, provision_container);

  /*
  

    ----------------------------------------------
    SELECT
    ----------------------------------------------
    
  */
  supplier.select(function(select_query, promise){

    var filepath = supplier.get_filepath(select_query.req.getHeader('x-json-resource'))

    load_container(filepath, function(error, rootcontainer){

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

      var selector = select_query.selector;
      var results;


      if(selector.tag==='self'){
        results = context;
      }
      else{
        results = context.find({string:'', phases:[[selector]]});  
      }

      if(selector.modifier.sort){
        results.sort(selector.modifier.sort);
      }

      if(selector.modifier.count){
        results = context.spawn([{
          count:context.count()
        }])
      }

      /*
      
        stringify the results so we are not passing around references
        
      */
      process.nextTick(function(){
        //results
        promise.resolve(JSON.parse(JSON.stringify(results.toJSON())));
      })
      
    })
  })

  /*
  
    ----------------------------------------------
    APPEND
    ----------------------------------------------
    
  */
  supplier.append(function(append_query, promise){

    var filepath = supplier.get_filepath(append_query.req.getHeader('x-json-resource'))

    load_container(filepath, function(error, rootcontainer){
      
      if(!rootcontainer){
        promise.reject('file not found');
        return;
      }

//      var append_to = append_query.target ? rootcontainer.spawn(append_query.target) : rootcontainer;
      var append_to = append_query.target ? rootcontainer.find('=' + append_query.target._digger.diggerid) : rootcontainer;
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
        pos = pos+1;
        append_what.inject_paths([pos]);
        append_what.digger('rootposition', pos);
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

    var filepath = supplier.get_filepath(save_query.req.getHeader('x-json-resource'))

    load_container(filepath, function(error, rootcontainer){

      if(!rootcontainer){
        promise.reject('file not found');
        return;
      }

      var save_to = {};


      if(save_query.target){
        var target = rootcontainer.find('=' + save_query.target._digger.diggerid);
        save_to = target.get(0) || {};
      }

      var data = save_query.body;
      /*
      
        update the in-memory model
        
      */
      _.each(data, function(val, key){
        save_to[key] = data[key];
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

    var filepath = supplier.get_filepath(remove_query.req.getHeader('x-json-resource'))

    load_container(filepath, function(error, rootcontainer){

      if(!rootcontainer){
        promise.reject('file not found');
        return;
      }



      var target = rootcontainer.find('=' + remove_query.target._digger.diggerid);
      //var target = rootcontainer.spawn(remove_query.target);
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