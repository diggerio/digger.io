var digger = require('../src');
var data = require('./fixtures/data');

describe('promise', function(){

  it('should be a promise', function(done) {
    var promise = digger.promise();

    promise.then(function(result){
      result.should.equal(123);
      done();
    }, function(error){

    })

    process.nextTick(function(){
      promise.resolve(123);
    })
  })
})