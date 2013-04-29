var digger = require('../src');
var async = require('async');

describe('contractresolver', function(){


  it('should add requests into the current contract', function(){

    var resolver = digger.middleware.contractresolver(function(req, res, next){
      req.method.should.equal('post');
      res.send(req.body + 10);
    })

    var contract = digger.contract('pipe');

    var req1 = digger.request({
      method:'post',
      url:'/',
      body:30
    })

    var req2 = digger.request({
      method:'post',
      url:'/'
    })

    contract.add(req1);
    contract.add(req2);

    var res = digger.response(function(){
      res.statusCode.should.equal(200);
      res.body.should.equal(50);
    })
    resolver(contract, res);
  })

  
})


