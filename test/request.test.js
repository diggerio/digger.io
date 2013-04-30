var digger = require('../src');
var data = require('./fixtures/data');

describe('request', function(){

  it('should create a default', function() {
    var req = digger.request();

    req.method.should.equal('get');
    req.headers.should.be.a('object');

  })

  it('should emit events', function(done) {
    var req = digger.request();

    req.on('hello', done);
    req.emit('hello');
  })

  it('should build from raw data', function() {

    var req = digger.request({
      method:'post',
      url:'telegraft:/warehouse/hello',
      headers:{
        'x-telegraft-hello':'hello'
      },
      query:{
        id:234
      },
      body:[1,2,3]
    })

    req.method.should.equal('post');
    req.getHeader('x-telegraft-hello').should.equal('hello');
    req.query.id.should.equal(234);
    req.body.should.be.a('array');
    req.body[1].should.equal(2);

  })

  it('should allow the expeceted content type to be set', function() {
    var req = digger.request({
      method:'get',
      url:'digger://warehouse/hello?order=boo'
    })

    req.expect('digger/containers');
    req.getHeader('x-expect').should.equal('digger/containers');
  })

  it('should process the URL', function() {

    var req = digger.request({
      method:'get',
      url:'digger://warehouse/hello?order=boo'
    })

    req.protocol.should.equal('digger:');
    req.hostname.should.equal('warehouse');
    req.pathname.should.equal('/hello');
    req.query.order.should.equal('boo');
    
  })
  
})
