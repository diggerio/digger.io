var digger = require('../src');
var data = require('./fixtures/data');
var async = require('async');
var fs = require('fs');

describe('simpledb', function(){

	it('should throw an error with no filepath', function(done) {
		try{
			var db = digger.supplier.simpledb();
		} catch(e){
			done();
		}
		
	})

	it('should load containers from file', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');
		var datac = digger.container(data);

		fs.writeFileSync('/tmp/diggertest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			filepath:'/tmp/diggertest.json'
		})

		var container = digger.supplychain(db);

		container('city').ship(function(cities, res){
			res.statusCode.should.equal(200);
			cities.count().should.equal(24);
			done();
		})

		
	})

	

})