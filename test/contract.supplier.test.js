var digger = require('../src');
var async = require('async');

describe('contract.supplier', function(){


  it('should provide the supplychain to any appended containers', function(){
    var supplier = digger.supplier({
      url:'/some/place'
    })

    var supplychain = digger.supplychain(supplier);

    var containerA = digger.container('A');
    
    containerA.attr('test', 10);

    containerA.supplychain = supplychain;

    var containerB = digger.container('B');

    containerA.append(containerB);

    (containerA.supplychain === containerB.supplychain).should.equal(true);
  })

  it('should allow the client side piping of contracts and functions', function(done){
    var supplier = digger.supplier({
      url:'/some/place'
    })

    supplier.select(function(select_query, promise){
      promise.resolve({
        title:'apple',
        _digger:{
          tag:'fruit'
        }
      })
    })

    supplier.append(function(append_query, promise){
      var target = append_query.target;
      var data = append_query.body;
      promise.resolve(data);
    })

    var supplychain = digger.supplychain(supplier);

    async.series([

      function(seqnext){
        digger.pipe([
          supplychain('thing'),

          function(thing, next){
            thing.attr('title').should.equal('apple');
            next(null, 10);
          }

        ], function(error, result){

          result.should.equal(10);
          seqnext();
        });
      },

      function(seqnext){
        digger.merge([
          supplychain('thing'),

          function(next){
            next(null, 10);
          }

        ], function(error, results){

          results[0].attr('title').should.equal('apple');
          results[1].should.equal(10);

          seqnext();
        })
      }
    ], done)
  })

})
