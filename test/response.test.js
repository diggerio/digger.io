var digger = require('../src');
var data = require('./fixtures/data');
var async = require('async');

describe('response', function(){

  it('should create a default', function() {
    var res = digger.response();

    res.statusCode.should.equal(200);
    res.headers.should.be.a('object');

  })

  it('should emit events', function(done) {
    var res = digger.response();

    res.on('hello', done);
    res.emit('hello');
  })

  it('should construct with a callback function', function(done) {
    var res = digger.response(done);
    res.send();
  })

  it('should build from raw data', function() {

    var res = digger.response({
      statusCode:200,
      headers:{
        'x-digger-hello':'hello'
      },
      body:[1,2,3]
    })

    res.statusCode.should.equal(200);
    res.getHeader('x-digger-hello').should.equal('hello');
    res.body.should.be.a('array');
    res.body[1].should.equal(2);

  })

  it('should emit the send event', function(done) {

    var res = digger.response({
      statusCode:200,
      headers:{
        'x-digger-hello':'hello'
      },
      body:[1,2,3]
    })

    res.on('send', function(){
      res.body.should.equal(10);
      done();
    });

    res.send(10);

  })

  it('should set statusHeader', function(done) {

    async.series([
      function(next){
        var res = digger.response(function(){
          res.statusCode.should.equal(200);
          next();
        })

        res.send(10);
      },
      function(next){
        var res = digger.response(function(){
          res.statusCode.should.equal(500);
          next();
        })

        res.error('problem');
      },
      function(next){
        var res = digger.response(function(){
          res.statusCode.should.equal(404);
          next();
        })

        res.notfound('nothing there!');
      },
      function(next){
        var res = digger.response(function(){
          res.statusCode.should.equal(302);
          next();
        })

        res.redirect('axon://contract.digger');
      }
    ])
    

    res.on('send', function(){
      res.body.should.equal(10);
      done();
    });

    res.send(10);

  })
  
})
