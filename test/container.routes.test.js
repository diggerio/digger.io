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

  it('allow branches to be added and removed', function() {
    var container = digger.create('test');
    container.diggerwarehouse('/api/v2');
    var container2 = digger.create('test2');
    container.diggerwarehouse('/api/v2');
    var other = digger.create('other');
    other.addBranch(container);
    other.addBranch(container2);
    other.diggerbranch().should.be.a('array');
    other.diggerbranch().length.should.equal(2);
    other.diggerbranch()[0].should.equal(container.diggerurl());
    other.removeBranch(container2);
    other.diggerbranch().length.should.equal(1);

  })

})