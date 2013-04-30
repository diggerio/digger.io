var digger = require('../src');
var async = require('async');
var _ = require('lodash');

describe('contractresolver', function(){


  it('should run a basic pipe contract', function(done){

    var warehouse = digger.warehouse();

    warehouse.use(digger.middleware.contractresolver(warehouse));
    
    warehouse.use('/apples', function(req, res){
      res.send([1,2]);
    })

    warehouse.use('/oranges', function(req, res){
      var answer = _.map(req.body, function(digit){
        return digit*2;
      })
      res.send(answer);
    })

    var contract = digger.contract('pipe');

    var req1 = digger.request({
      method:'post',
      url:'/apples'
    })

    var req2 = digger.request({
      method:'post',
      url:'/oranges'
    })

    contract.add(req1);
    contract.add(req2);

    var res = digger.response(function(){
      res.statusCode.should.equal(200);
      res.body.should.be.a('array');
      res.body.length.should.equal(2);
      res.body[0].should.equal(2);
      res.body[1].should.equal(4);
      done();
    })
    warehouse(contract, res);
  })

  it('should run a basic merge contract', function(done){

    var warehouse = digger.warehouse();

    warehouse.use(digger.middleware.contractresolver(warehouse));

    warehouse.use('/apples', function(req, res){
      res.send([1,2]);
    })

    warehouse.use('/oranges', function(req, res){
      res.send([3,4]);
    })

    var contract = digger.contract('merge');

    var req1 = digger.request({
      method:'get',
      url:'/apples'
    })

    var req2 = digger.request({
      method:'get',
      url:'/oranges'
    })

    contract.add(req1);
    contract.add(req2);

    var res = digger.response();

    res.on('success', function(results){
      res.statusCode.should.equal(200);
      results.should.be.a('array');
      results.length.should.equal(4);
      results[1].should.equal(2);
      results[3].should.equal(4);
      done();
    })
    warehouse(contract, res);
  })

  
})


