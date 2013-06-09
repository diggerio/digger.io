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
var async = require('async');
var _ = require('lodash');

var exports = module.exports = {

  pipe:function(arr, alldone){
    var lastresults = null;

    async.forEachSeries(arr, function(fn, nextfn){
      if(_.isFunction(fn.getHeader) && fn.getHeader('x-contract-type')){
        fn.ship(function(results){
          lastresults = results;
          nextfn(null, results);
        })
      }
      else{
        fn(lastresults, function(error, results){
          lastresults = results;
          nextfn();
        })
      }
    }, function(error){
      if(alldone){
        alldone(null, lastresults);
      }
    })
  },

  merge:function(arr, alldone){
    var allresults = [];

    async.forEachSeries(arr, function(fn, nextfn){
      if(_.isFunction(fn.getHeader) && fn.getHeader('x-contract-type')){
        fn.ship(function(results){
          allresults.push(results);
          nextfn();
        })
      }
      else{
        fn(function(error, results){
          allresults.push(results);
          nextfn();
        })
      }
    }, function(error){
      if(alldone){
        alldone(null, allresults);
      }
    })
  }

}