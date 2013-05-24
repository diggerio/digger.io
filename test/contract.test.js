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

    contract.body.length.should.equal(4);
  })

  it('should create a merge contract for multiple containers from different warehouses', function(){

    var placeA = digger.container('testa');
    placeA.diggerwarehouse('/placeA');
    var placeB = digger.container('testb');
    placeB.diggerwarehouse('/placeB');
    var holder = digger.container();
    holder.add([placeA, placeB]);

    var contract = holder('caption img', 'product');

    contract.body.length.should.equal(2);
    contract.body[0].url.should.equal('/placeA/resolve');
    contract.body[1].url.should.equal('/placeB/resolve');

    var singlecontract = contract.body[0];
    singlecontract.headers['x-json-selector-strings'].should.be.a('array');
    singlecontract.headers['x-json-selector-strings'].length.should.equal(2);
  })

  it('should create a contract from a simple container select action', function(){
    var placeA = digger.container('testa');
    placeA.diggerid('123');
    placeA.diggerwarehouse('/placeA');

    var contract = placeA('product');

    contract.method.should.equal('post');
    contract.url.should.equal('reception:/');
    contract.getHeader('x-contract-type').should.equal('merge');

    contract.body.length.should.equal(1);

    var req = contract.body[0];

    req.method.should.equal('post');
    req.url.should.equal('/placeA/resolve');
    req.headers["x-json-selector-strings"][0].phases[0][0].tag.should.equal('product');
  })

  it('should create a contract from a simple container append action', function(){
    var placeA = digger.container('testa');
    placeA.diggerid('123');
    placeA.diggerwarehouse('/placeA');

    var child = digger.container('child');

    var contract = placeA.append(child);

    contract.method.should.equal('post');
    contract.url.should.equal('reception:/');
    contract.getHeader('x-contract-type').should.equal('merge');

    contract.body.length.should.equal(1);

    var req = contract.body[0];

    req.method.should.equal('post');
    req.url.should.equal('/placeA/123');
    req.body[0].__digger__.tag.should.equal('child');

    placeA.children().eq(0).tag().should.equal('child');
  })

  it('should create a contract from a simple container save action', function(){
    var placeA = digger.container('testa');
    placeA.diggerid('123');
    placeA.diggerwarehouse('/placeA');

    placeA.attr('test', 10);

    var contract = placeA.save();

    contract.method.should.equal('post');
    contract.url.should.equal('reception:/');
    contract.getHeader('x-contract-type').should.equal('merge');

    contract.body.length.should.equal(1);

    var req = contract.body[0];

    req.method.should.equal('put');
    req.url.should.equal('/placeA/123');
    req.body.test.should.equal(10);
    req.body.__digger__.tag.should.equal('testa');
  })

  it('should create a contract from a simple container delete action', function(){
    var placeA = digger.container('testa');
    placeA.diggerid('123');
    placeA.diggerwarehouse('/placeA');

    var contract = placeA.remove();

    contract.method.should.equal('post');
    contract.url.should.equal('reception:/');
    contract.getHeader('x-contract-type').should.equal('merge');

    contract.body.length.should.equal(1);

    var req = contract.body[0];

    req.method.should.equal('delete');
    req.url.should.equal('/placeA/123');
  })

  it('should allow another different container action to be merged into the current contract', function(){
    var containerA = digger.container('A');
    var containerB = digger.container('B');
    var containerC = digger.container('C');

    containerA.attr('test', 10);

    var contract = containerA.save();
    contract.add(containerB.append(containerC));

    contract.body.length.should.equal(2);

    var save = contract.body[0];
    var append = contract.body[1];

    save.method.should.equal('put');
    append.method.should.equal('post');


  })

})
