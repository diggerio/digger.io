var digger = require('../src');
var data = require('./fixtures/data');

describe('container', function(){

  it('should create an empty container', function() {
    var container = digger.create();

    container.length.should.equal(0);
  })

  it('should be a function', function() {
    var container = digger.create();

    container.should.be.a('function');
  })

  it('should build from basic data', function() {

    var test = digger.create('product', {
      price:100,
      address:{
        postcode:'apples'
      }
    })

    test.count().should.equal(1);
    test.attr('price').should.equal(100);
    test.attr('address.postcode').should.equal('apples');
    test.tag().should.equal('product');

  })

  it('should ensure a digger id', function() {
    var test = digger.create('product', {
      price:100,
      address:{
        postcode:'apples'
      }
    })

    test.diggerid().should.be.a('string');
    test.diggerid().length.should.equal(32);
  })

  it('should have the correct underlying model structure', function() {

    var test = digger.create('product', {
      price:100,
      address:{
        postcode:'apples'
      }
    })

    test.models.should.be.a('array');
    test.models[0].should.be.a('object');
    test.models[0].price.should.equal(100);
    test.models[0].__digger__.should.be.a('object');
    test.models[0].__digger__.meta.class.should.be.a('array');
    test.models[0].__digger__.children.should.be.a('array');

  })

  it('XML should have the correct underlying model structure', function() {

    var test = digger.create('<product price="100" class="red" />');

    test.models.should.be.a('array');
    test.models[0].should.be.a('object');
    test.models[0].price.should.equal("100");
    test.models[0].__digger__.should.be.a('object');
    test.models[0].__digger__.meta.class.should.be.a('array');
    test.models[0].__digger__.children.should.be.a('array');
    test.hasClass('red').should.equal(true);

  })

  it('should allow the manipulation of the underlying data', function(){

    var test = digger.create('product', {
      price:100,
      address:{
        postcode:'apples'
      }
    })

    test.addClass('apples');
    test.classnames().length.should.equal(1);
    test.hasClass('apples').should.equal(true);
    test.hasClass('oranges').should.equal(false);
    test.addClass('oranges');
    test.classnames().length.should.equal(2);
    test.hasClass('oranges').should.equal(true);
    test.removeClass('apples');

    test.classnames().length.should.equal(1);
    test.hasClass('apples').should.equal(false);

    test.id('hello');
    test.id().should.equal('hello');
    test.get(0).__digger__.meta.id.should.equal('hello');

    test.tag().should.equal('product');

    test.attr('some.deep.attr', 23);

    test.attr('some').should.be.a('object');
    test.attr('some.deep').should.be.a('object');
    test.attr('some.deep.attr').should.equal(23);

    var deep = test.attr('some.deep');
    deep.attr.should.be.a('number');
    deep.attr.should.equal(23);
  })  


  it('should build from XML', function(){
    var test = digger.create(data.simplexml);

    test.count().should.equal(1);
    test.tag().should.equal('folder');
  })

  it('should export to JSON and XML', function(){
    var test = digger.create(data.simplexml);

    test.toJSON().should.be.a('array');
    test.toJSON().length.should.equal(1);
    test.toJSON()[0].__digger__.meta.should.be.a('object');

    var xml = test.toXML();
    xml.should.be.a('string');
    xml.charAt(0).should.equal('<');
  })

  it('should be able to access single containers via eq', function(){
    var test = digger.create(data.citiesxml);

    test.count().should.equal(1);
    test.eq(0).should.be.a('function');
    test.eq(0).count().should.equal(1);
    test.eq(0).tag().should.equal('folder');

  })

  it('should be able to access single models via get', function(){
    var test = digger.create(data.citiesxml);

    test.count().should.equal(1);
    test.get(0).should.be.a('object');
    test.get(0).__digger__.meta.id.should.equal('places');

  })


  it('should change the attributes of all models', function(){

    var test = digger.create(data.citiesxml);

    test.children().attr('test', 23);
    test.children().eq(0).attr('test').should.equal(23);
    test.children().eq(1).attr('test').should.equal(23);
  })

  it('should get the attribute for the first model', function(){

    var test = digger.create(data.citiesxml);

    var uk = test.children();
    var name = uk.attr('name');

    name.should.be.a('string');
    name.should.equal('UK');
  })

  it('should be able access children', function(){

    var test = digger.create(data.citiesxml);

    test.children().count().should.equal(2);
    test.children().eq(1).hasClass('big').should.equal(true);
  })

  it('should be able iterate models', function(){

    var test = digger.create(data.citiesxml);
    var childcounter = 0;
    test.children().each(function(container){
      childcounter++;
    })

    childcounter.should.equal(2);
  })

  it('should be able to map containers', function(){

    var test = digger.create(data.citiesxml);

    var values = test.children().map(function(container){
      return container.attr('name');
    })

    values.length.should.equal(2);
    values[0].should.equal('UK');
    values[1].should.equal('Scotland');
  })

  it('should append and find children', function() {
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

    parent.children().count().should.equal(2);
    parent.first().tag().should.equal('product');
    parent.find('.apples').tagname().should.equal('caption');
    parent.find('.oranges').attr('test').should.equal('hello2');
  })

  it('should run selectors on local data', function() {

    var test = digger.create(data.citiesxml);

    test.find('city.south').length.should.equal(3);
    test.find('country[name^=U] > city.south area.poor').length.should.equal(3);

  })
  
  it('should emit events', function(done) {
    var test = digger.create();

    test.on('hello', done);
    test.emit('hello');
  })
})
