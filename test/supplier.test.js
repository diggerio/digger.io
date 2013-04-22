var digger = require('../src');
var data = require('./fixtures/data');
var Query = require('../src/supplier/query');

describe('supplier', function(){

  it('should be a function', function(done) {
    var supplier = digger.supplier();
    supplier.should.be.a('function');
    done();
  })

  it('should emit events', function(done) {
    var supplier = digger.supplier();
    supplier.on('hello', done);
    supplier.emit('hello');
  })

  it('should process queries correctly', function() {
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

    query.length.should.equal(4);
    query[3].should.be.a('array');
    query[3].length.should.equal(4);

  })


})