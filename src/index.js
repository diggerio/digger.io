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

var exports = module.exports = {

  version:require(__dirname + '/../package.json').version,


  client:function(warehouse){
    return Client(function(request, reply){
      var server_req = Request(request);
      var server_res = Response(function(r){
        reply(null, server_res.toJSON());
      })

      warehouse(server_req, server_res);
    })
  },



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
  
    tools used for any digger supplier
    
  */
  mixins:{
    fileprovisioner:require('./mixins/fileprovisioner')
  },
  
  
  /*
  
    suppliers - these should be elsewhere
    
    database connectors

  */
  suppliers:{
    simpledb:require('./supplier/simpledb'),
    mongo:require('./supplier/mongo'),
    nestedset:require('./supplier/nestedset')
  }



}