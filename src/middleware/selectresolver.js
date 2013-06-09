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
var utils = require('../utils');
var Request = require('../network/request').factory;
var Response = require('../network/response').factory;
var EventEmitter = require('events').EventEmitter;
//var debug = require('debug')('selectresolver');

//var EventResolver = require('./resolveevents');

/*
  Digger.io - Selector Resolver
  -----------------------------

  Middleware that can resolve a GET request and chunk down the selector
  to get the final results




 */

module.exports = factory;

function State(arr){
  this.arr = [].concat(arr);
  this.count = arr.length;
  this.index = 0;
  this.finished = false;
}

State.prototype.next = function(){
  this.index++;
  this.arr.shift();
  if(this.index>=this.count){
    this.finished = true;
  }
}

function extractskeleton(data){

  if(data._digger){
    return data._digger || {};  
  }
  else{
    return {};
  }
  
}

function factory(handle){

  if(!handle){
    throw new Error('Select resolver requires a handle method');
  }

  function selectresolver(req, res, next){

    var skeleton_array = req.body || [];


    skeleton_array = _.filter(skeleton_array, function(obj){
      return obj.tag!='supplychain';
    })


    /*
    
      here we scan the context for any branch skeletons - this will emit a branch event

      the request should have already had the x-json-branch-selectors filled in
      
    */
    
    var allbranches = [];

    function process_skeleton(skeletonarr, branchselectors){
      _.each(skeletonarr, function(skeleton){

        if(skeleton.diggerbranch){
          var brancharr = skeleton.diggerbranch;
          if(!_.isArray(brancharr)){
            brancharr = [brancharr];
          }
          _.each(brancharr, function(location){

            var branch = {
              method:'post',
              url:location + '/resolve',
              headers:{
                'x-branch-id':utils.diggerid(),
                'x-branch-contract-id':req.getHeader('x-contract-id'),
                'x-branch-from':skeleton.diggerwarehouse + '/' + skeleton.diggerid,
                'x-branch-to':location,
                'x-json-selector-strings':branchselectors
              }
            }

            allbranches.push(branch);
            selectresolver.emit('branch', branch);
          })
        }
      })
    }
    
    var strings = req.getHeader('x-json-selector-strings');

    var final_state = new State(strings);
    var final_results = [];
    var final_branches = [];

    //var select_resolver = EventResolver('select', req, res);

    /*
    
      loop over each of the seperate selector strings

      container("selectorA", "selectorB")

      B -> A
      
    */

    //debug('Selector: %s strings', strings.length);
    
    async.forEachSeries(strings, function(stage, next_stage){

      final_state.next();

      /*
      
        this is a merge of the phase results

        the last iteration of this becomes the final results
        
      */
      var stage_results = [];

      /*
      
        now we have the phases - these can be done in parallel
        
      */
      //debug(' Stage: %s - %s phases', stage.string, stage.phases.length);

      async.forEach(stage.phases, function(phase, next_phase){

        //debug('   Phase: %s selectors', phase.length);

        var phase_skeleton = [].concat(skeleton_array);

        var selector_state = new State(phase);

        async.forEachSeries(phase, function(selector, next_selector){

          /*
          
            the selector used by branches - it has removed the parts we have done already
            
          */
          var branchselectors = [].concat(final_state.arr);
          if(selector_state.arr.length>0){
            branchselectors.unshift({
              string:'',
              phases:[[].concat(selector_state.arr)]
            });
          }


          //debug(JSON.stringify(selector, null, 4));

          selector_state.next();

          process_skeleton(phase_skeleton, branchselectors);
          
          /*
            
            this means we are at the end of the whole reduction!
            
          */
          selector.modifier.laststep = final_state.finished && selector_state.finished;

          var selectreq = Request({
            method:'post',
            url:'/select',
            body:phase_skeleton
          })

          req.inject(selectreq);
          selectreq.setHeader('x-json-selector', selector);

          /*
          
            this means the suppliers will leave the path alone - HACK ALERT
            
          */
          selectreq.setHeader('x-digger-internal', true);

          var selectres = Response(function(){

            if(selectres.hasError() || selectres.body.length<=0){
              next_phase();
              return;
            }

            /*
            
              if there is still more to get for this string
              then we update the pipe skeleton
              
            */
            if(!selector_state.finished){

              phase_skeleton = _.map(selectres.body, extractskeleton);

            }
            /*
            
              this
              
            */
            else{
              stage_results = stage_results.concat(selectres.body || []);
            }

            next_selector();
          })

          handle(selectreq, selectres, function(){
            next_phase();
          })

        }, next_phase)

      }, function(error){

        if(error){
          next_stage(error);
          return;
        }

        /*
        
          this is the result of a stage - we pipe the results to the next stage
          or call them the final results
          
        */
        if(!final_state.finished){
          skeleton_array = _.map(stage_results, extractskeleton);
        }
        else{
          final_results = stage_results;
        }

        next_stage();
      })

    }, function(error){

      res.setHeader('x-json-branches', allbranches);

      if(error){
        res.sendError(error);
      }
      else{
        res.send(final_results);
      }

    })
    
  }

  _.extend(selectresolver, EventEmitter.prototype);

  return selectresolver;
}