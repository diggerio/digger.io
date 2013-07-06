/*
  Copyright (c) 2012 All contributors as noted in the AUTHORS file

  This file is part of quarry.io

  quarry.io is free software; you can redistribute it and/or modify it under
  the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation; either version 3 of the License, or
  (at your option) any later version.

  quarry.io is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*

	digger.io main API
	
*/


/*

  prepare the env
  
*/
var bootstrap = require('./bootstrap');
var path = require('path');

var exports = module.exports = {

  version:require(__dirname + '/../package.json'),

  /*
  
    export utils for supplier modules
    
  */
  utils:require('./utils'),
  
  /*
  
    container

    client framework
    
  */
	container:require('./container/proto').factory,
  proto:require('./container/proto'),
  create:require('./container/proto').factory,
  selector:require('./container/selector'),

  /*
  
    network

    messaging framework
    
  */
  promise:require('./network/promise'),
  request:require('./network/request').factory,
  response:require('./network/response').factory,
  contract:require('./network/contract').factory,
  pipe:require('./network/async').pipe,
  merge:require('./network/async').merge,

  browserapi_path:function(){
    return path.normalize(__dirname + '/../build/container.js');
  },

  /*
  
    warehouse / supplier

    server framework
    
  */
  warehouse:require('./warehouse/proto').factory,
  supplier:require('./supplier/proto').factory,
  supplychain:require('./warehouse/supplychain'),

  /*
  
    auxillary
    
  */
  reception:require('./reception/proto').factory,
  
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

bootstrap();