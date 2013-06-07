var digger = require('../src');
var data = require('../test/fixtures/data');
var async = require('async');
var fs = require('fs');


    var supplier = digger.supplier({
      url:'/some/place',
      provider:true
    })

    supplier.select(function(select_query, promise){
      console.log('-------------------------------------------');
      console.log('in supplier');
      console.log('jhere');
      console.dir(select_query);
      process.exit();


      promise.resolve({
        title:'apple',
        _digger:{
          tag:'fruit'
        }
      })
    })

    var supplychain = digger.supplychain('/some/place/rtrt', supplier);

    supplychain('thing').debug().ship(function(things){
      console.log('-------------------------------------------');
      console.log('after');
      console.dir(things.toJSON());
      process.exit();
    })