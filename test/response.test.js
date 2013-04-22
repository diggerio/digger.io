var telegraft = require('../src');
var async = require('async');

describe('response', function(){

  it('should create a default', function() {
    var res = telegraft.response();

    res.statusCode.should.equal(200);
    res.headers.should.be.a('object');

  })

  it('should emit events', function(done) {
    var res = telegraft.response();

    res.on('hello', done);
    res.emit('hello');
  })

  it('should construct with a callback function', function(done) {
    var res = telegraft.response(done);
    res.send();
  })

  it('should build from raw data', function() {

    var res = telegraft.response({
      statusCode:200,
      headers:{
        'x-telegraft-hello':'hello'
      },
      body:[1,2,3]
    })

    res.statusCode.should.equal(200);
    res.getHeader('x-telegraft-hello').should.equal('hello');
    res.body.should.be.a('array');
    res.body[1].should.equal(2);

  })

  it('should emit the send event', function(done) {

    var res = telegraft.response({
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

  it('should trigger the success handler', function(done) {

    var res = telegraft.response();

    res.on('success', function(){
      res.body.should.equal('hello');
      done();
    })

    res.on('error', function(){
      throw new Error('should not happen');
    })
    

    res.send('hello');

  })


  it('should trigger the failure handler', function(done) {

    var res = telegraft.response();

    res.on('success', function(){
      throw new Error('should not happen');
    })

    res.on('failure', function(){
      res.statusCode.should.equal(500);
      res.body.should.equal('hello');
      done();
    })

    res.sendError('hello');
  })

  it('should set statusHeader', function(done) {

    async.series([
      function(next){
        var res = telegraft.response(function(){
          res.statusCode.should.equal(200);
          next();
        })

        res.send(10);
      },
      function(next){
        var res = telegraft.response(function(){
          res.statusCode.should.equal(500);
          next();
        })

        res.sendError('problem');
      },
      function(next){
        var res = telegraft.response(function(){
          res.statusCode.should.equal(404);
          next();
        })

        res.send404('nothing there!');
      },
      function(next){
        var res = telegraft.response(function(){
          res.statusCode.should.equal(302);
          next();
        })

        res.redirect('warehouse:/somewhere');
      }
    ], done)
    
  })
  
})
