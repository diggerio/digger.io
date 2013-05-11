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

    container.tag().should.equal('supplychain');
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

    container('hello').ship(function(){

    })
  })

})
