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
      select_query.query.should.be.a('object');
      promise.resolve();
    })

    req = digger.request({
      method:'get'
    })

    var res = digger.response(true);
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

      var search = query.search;
      var skeleton = query.skeleton;

      search.length.should.equal(3);
      search[0].field.should.equal('_digger.tag');
      search[0].value.should.equal('product');
      search[0].operator.should.equal('=');
      search[1].field.should.equal('_digger.class');
      search[1].value.should.equal('onsale');
      search[1].operator.should.equal('=');
      search[2].field.should.equal('price');
      search[2].value.should.equal(100);
      search[2].operator.should.equal('<');

      skeleton.should.be.a('array');
      skeleton.length.should.equal(2);
      skeleton[1][0].value.should.equal(89);
      skeleton[1][0].field.should.equal('_digger.left');
      skeleton[1][0].operator.should.equal('>');

      promise.resolve(45);
    })
    
    var req = digger.request({
      url:'/select',
      method:'post',
      headers:{
        'x-json-selector':{
          tag:'product',
          class:{
            'onsale':true
          },
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

  it('should encode nested set indexes for us', function(done) {

    var supplier = digger.suppliers.nestedset({
      url:'warehouse:/api/products'
    })

    var result = supplier.encode([45,3,4,5]);

    result.left.numerator.should.equal(7739);
    result.left.denominator.should.equal(169);
    result.right.numerator.should.equal(9067);
    result.right.denominator.should.equal(198);

    done();
  })


})