/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

process.env.DIGGERSERVER = require(__dirname + '/../package.json').version;

/*
function getErrorObject(){
    try { throw Error('') } catch(err) { return err; }
}

function getLineNumber(){
  var err = getErrorObject();
  var caller_line = err.stack.split("\n")[5];
  var match = [];
  return ('(' + caller_line.split(/\/digger\.io\//).pop() || '');
}
*/

module.exports = function(){
  
  /*
  if(process.env.NODE_ENV!=='development' || process.env.CONSOLE==='false'){
    return;
  }

  var oldlog = console.log;

  console.log = function(st){
    var num = getLineNumber();
    oldlog(num + ': ' + st);
  }
  */
}