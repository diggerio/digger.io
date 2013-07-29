var digger = require('../src');
var async = require('async');
var _ = require('lodash');
var Bridge = require('digger-bridge');

describe('selectorresolver', function(){

  it('should deal with a simple container contract', function(done){

    var supplier = digger.suppliers.nestedset();

    supplier.select(function(select_query, promise){
      select_query.selector.tag.should.equal('city');
      promise.resolve([{
        test:10
      }])
    })

    var container = Bridge(supplier).connect();

    container('city').ship(function(cities, res){
      cities.attr('test').should.equal(10);
      done();
    })
  })

  it('should produce a skeleton for each step', function(done){

    var supplier = digger.supplier();

    supplier.specialize('product', function(select_query, promise){

      promise.resolve([{
        _digger:{
          tag:'product',
          diggerid:34
        }
      },{
        _digger:{
          tag:'product',
          diggerid:36
        }
      }])
    })

    supplier.specialize('caption', function(select_query, promise){

      select_query.context.should.be.a('array');
      select_query.context.length.should.equal(2);
      select_query.context[0].diggerid.should.equal(34);
      select_query.context[1].diggerid.should.equal(36);
      select_query.selector.modifier.laststep.should.equal(true);

      promise.resolve([{
        _digger:{
          tag:'caption',
          diggerid:493
        }
      }]);
    })

    var req = Bridge.request({
      method:'get',
      url:'/product/caption'
    })

    var res = Bridge.response(function(){

      res.body[0]._digger.diggerid.should.equal(493);
      
      done();
    })

    supplier(req, res);

  })



})


