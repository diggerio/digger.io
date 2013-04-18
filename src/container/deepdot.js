var _ = require('lodash');
var extend = require('xtend');
var EventEmitter = require('events').EventEmitter;

module.exports = deepdot;
module.exports.factory = factory;

function update(obj, prop, value){
  
  var existing_prop = obj[prop];

  if(_.isObject(obj[prop]) && _.isObject(value)){
    extend(obj[prop], value);
  }
  else{
    
    obj[prop] = value;
    
  }

  return value;
}

function deepdot(obj, prop, value){

  if(obj===null){
    return null;
  }
  if(!prop){
    return obj;
  }
  prop = prop.replace(/^\./, '');
  var parts = prop.split('.');
  var last = parts.pop();
  var current = obj;
  var setmode = arguments.length>=3;

  if(!_.isObject(current)){
    return current;
  }

  while(parts.length>0 && current!==null){

    var nextpart = parts.shift();
    var nextvalue = current[nextpart]; 
    
    if(!nextvalue){

      if(setmode){
        nextvalue = current[nextpart] = {};
      }
      else{
        break;  
      }
      
    }
    else{
      if(!_.isObject(nextvalue)){
        break;
      }
    }

    current = nextvalue;
  }

  if(!_.isObject(current)){
    return current;
  }

  if(setmode){
    return update(current, last, value);
  }
  else{
    return current[last];
  }
}

/*

  return an event emitter that is hooked into a single object
  
*/
function factory(obj){
  
  function dot(){

    var args = _.toArray(arguments);
    args.unshift(obj);

    var ret = deepdot.apply(null, args);

    if(arguments.length>1){
      dot.emit('change', arguments[0], arguments[1]);
    }

    return ret;
  }

  _.extend(dot, EventEmitter.prototype);

  return dot;
}