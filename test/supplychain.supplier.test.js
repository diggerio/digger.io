var digger = require('../src');
var async = require('async');
var Bridge = require('digger-bridge');

describe('supplychain.supplier', function(){

  it('should allow several existing contracts to be combined as merge', function(){

    var supplier = digger.supplier({
      url:'/api'
    })

    var supplychain = Bridge(supplier);

    var db1 = supplychain.connect('/json/apples');
    var db2 = supplychain.connect('/json/oranges');

    var append = supplychain.merge([
      db1.append(Bridge.container('fruit').addClass('apple')),
      db2.append(Bridge.container('fruit').addClass('orange'))
    ])

    append.body.length.should.equal(2);
    append.body[0].headers['x-contract-type'].should.equal('merge');
    append.body[0].body.length.should.equal(1);
    append.body[0].body[0].url.should.equal('/json/apples');

        
  })

})
