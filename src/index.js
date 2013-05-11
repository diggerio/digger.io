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

module.exports = {

  /*
  
    modules
    
  */
	container:require('./container'),
  create:require('./container'),

  selector:require('./container/selector'),
  promise:require('./network/promise'),
  request:require('./network/request').factory,
  response:require('./network/response').factory,
  contract:require('./network/contract').factory,

  warehouse:require('./warehouse'),
  supplier:require('./supplier'),
  supplychain:require('./supplychain'),

  merge:require('./network/contract').mergefactory,
  sequence:require('./network/contract').sequencefactory,

  middleware:{
    contractresolver:require('./middleware/contractresolver'),
    selectresolver:require('./middleware/selectresolver')
  },
  
  suppliers:{
    diggerdb:require('./supplier/diggerdb'),
    simpledb:require('./supplier/simpledb'),
    nestedset:require('./supplier/nestedset')
  }
}