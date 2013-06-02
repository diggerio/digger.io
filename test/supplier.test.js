var digger = require('../src');
var data = require('./fixtures/data');
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

  it('should extract the context for GET requests', function(done) {

    function runrequest(req, throwfn, callbackfn){
      
      var supplier = digger.supplier();

      supplier.select(function(select_query, promise){
        throwfn(select_query);
        process.nextTick(function(){
          promise.resolve({
            ok:true
          })  
        })
      })

      req = digger.request(req);
      var res = digger.response(true);

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
          result[0].ok.should.equal(true);
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

          result[0].ok.should.equal(true);
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
          result[0].ok.should.equal(true);
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
          result[0].ok.should.equal(true);
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
          result[0].ok.should.equal(true);

          next();
        })
      }

    ], done)

  })

  it('should run contracts from multiple selectors', function(done) {
    function runrequest(req, throwfn, callbackfn){
      
      var supplier = digger.supplier();

      supplier.select(function(select_query, promise){
        throwfn(select_query);
        process.nextTick(function(){
          promise.resolve({
            ok:true
          })
        })
      })

      req = digger.request(req);
      var res = digger.response(true);

      res.on('success', callbackfn);
      res.on('failure', function(error){
        throw new Error('request error: ' + error);
      })

      supplier(req, res);
    }

    var hit = {};

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
      done();
    })
      
  })

  it('should make creating different suppliers easy', function(done) {

    var supplier = digger.supplier();

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

    var res = digger.response(true);

    res.on('success', function(){
      res.body.should.be.a('array');
      res.body[0].answer.should.equal(10);
      done();
    })

    res.on('failure', function(error){
      throw new Error('request error: ' + error);
    })

    supplier(req, res);
  })

  it('should accept a stack location as an argument', function() {
    var supplier = digger.supplier('warehouse:/api/products');

    supplier.url().should.equal('warehouse:/api/products');
    supplier.settings.attr('url').should.equal('warehouse:/api/products');
  })
/*

  stack location are saved with containers


  it('should stamp the stack locations as the diggerwarehouse for container data returned', function(done) {

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

    var res = digger.response(true);

    res.on('success', function(){
      res.getHeader('content-type').should.equal('digger/containers');
      res.body.should.be.a('array');
      res.body[0]._digger.diggerwarehouse.should.equal('warehouse:/api/products');
      done();
    })

    supplier(req, res);

  })
*/
  it('should return container data', function(done) {

    var supplier = digger.supplier();

    supplier.select(function(select_query, promise){
      promise.resolve({
        name:'test'
      })
    })

    req = digger.request({
      url:'/product.onsale.test',
      method:'get'
    })

    var res = digger.response(true);

    res.on('success', function(){
      res.getHeader('content-type').should.equal('digger/containers');
      res.body.should.be.a('array');
      done();
    })

    supplier(req, res);

  })



  it('should handle append operations', function(done) {

    var supplier = digger.supplier({
      
    })

    supplier.append(function(append_query, promise, next){

      append_query.selector.diggerid.should.equal('12345');
      append_query.body.should.equal(20);
      
      promise.resolve(45);
    })

    req = digger.request({
      method:'post',
      url:'/12345',
      body:20
    })

    var res = digger.response(true);
    res.on('success', function(answer){
      answer.should.equal(45);
      done();
    })

    supplier(req, res);
  })

  it('should handle save operations', function(done) {
    var supplier = digger.supplier({
      
    })

    supplier.save(function(append_query, promise, next){

      append_query.selector.diggerid.should.equal('12345');
      append_query.body.should.equal(20);
      
      promise.resolve(45);
    })

    req = digger.request({
      method:'put',
      url:'/12345',
      body:20
    })

    var res = digger.response(true);
    res.on('success', function(answer){
      answer.should.equal(45);
      done();
    })

    supplier(req, res);
  })

  it('should handle delete operations', function(done) {
    var supplier = digger.supplier({
      
    })

    supplier.remove(function(append_query, promise, next){

      append_query.selector.diggerid.should.equal('12345');
      append_query.body.should.equal(20);
      
      promise.resolve(45);
    })

    req = digger.request({
      method:'delete',
      url:'/12345',
      body:20
    })

    var res = digger.response(true);
    res.on('success', function(answer){
      answer.should.equal(45);
      done();
    })

    supplier(req, res);
  })

  it('should emit append / save and remove events', function(done) {

    var hit = {};
    var supplier = digger.supplier({
      
    })

    supplier.append(function(append_query, promise, next){
      promise.resolve(45);
    })
    supplier.save(function(append_query, promise, next){
      promise.resolve(45);
    })
    supplier.remove(function(append_query, promise, next){
      promise.resolve(45);
    })

    supplier.on('append', function(req, res){
      hit.append = true;
      req.method.should.equal('post');
      req.body.should.equal(20);
      res.body.should.equal(45);
    })

    supplier.on('save', function(req, res){
      hit.save = true;
      req.method.should.equal('put');
      req.body.should.equal(20);
      res.body.should.equal(45);
    })

    supplier.on('remove', function(req, res){
      hit.remove = true;
      req.method.should.equal('delete');
      res.body.should.equal(45);
    })

    async.series([
      function(next){
        var req = digger.request({
          method:'post',
          url:'/12345',
          body:20
        })

        var res = digger.response(true);
        res.on('success', function(answer){
          answer.should.equal(45);
          next();
        })

        supplier(req, res);
      },

      function(next){

        var req = digger.request({
          method:'put',
          url:'/12345',
          body:20
        })

        var res = digger.response(true);
        res.on('success', function(answer){
          answer.should.equal(45);
          next();
        })

        supplier(req, res);
      },

      function(next){

        var req = digger.request({
          method:'delete',
          url:'/12345'
        })

        var res = digger.response(true);
        res.on('success', function(answer){

          answer.should.equal(45);

          setTimeout(function(){
            next();
          }, 10);
        })

        supplier(req, res);
      }
    ], function(){

      hit.append.should.equal(true);
      hit.save.should.equal(true);
      hit.remove.should.equal(true);

      done();
    })
  })

  it('should pipe specialized selectors to each other', function(done) {

    var supplier = digger.supplier();

    supplier.specialize('product', function(select_query, promise){
      promise.resolve({
        name:'product',
        _digger:{
          diggerid:2323,
          left:10,
          right:12          
        }
      })
    })

    supplier.specialize('caption', function(select_query, promise){      

      select_query.context.should.be.a('array');
      select_query.context.length.should.equal(1);


      var parentmeta = select_query.context[0];
      parentmeta.diggerid.should.equal(2323);
      parentmeta.left.should.equal(10);

      promise.resolve({
        name:'caption'
      })
    })

    req = digger.request({
      url:'/product/caption',
      method:'get'
    })

    var res = digger.response(true);

    res.on('success', function(){
      res.getHeader('content-type').should.equal('digger/containers');
      res.body.should.be.a('array');
      res.body[0].name.should.equal('caption');
      done();
    })

    supplier(req, res);

  })


})