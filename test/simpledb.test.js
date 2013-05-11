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
		fs.createReadStream(__dirname + '/fixtures/cities.json').pipe(fs.createWriteStream('/tmp/diggertest.json'));

		var db = digger.suppliers.simpledb({
			filepath:'/tmp/diggertest.json'
		})

		var container = digger.supplychain(db);

		container('city').ship(function(cities){
			console.log('-------------------------------------------');
			console.dir(cities.toJSON());
		})
	})

	

})