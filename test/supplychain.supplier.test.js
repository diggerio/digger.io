var digger = require('../src');
var async = require('async');

describe('supplychain.supplier', function(){

  /*
  
    this makes sure that the supply chain serializes requests on the way through
    
  */
  it('should forcibly serialize requests to accounts for entirely local setups', function(done){

    var existing = digger.create('product', {
      _digger:{
        diggerid:'123',
        diggerwarehouse:'/abc'
      },
      name:'test',
      price:12
    })

    var supplier = digger.supplier();

    supplier.select(function(select_query, promise){
      promise.resolve(existing.toJSON());
    })

    var supplychain = digger.supplychain(supplier);

    supplychain('ting').ship(function(ting){
      ting.attr('name').should.equal('test');
      ting.attr('price').should.equal(12);

      ting.attr('otherway', 55);

      (existing.attr('otherway') || '').should.not.equal(55);
      ting.attr('otherway').should.equal(55);

      done();
    })

  })

  it('should allow several existing contracts to be combined as merge', function(){

    var supplier = digger.supplier({
      url:'/api'
    })

    var supplychain = digger.supplychain(supplier);

    var db1 = supplychain.connect('/json/apples');
    var db2 = supplychain.connect('/json/oranges');

    var append = supplychain.merge([
      db1.append(digger.create('fruit').addClass('apple')),
      db2.append(digger.create('fruit').addClass('orange'))
    ])

    append.body.length.should.equal(2);
    append.body[0].headers['x-contract-type'].should.equal('merge');
    append.body[0].body.length.should.equal(1);
    append.body[0].body[0].url.should.equal('/json/apples');

        
  })


  it('should assign the container a supplychain with all various arguments', function(){

    var supplier = digger.supplier();

    var db1 = digger.supplychain(supplier);

    if(!db1.supplychain){
      throw new Error('db1 does not have a supplychain');
    }

    var db2 = digger.supplychain('/', supplier);

    if(!db2.supplychain){
      throw new Error('db1 does not have a supplychain');
    }

  })
})
