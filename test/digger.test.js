var digger = require('../src');
var data = require('./fixtures/data');

describe('digger', function(){

  it('should expose the correct version number', function() {
    var settings = require(__dirname + '/../package.json');
    console.log('-------------------------------------------');
    console.dir(digger.version);
    digger.version.should.equal(settings.version);
  })
})
