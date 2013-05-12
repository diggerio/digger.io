var digger = require('../src');
var async = require('async');
var _ = require('lodash');

describe('selectorresolver', function(){

  it('should deal with a simple container contract', function(done){
    var supplier = digger.suppliers.nestedset();

    supplier.select(function(select_query, promise){
      select_query.selector.tag.should.equal('city');
      promise.resolve([{
        test:10
      }])
    })

    var container = digger.supplychain(supplier);

    container('city').ship(function(cities){
      cities.attr('test').should.equal(10);
      done();
    })
  })

  it('should produce a skeleton for each step', function(done){

    var supplier = digger.supplier();

    supplier.specialize('product', function(select_query, promise){

      promise.resolve([{
        __digger__:{
          meta:{
            tag:'product',
            diggerid:34
          }
        }
      },{
        __digger__:{
          meta:{
            tag:'product',
            diggerid:36
          }
        }
      }])
    })

    supplier.specialize('caption', function(select_query, promise){

      select_query.context.should.be.a('array');
      select_query.context.length.should.equal(2);
      select_query.context[0].diggerid.should.equal(34);
      select_query.context[1].diggerid.should.equal(36);
      select_query.selector.modifier.laststep.should.equal(true);
      promise.resolve(56);
    })

    var req = digger.request({
      method:'get',
      url:'/product/caption'
    })

    var res = digger.response(function(){
      res.body[0].data.should.equal(56);
      done();
    })

    supplier(req, res);

  })

})


