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

module.exports.parse = fromXML;
module.exports.stringify = toXML;

var is_node = process && process.env && process.env.NODEENV;

/*
  digger.io - XML Format
  ----------------------

  Turns XML strings into container data and back again


 */

function null_filter(val){
  return !_.isUndefined(val) && !_.isNull(val);
}

function data_factory(element){

  if(element.nodeType!=element.ELEMENT_NODE){
    return;
  }

  var metafields = {
    id:true,
    quarryid:true
  }
  
  var manualfields = {
    tag:true,
    class:true
  }

  var data = {
    _meta:{
      tag:element.nodeName,
      class:(element.getAttribute('class') || '').split(/\s+/)
    },
    _children:[]
  }
  
  _.each(metafields, function(v, metafield){
    data._meta[metafield] = element.getAttribute(metafield) || '';
  })

  _.each(element.attributes, function(attr){
    if(!metafields[attr.name] && !manualfields[attr.name]){
      data[attr.name] = attr.value;
    }
  })

  data._children = _.filter(_.map(element.childNodes, data_factory), null_filter);

  return data;
}

function BrowserXMLParser(st){
  if (window && typeof window.DOMParser != "undefined") {
    return (function(xmlStr) {
      var xmlDoc = ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
      return _.map(xmlDoc.childNodes, data_factory);
    })(st)
  } else if (window && typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
    return (function(xmlStr) {
      var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
      xmlDoc.async = "false";
      xmlDoc.loadXML(xmlStr);
      return _.map(xmlDoc.childNodes, data_factory);
    })(st)
  }
}

/*

  includes xmldom
  
*/
function ServerXMLParser(st){

  /*
  
    server side XML parsing
    
  */
  var results = null;
  var evalst = [
    "var xml = require('xmldom');",
    "var DOMParser = xml.DOMParser;",
    "var doc = new DOMParser().parseFromString(st);",
    "results = _.map(doc.childNodes, data_factory);",
  ].join("\n");
  
  try{
    eval(evalst);
  }
  catch(e){
    throw new Error(e);
  }

  return results;
}

function fromXML(string){

  return is_node ? ServerXMLParser(string) : BrowserXMLParser(string);

}


function string_factory(data, depth){

  var meta = data._meta || {};
  var attr = data;

  function get_indent_string(){
    var st = "\t";
    var ret = '';
    for(var i=0; i<depth; i++){
      ret += st;
    }
    return ret;
  }

  var pairs = {
    id:meta.id,
    quarryid:meta.quarryid,
    class:_.isArray(meta.class) ? meta.class.join(' ') : ''
  }

  var pair_strings = [];

  _.each(attr, function(val, key){
    pairs[key] = _.isString(val) ? val : '' + val;
  })

  _.each(pairs, function(value, field){
    if(!_.isEmpty(value)){
      pair_strings.push(field + '="' + value + '"');  
    }
  })

  if(data.children && data.children.length>0){
    var ret = get_indent_string() + '<' + meta.tag + ' ' + pair_strings.join(' ') + '>' + "\n";

    _.each(data.children, function(child){      
      ret += string_factory(child, depth+1);
    })

    ret += get_indent_string() + '</' + meta.tag + '>' + "\n";

    return ret;    
  }
  else{
    return get_indent_string() + '<' + meta.tag + ' ' + pair_strings.join(' ') + ' />' + "\n";
  }
}

/*
  This is the sync version of a warehouse search used by in-memory container 'find' commands

  The packet will be either a straight select or a contract
 */
function toXML(data_array){
  return _.map(data_array, function(data){
    return string_factory(data, 0);
  }).join("\n");
}