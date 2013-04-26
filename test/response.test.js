var digger = require('../src');
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

  it('should trigger the success handler', function(done) {

    var res = digger.response();

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

    var res = digger.response();

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
        var res = digger.response(function(){
          res.statusCode.should.equal(200);
          next();
        })

        res.send(10);
      },
      function(next){
        var res = digger.response();
        res.on('send', function(){
          res.statusCode.should.equal(500);
          next();
        })
        res.sendError('problem');
      },
      function(next){
        var res = digger.response(function(){
          res.statusCode.should.equal(404);
          next();
        })

        res.send404('nothing there!');
      },
      function(next){
        var res = digger.response(function(){
          res.statusCode.should.equal(302);
          next();
        })

        res.redirect('warehouse:/somewhere');
      }
    ], done)
    
  })

  it('should fill from another response JSON', function(done) {

    var res = digger.response();

    res.on('success', function(){
      res.statusCode.should.equal(200);
      res.getHeader('x-digger-test').should.equal(345);
      res.body.should.equal('hello world');
      done();
    })

    res.fill({
      statusCode:200,
      headers:{
        'x-digger-test':345
      },
      body:'hello world'
    })

  })

  it('should add to create multipart responses', function(){
    var res = digger.response();

    var childres1 = digger.response();

    childres1.statusCode = 200;
    childres1.body = [34,435];

    res.add(childres1);

    res.getHeader('content-type').should.equal('digger/multipart');
    res.body.should.be.a('array');
    res.body.length.should.equal(1);
  })

  it('should flatten multipart responses', function() {

    var res = digger.response();

    res.on('success', function(data){
      data.should.be.a('array');
      data.length.should.equal(4);
      data[0].should.equal(12);
      data[3].should.equal(657);
    })

    res.on('failure', function(data){
      data.should.be.a('array');
      data.length.should.equal(3);
      data[2].should.equal('problem');
    })

    res.fill({
      statusCode:200,
      headers:{
        'content-type':'digger/multipart'
      },
      body:[{
        statusCode:200,
        body:12
      },{
        statusCode:500,
        body:'There was a problem'
      },{
        statusCode:404,
        body:'Not there'
      },{
        statusCode:200,
        body:[45,6]
      },{
        statusCode:200,
        headers:{
          'content-type':'digger/multipart'
        },
        body:[{
          statusCode:200,
          body:657
        },{
          statusCode:500,
          body:'problem'
        }]
      }]
    })

  })

  
})
