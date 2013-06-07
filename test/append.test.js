var digger = require('../src');
var async = require('async');

describe('contract', function(){

  it('should inject the diggerwarehouse to children recursivley', function() {

    var base = digger.create('top', {
      _digger:{
        diggerpath:[4,5],
        diggerwarehouse:'/top/middle/bottom'
      },
      name:'test'
    })

    var children = digger.create([{
      name:'house',
      _children:[{
        name:'room'
      }]
    }])

    base.append(children);

    children.recurse(function(des){
      des.diggerwarehouse().should.equal('/top/middle/bottom');
    })
    
  })

})
