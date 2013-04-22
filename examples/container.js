var digger = require('../src');
var data = require('../test/fixtures/data');
var Query = require('../src/supplier/query');

    var supplier = digger.supplier();

    var query = Query({
      tag:'product',
      class:['onsale'],
      attr:[{
        field:'price',
        operator:'<',
        value:100
      }]
    }, [{
      __digger__:{
        meta:{
          diggerid:123,
          left:34,
          right:78
        }
      }
    },{
      __digger__:{
        meta:{
          diggerid:456,
          left:89,
          right:123
        }
      }
    }])

    console.dir(query);
    