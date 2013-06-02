var _ = require('lodash');
var digger = require('../src');
var data = require('./fixtures/data');

describe('selector', function(){

	it('should produce the correct number of ruleSets', function() {
		var parsed = digger.selector('product[price<100], city');
		parsed.phases.should.be.a('array');
		parsed.phases.length.should.equal(2);
  })

  it('should contain the original selector string', function() {
		var selector = 'product[price<=100], city';
		var parsed = digger.selector(selector);
		parsed.string.should.equal(selector);
  })

  it('should allow any modifier', function() {
		var selector = 'city:somemodifier';

		var parsed = digger.selector(selector).phases[0][0];

		parsed.modifier.somemodifier.should.equal(true);

		var selector2 = 'city:somemodifier2(45)';

		var parsed2 = digger.selector(selector2).phases[0][0];

		parsed2.modifier.somemodifier2.should.equal(45);
  })

  it('should produce a rule with the correct attributes', function(){
		var selector = 'product[price<=100] > caption.big';

		var parsed = digger.selector(selector);
		var phase = parsed.phases[0];

		var first = phase[0];
		var second = phase[1];

		first.tag.should.equal('product');
		first.attr[0].field.should.equal('price');
		first.attr[0].operator.should.equal('<=');
		first.attr[0].value.should.equal('100');

		second.tag.should.equal('caption');
		second.class.big.should.equal(true);
		second.splitter.should.equal('>');
  })
})
