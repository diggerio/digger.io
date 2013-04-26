var digger = require('../src');
var async = require('async');

describe('contract', function(){

  it('should emit events', function(done) {

    var contract = digger.contract();

    contract.on('test', done);
    contract.emit('test');
  })

  it('should create defaults', function() {
    var contract = digger.contract();

    contract.getHeader('content-type').should.equal('digger/contract');
    contract.getHeader('x-contract-type').should.equal('merge');
    contract.getHeader('x-contract-id').should.not.equal(null);

    contract.body.should.be.a('array');
  })

  it('should create the contract type from the constructor', function() {
    var contract = digger.contract('pipe');

    contract.getHeader('x-contract-type').should.equal('pipe');
  })

  it('should add requests into the current contract', function(){
    var contract = digger.contract('pipe');

    var req1 = digger.request({
      method:'get',
      url:'/'
    })

    var req2 = digger.contract({
      method:'post',
      url:'/'
    })

    contract.add(req1);
    contract.add(req2);

    contract.body.length.should.equal(2);
    contract.body[1].method.should.equal('post');

    var contract2 = digger.contract('pipe');

    var req21 = digger.request({
      method:'get',
      url:'/'
    })

    var req22 = digger.request({
      method:'post',
      url:'/'
    })

    contract2.add([req21, req22]);

    contract2.body.length.should.equal(2);
    contract2.body[1].method.should.equal('post');

    contract.add(contract2);

    contract.body.length.should.equal(3);
  })

  
})
