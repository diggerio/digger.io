var digger = require('../src');
var data = require('./fixtures/data');

describe('container.routes', function(){

  it('should allow the diggerwarehouse property to be set', function() {
    var container = digger.create('test');

    container.diggerwarehouse('/api/v2');
    container.diggerwarehouse().should.equal('/api/v2');
  })

  it('should stamp the diggerwarehouse to any children appended', function() {
    var container = digger.create('test');
    container.diggerwarehouse('/api/v2');
    var child = digger.create('test');
    container.append(child);
    child.diggerwarehouse().should.equal('/api/v2');
  })  

})