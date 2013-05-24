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
			cities.count().should.equal(8);
			done();
		})

		
	})


	it('should perform a multi-stage selector', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');
		var datac = digger.container(data);

		fs.writeFileSync('/tmp/diggertest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			filepath:'/tmp/diggertest.json'
		})

		var container = digger.supplychain(db);

		container('city area').ship(function(areas, res){
			res.statusCode.should.equal(200);

			areas.eq(0).tag().should.equal('area');
			areas.count().should.equal(14);

			done();
		})
	})

/*
	it('should perform an append contract', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');
		var datac = digger.container(data);

		fs.writeFileSync('/tmp/diggerappendtest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			filepath:'/tmp/diggerappendtest.json'
		})

		var container = digger.supplychain(db);

		container('city area').ship(function(areas, res){
			res.statusCode.should.equal(200);

			var testarea = areas.eq(0);

			var newthing = digger.create('house', {
				name:'Big Test House',
				height:123
			})

			testarea.append(newthing).ship(function(){

			})
		})

		
	})	
*/

})