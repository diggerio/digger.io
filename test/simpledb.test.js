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

	it('should perform a multi-stage selector and apply the limit', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');
		var datac = digger.container(data);

		fs.writeFileSync('/tmp/diggertest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			filepath:'/tmp/diggertest.json'
		})

		var container = digger.supplychain(db);

		container('city area:limit(3)').ship(function(areas, res){
			res.statusCode.should.equal(200);

			areas.eq(0).tag().should.equal('area');
			areas.count().should.equal(3);

			done();
		})
	})

	it('should perform a multi-stage selector and apply the first and last modifiers', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');
		var datac = digger.container(data);

		fs.writeFileSync('/tmp/diggertest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			filepath:'/tmp/diggertest.json'
		})

		var container = digger.supplychain(db);

		async.series([
			function(next){
				container('city area:first').ship(function(areas, res){
					res.statusCode.should.equal(200);

					areas.eq(0).tag().should.equal('area');
					areas.count().should.equal(1);

					next();
				})
			},

			function(next){
				container('city area:last').ship(function(areas, res){
					res.statusCode.should.equal(200);

					areas.eq(0).tag().should.equal('area');
					areas.count().should.equal(1);

					next();
				})
			}
		], done)
		
	})		

	it('should perform an append contract', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');
		var datac = digger.container(data);

		fs.writeFileSync('/tmp/diggerappendtest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			//url:'/db3',
			filepath:'/tmp/diggerappendtest.json'
		})

		//db.url().should.equal('/db3');

		var container = digger.supplychain('/', db);			

		container('city area:first').ship(function(areas, res){
			res.statusCode.should.equal(200);

			areas.count().should.equal(1);
			//areas.diggerwarehouse().should.equal('/db3');
			areas.diggerwarehouse().should.equal('/');

			var newthing = digger.create('house', {
				name:'Big Test House',
				height:123
			})

			var contract = areas.append(newthing);

			contract.getHeader('x-contract-type').should.equal('merge');

			var req = contract.body[0];

			//req.url.should.equal('/db3/' + areas.diggerid());
			req.url.should.equal('/' + areas.diggerid());

			contract.ship(function(){

				var db2 = digger.suppliers.simpledb({
					//url:'/db3',
					filepath:'/tmp/diggerappendtest.json'
				})

				var container2 = digger.supplychain('/', db);

				container2('house').ship(function(house){

					/*
					
						this turns out to be a very important test

						until the network is hooked up and requests are serialized -
						we end up passing the actual model pointer all the way back to the supplier

						the supplier appends the thing twice (front and back)

						the supplychain therefore does some serialization to things if they are not 
						throughput as strings already
						
					*/
					house.count().should.equal(1);
					done();
				})
				
			})

		})
		
	})	


})