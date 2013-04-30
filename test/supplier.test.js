var digger = require('../src');
var data = require('./fixtures/data');
var Query = require('../src/supplier/query');
var async = require('async');

describe('supplier', function(){

  it('should be a function', function(done) {
    var supplier = digger.supplier();
    supplier.should.be.a('function');
    done();
  })

  it('should emit events', function(done) {
    var supplier = digger.supplier();
    supplier.on('hello', done);
    supplier.emit('hello');
  })

  it('should produce queries based on the selector object', function() {
    
    var selector = Query({
      tag:'product',
      class:['onsale'],
      attr:[{
        field:'price',
        operator:'<',
        value:100
      }]
    }, [{
      __digger__:{
        meta:{
          diggerid:123,
          left:34,
          right:78
        }
      }
    },{
      __digger__:{
        meta:{
          diggerid:456,
          left:89,
          right:123
        }
      }
    }])

    selector.length.should.equal(4);
    selector[2].field.should.equal('price');
    selector[2].value.should.equal(100);
    selector[3].should.be.a('array');
    selector[3].length.should.equal(4);
    selector[3][2].value.should.equal(89);
    selector[3][2].field.should.equal('__digger__.meta.left');
    selector[3][2].operator.should.equal('>');
  })

  it('should extract the context for GET requests', function(done) {

    function runrequest(req, throwfn, callbackfn){
      
      var supplier = digger.supplier('warehouse:/api/products');

      supplier.select(function(select_query, promise){
        throwfn(select_query);
        process.nextTick(function(){
          promise.resolve({
            ok:true
          })  
        })
      })

      req = digger.request(req);
      var res = digger.response();

      res.on('success', callbackfn);
      res.on('failure', function(error){
        throw new Error('request error: ' + error);
      })

      supplier(req, res);
    }

    async.series([

      function(next){
        runrequest({
          method:'get',
          url:'/12313'
        }, function(select_query){
          var selector = select_query.selector;
          selector.diggerid.should.equal('12313');
        }, function(result){
          result.ok.should.equal(true);
          next();
        })
      },

      function(next){
        runrequest({
          method:'get',
          url:'/_12313'
        }, function(select_query){
          var selector = select_query.selector;
          selector.id.should.equal('12313');
        }, function(result){

          result.ok.should.equal(true);
          next();
        })
      },

      function(next){
        runrequest({
          method:'get',
          url:'/product'
        }, function(select_query){
          var selector = select_query.selector;
          selector.tag.should.equal('product');
        }, function(result){
          result.ok.should.equal(true);
          next();
        })
      },

      function(next){
        runrequest({
          method:'get',
          url:'/product.onsale.red'
        }, function(select_query){
          var selector = select_query.selector;
          selector.tag.should.equal('product');
          selector.class.onsale.should.equal(true);
          selector.class.red.should.equal(true);
        }, function(result){
          result.ok.should.equal(true);
          next();
        })
      },

      function(next){
        runrequest({
          method:'get',
          url:'/.red'
        }, function(select_query){
          var selector = select_query.selector;
          selector.class.red.should.equal(true);
        }, function(result){
          result.ok.should.equal(true);

          next();
        })
      }

    ], done)

  })

  it('should run contracts from multiple selectors', function(done) {
    function runrequest(req, throwfn, callbackfn){
      
      var supplier = digger.supplier('warehouse:/api/products');

      supplier.select(function(select_query, promise){
        throwfn(select_query);
        process.nextTick(function(){
          promise.resolve({
            ok:true
          })  
        })
      })

      req = digger.request(req);
      var res = digger.response();

      res.on('success', callbackfn);
      res.on('failure', function(error){
        throw new Error('request error: ' + error);
      })

      supplier(req, res);
    }

    var hit = {};

    async.series([

      function(next){

        var throwfns = [
          function(select_query){
            var selector = select_query.selector;
            selector.tag.should.equal('product');
            selector.class.onsale.should.equal(true);
            hit.first = true;
          },

          function(select_query){
            var selector = select_query.selector;
            selector.tag.should.equal('caption');
            selector.class.red.should.equal(true);
            hit.second = true;
          }

        ]

        runrequest({
          method:'get',
          url:'/product.onsale/caption.red'
        }, function(select_query){
          var fn = throwfns.shift();
          fn(select_query);
        }, function(result){
          hit.first.should.equal(true);
          hit.second.should.equal(true);
          next();
        })
      }

    ], done)
  })

  it('should make creating different suppliers easy', function(done) {

    var supplier = digger.supplier('warehouse:/api/products');

    supplier.select(function(select_query, promise){
      throw new Error('wrong routing');
    })

    supplier.specialize('product.onsale', function(select_query, promise){
      select_query.selector.tag.should.equal('product');
      select_query.selector.class.onsale.should.equal(true);
      promise.resolve({
        answer:10
      })
    })

    req = digger.request({
      url:'/product.onsale.test',
      method:'get'
    })

    var res = digger.response();

    res.on('success', function(){
      res.body.answer.should.equal(10);
      done();
    })

    res.on('failure', function(error){
      throw new Error('request error: ' + error);
    })

    supplier(req, res);
  })

  it('should accept a stack location as an argument', function() {
    var supplier = digger.supplier('warehouse:/api/products');

    supplier.settings.attr('url').should.equal('warehouse:/api/products');
  })

  it('should return container data', function(done) {

    var supplier = digger.supplier('warehouse:/api/products');

    supplier.select(function(select_query, promise){
      promise.resolve({
        name:'test'
      })
    })

    req = digger.request({
      url:'/product.onsale.test',
      method:'get'
    })

    req.expect('digger/containers');

    var res = digger.response();

    res.on('success', function(){
      res.getHeader('content-type').should.equal('digger/containers');
      res.body.should.be.a('array');
      done();
    })

    supplier(req, res);

  })

  it('should pipe specialized selectors to each other', function(done) {

    var supplier = digger.supplier('warehouse:/api/products');

    supplier.specialize('product', function(select_query, promise){
      promise.resolve({
        name:'product',
        __digger__:{
          meta:{
            diggerid:2323,
            left:10,
            right:12
          }
        }
      })
    })

    supplier.specialize('caption', function(select_query, promise){      
      select_query.context.should.be.a('array');
      select_query.context.length.should.equal(1);
      var parent = select_query.context[0];
      parent.name.should.equal('product');
      var meta = parent.__digger__.meta;
      meta.diggerid.should.equal(2323);
      meta.left.should.equal(10);

      promise.resolve({
        name:'caption'
      })
    })

    req = digger.request({
      url:'/product/caption',
      method:'get'
    })

    var res = digger.response();

    res.expect('digger/containers');

    res.on('success', function(){
      res.getHeader('content-type').should.equal('digger/containers');
      res.body.should.be.a('array');
      res.body[0].name.should.equal('caption');
      done();
    })

    supplier(req, res);

  })


})