var digger = require('../src');
var data = require('../test/fixtures/data');

var parent = digger.create('product', {
      price:100,
      address:{
        postcode:'apples'
      }
    })

    var child1 = digger.create('caption', {
      test:'hello1'
    }).addClass('apples')

    var child2 = digger.create('caption', {
      test:'hello2'
    }).addClass('oranges')

    parent.append([child1, child2]);



    console.log('-------------------------------------------');
console.log(JSON.stringify(parent.toJSON(), null, 4));