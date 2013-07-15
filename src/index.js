/*

  (The MIT License)

  Copyright (C) 2005-2013 Kai Davenport

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*

	digger.io main API
	
*/


/*

  prepare the env
  
*/
process.env.DIGGERSERVER = require(__dirname + '/../package.json').version;

var path = require('path');

/*

  include the core container lib
  
*/
var digger = require('digger');

var exports = module.exports = {

  version:require(__dirname + '/../package.json').version,

  /*
  
    export utils for supplier modules
    
  */
  utils:require('digger-utils'),
  
  /*
  
    container

    client framework
    
  */
	container:digger.container,
  proto:digger.proto,
  create:digger.container,
  selector:digger.selector,

  /*
  
    network

    messaging framework
    
  */
  promise:digger.promise,
  request:digger.request,//require('./request/request').factory,
  response:digger.response,//require('./request/response').factory,
  contract:digger.contract,//require('./request/contract').factory,
  pipe:digger.pipe,//require('./request/async').pipe,
  merge:digger.merge,//require('./request/async').merge,
  series:digger.series,//require('./request/async').series,
  parallel:digger.parallel,//require('./request/async').merge,

  /*
  
    the supplychain is the client side link back to the reception/warehouses
    
  */
  supplychain:digger.supplychain,

  /*
  
    main router
    
  */
  reception:require('./reception/proto').factory,

  /*
  
    warehouse / supplier

    server framework
    
  */
  warehouse:require('./warehouse/proto').factory,
  supplier:require('./supplier/proto').factory,
  


  
  /*
    
    middleware

    functional server plugins
      
  */

  middleware:{
    contractresolver:require('./middleware/contractresolver'),
    selectresolver:require('./middleware/selectresolver')
  },
  
  
  /*
  
    suppliers
    
    database connectors

  */
  suppliers:{
    simpledb:require('./supplier/simpledb'),
    mongo:require('./supplier/mongo'),
    nestedset:require('./supplier/nestedset')
  }



}