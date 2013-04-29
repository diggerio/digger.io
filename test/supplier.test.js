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

      supplier.select(function(req){
        throwfn(req);
        var promise = digger.promise();
        process.nextTick(function(){
          promise.resolve({
            ok:true
          })  
        })
        return promise;
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

      supplier.select(function(req){
        throwfn(req);
        var promise = digger.promise();
        process.nextTick(function(){
          promise.resolve({
            ok:true
          })  
        })
        return promise;
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

        var throwfns = [
          function(select_query){
            var selector = select_query.selector;
            selector.tag.should.equal('product');
            selector.class.onsale.should.equal(true);
            console.log('-------------------------------------------');
            console.log('first');
          },

          function(select_query){
            var selector = select_query.selector;
            selector.tag.should.equal('caption');
            selector.class.red.should.equal(true);
            console.log('-------------------------------------------');
            console.log('second');
          }
        ]

        runrequest({
          method:'get',
          url:'/product.onsale/caption.red'
        }, function(select_query){
          var fn = throwfns.shift();
          fn();
        }, function(result){
          next();
        })
      }

    ], done)
  })

  it('should make creating different suppliers easy', function(done) {
    done();
  /*
    function loadsomedata(tagname){
      var query = digger.query();

      process.nextTick(function(){
        query.resolve(Container(tagname, {
          title:'hello'
        }))
      })

      return query;
    }

  
    
      create the supplier with it's base route
      
   
    var supplier = digger.supplier('warehouse:/api/products');
 */
    /*
    
      match the given selector to the incoming selector
      and trigger the handler if they match
      
    
    supplier.provide('product', function(req, res){
      var query = loadsomedata('product');

      query.then(function(result){
        res.send(result);
      }, function(error){
        res.sendError(error);
      })
    })

    supplier.append(function(req, res){
      var parent = req.digger.append.parent;
      var data = req.digger.append.data;
    })

    supplier.save(function(req, res){
      var container = req.digger.save.container;
      
    })

    supplier.del(function(req, res){
      var container = req.digger.del.container;
      
    })

*/

/*
    var db = digger.supplychain(supplier);

    var products = db('product');


      .ship(function(products){
        products.count().should.equal(1);
        products.tagname().should.equal('product');
        done();
      })
*/

  })


})