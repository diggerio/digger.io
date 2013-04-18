var digger = require('../src');
var data = require('./fixtures/data');

describe('supplychain', function(){

  it('should provide a connection from client to server', function(done) {

    var warehouse = digger.warehouse(function(req, res){
      res.send('hello world');
    })


  })

})
