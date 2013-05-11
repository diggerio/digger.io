var digger = require('../src');
var data = require('./fixtures/data');
var async = require('async');

describe('nestedset supplier', function(){


  it('should prepare the query for select operations', function(done) {

    var supplier = digger.suppliers.nestedset({
      url:'warehouse:/api/products'
    })

    supplier.select(function(select_query, promise, next){
      select_query.context.should.be.a('array');
      select_query.context.length.should.equal(0);
      select_query.selector.should.be.a('object');
      select_query.query.should.be.a('array');
      promise.resolve();
    })

    req = digger.request({
      method:'get'
    })

    var res = digger.response();
    res.on('success', function(){
      done();
    })
    supplier(req, res);
  })


  it('should produce queries based on the selector object', function(done) {

    var supplier = digger.suppliers.nestedset({
      url:'warehouse:/api/products'
    })

    supplier.select(function(select_query, promise){
      var query = select_query.query;

      query.length.should.equal(4);
      query[2].field.should.equal('price');
      query[2].value.should.equal(100);
      query[3].should.be.a('array');
      query[3].length.should.equal(4);
      query[3][2].value.should.equal(89);
      query[3][2].field.should.equal('__digger__.meta.left');
      query[3][2].operator.should.equal('>');

      promise.resolve(45);
    })
    
    var req = digger.request({
      url:'/select',
      method:'post',
      headers:{
        'x-json-selector':{
          tag:'product',
          class:['onsale'],
          attr:[{
            field:'price',
            operator:'<',
            value:100
          }]
        }
      },
      body:[{
        diggerid:123,
        left:34,
        right:78
      },{
        diggerid:456,
        left:89,
        right:123
      }]
    })

    var res = digger.response(function(){
      res.body[0].data.should.equal(45);
      done();
    })

    supplier(req, res);

  })


})