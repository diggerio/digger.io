var digger = require('../src');
var async = require('async');

describe('supplychain', function(){

  it('should emit events', function(done) {

    var container = digger.supplychain(function(req, res){

    })

    container.on('test', done);
    container.emit('test');
  })

  it('should be a container', function() {

    var container = digger.supplychain(function(req, res){

    })

    container.tag().should.equal('_supplychain');
  })

  it('should run the function with a request containing the contract', function(done){

    var container = digger.supplychain(function(req, res){
      req.method.should.equal('post');
      req.url.should.equal('reception:/');
      req.body.length.should.equal(1);
      req.body[0].method.should.equal('post');
      req.body[0].url.should.equal('/resolve');
      done();
    })

    container.diggerurl().should.equal('/');
    
    container('hello').ship(function(){

    })
  })

  it('should assign a string URL to the container produced', function(){

    var container = digger.supplychain('/app/database', function(req, res){
      
    })

  
    container.diggerurl().should.equal('/app/database');


  })

  it('should load directly from container data with multiple routes', function(done){

    var container = digger.supplychain([{
      _digger:{
        diggerid:'123',
        diggerwarehouse:'/abc'
      },
      name:'test',
      price:12
    },{
      _digger:{
        diggerid:'678',
        diggerwarehouse:'/gth'
      },
      name:'test',
      price:12
    }], function(req, res){
      req.body.length.should.equal(2);
      req.body[0].method.should.equal('post');
      req.body[0].url.should.equal('/abc/resolve');
      req.body[0].body.should.be.a('array');
      req.body[0].body.length.should.equal(1);
      req.body[0].body[0].diggerid.should.equal('123');
      req.body[1].method.should.equal('post');
      req.body[1].url.should.equal('/gth/resolve');
      req.body[1].body.should.be.a('array');
      req.body[1].body.length.should.equal(1);
      req.body[1].body[0].diggerid.should.equal('678');
      done();
    })

    container('hello').ship(function(){

    })


  })

  it('should load directly from an existing container', function(done){

    var existing = digger.create('product', {
      _digger:{
        diggerid:'123',
        diggerwarehouse:'/abc'
      },
      name:'test',
      price:12
    })

    var container = digger.supplychain(existing, function(req, res){
      req.body.length.should.equal(1);
      req.body[0].method.should.equal('post');
      req.body[0].url.should.equal('/abc/resolve');
      req.body[0].body.should.be.a('array');
      req.body[0].body.length.should.equal(1);
      req.body[0].body[0].diggerid.should.equal('123');
      done();
    })

    container('hello').ship(function(){

    })

  })

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

})
