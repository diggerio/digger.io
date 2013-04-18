var digger = require('../src');
var data = require('./fixtures/data');

describe('warehouse', function(){

  it('should complete a request response cycle', function(done) {

    var warehouse = digger.warehouse();

    warehouse.use(function(req, res){
      res.send(req.query.data);
    })

    var req = digger.request({
      method:'get',
      query:{
        data:10
      }
    })

    var res = digger.response(function(data){
      data.should.equal(10);
      done();
    })

    warehouse(req, res);

  })

  it('should route based on method', function(done){
    var warehouse = digger.warehouse();

    warehouse.get(function(req, res){
      res.send('should not happen');
    })

    warehouse.post(function(req, res){
      req.send(req.body);
    })

    var req = digger.request({
      method:'post',
      body:10
    })

    var res = digger.response(function(data){
      data.should.equal(10);
      done();
    })

    warehouse(req, res);
  })

  it('should route based on protocol', function(done){
    var warehouse = digger.warehouse();

    warehouse.http('/a/path', function(req, res){
      res.send('should not happen');
    })

    warehouse.zmq('/another/path', function(req, res){
      res.send(10);
    })

    var req = digger.request({
      method:'get',
      url:'zmq://warehouse.digger',
      body:10
    })

    var res = digger.response(function(data){
      data.should.equal(10);
      done();
    })

    warehouse(req, res);
  })

  it('should route based on path', function(done){
    var warehouse = digger.warehouse();

    warehouse.use('/a/path', function(req, res){
      res.send('should not happen');
    })

    warehouse.use('/another/path', function(req, res){
      res.send(10);
    })

    var req = digger.request({
      method:'get',
      url:'zmq://warehouse.digger/another/path',
      body:10
    })

    var res = digger.response(function(data){
      data.should.equal(10);
      done();
    })

    warehouse(req, res);
  })

  it('should route based on globs and regexps', function(done){
    var warehouse = digger.warehouse();

    warehouse.use('/a/path', function(req, res){
      res.send('should not happen');
    })

    warehouse.axon('/another/path/:id', function(req, res){
      res.send(req.params.id);
    })

    var req = digger.request({
      method:'get',
      url:'axon://warehouse.digger/another/path/123'
    })

    var res = digger.response(function(data){
      data.should.equal('123');
      done();
    })

    warehouse(req, res);
  })

  it('should chunk off the path as layers are matched', function(done){
    var warehouse = digger.warehouse();
    var subwarehouse = digger.warehouse();

    subwarehouse.use(function(req, res){
      req.getHeader('x-original-path').should.equal('/a/toppath/123');
      res.send(req.path);
    })

    warehouse.use('/a/toppath', subwarehouse);

    var req = digger.request({
      method:'get',
      url:'axon://warehouse.digger/a/toppath/123'
    })

    var res = digger.response(function(data){
      data.should.equal('123');
      done();
    })

    warehouse(req, res);
  })
  
  it('should emit events as requests are handled', function(done){
    var warehouse = digger.warehouse();

    warehouse.use(function(req, res){
      res.send('ok');
    })

    var hitreq = false;

    warehouse.on('request', function(req){
      hitreq = true;
    })

    warehouse.on('response', function(req){
      hitreq.should.equal(true);
      res.query.test.should.equal(10);
      done();
    })

    var req = digger.request({
      method:'get',
      url:'axon://warehouse.digger/a/toppath/123'
    })

    var res = digger.response(function(data){
      
    })

    warehouse(req, res);
  })
})
