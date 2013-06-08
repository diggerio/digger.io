var digger = require('../src');
var data = require('./fixtures/data');
var async = require('async');
var fs = require('fs');
var wrench = require('wrench');

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
			file:'/tmp/diggertest.json'
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
			file:'/tmp/diggertest.json'
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
			file:'/tmp/diggertest.json'
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
			file:'/tmp/diggertest.json'
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
			file:'/tmp/diggerappendtest.json'
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

				newthing.diggerparentid().should.equal(areas.diggerid());
				
				var db2 = digger.suppliers.simpledb({
					//url:'/db3',
					file:'/tmp/diggerappendtest.json'
				})

				var container2 = digger.supplychain('/', db2);

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

	it('should perform a save contract', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');
		var datac = digger.container(data);

		fs.writeFileSync('/tmp/diggerappendtest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			url:'/db3',
			file:'/tmp/diggerappendtest.json'
		})

		db.url().should.equal('/db3');

		var container = digger.supplychain('/db3', db);

		container('city area:first').ship(function(areas, res){
			res.statusCode.should.equal(200);

			areas.count().should.equal(1);
			areas.diggerwarehouse().should.equal('/db3');

			areas.attr('testing', 123);

			var contract = areas.save();

			contract.getHeader('x-contract-type').should.equal('merge');

			var req = contract.body[0];

			req.url.should.equal('/db3/' + areas.diggerid());
			req.method.should.equal('put');

			contract.ship(function(){

				var db2 = digger.suppliers.simpledb({
					url:'/db3',
					file:'/tmp/diggerappendtest.json'
				})

				var container2 = digger.supplychain('/db3', db2);

				/*
				
					this also tests that the simpledb is consistent with ids
					
				*/
				container2('=' + areas.diggerid()).ship(function(areas){

					areas.attr('testing').should.equal(123);
					done();
				})
				
			})

		})
		
	})	

	it('should perform a delete contract', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');

		var datac = digger.container(data);

		fs.writeFileSync('/tmp/diggerappendtest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			url:'/db3',
			file:'/tmp/diggerappendtest.json'
		})

		db.url().should.equal('/db3');

		var container = digger.supplychain('/db3', db);

		container('city area').ship(function(areas, res){
			res.statusCode.should.equal(200);

			areas.count().should.equal(14);
			areas.diggerwarehouse().should.equal('/db3');

			var contract = areas.eq(3).remove();

			contract.getHeader('x-contract-type').should.equal('merge');

			var req = contract.body[0];

			req.url.should.equal('/db3/' + areas.eq(3).diggerid());
			req.method.should.equal('delete');

			contract.ship(function(){

				var db2 = digger.suppliers.simpledb({
					url:'/db3',
					file:'/tmp/diggerappendtest.json'
				})

				var container2 = digger.supplychain('/db3', db2);

				/*
				
					this also tests that the simpledb is consistent with ids
					
				*/
				container2('city area').ship(function(areas){

					areas.count().should.equal(13);
					done();

				})
				
			})

		})
		
	})	

	it('should complain if the folder does not exist', function(done){
		
		var folder = '/tmp/someplace43253498fv';

		try{
			var supplier = digger.suppliers.simpledb({
				folderpath:folder
			})
		} catch(e){
			done();
		}
		
	})

	it('should create the folder if autocreate is set', function(){
		
		var folder = '/tmp/someplace43253498fv';

		wrench.rmdirSyncRecursive(folder, true);

		var supplier = digger.suppliers.simpledb({
			
			folder:folder

		})

		if(!fs.existsSync(folder)){
			throw new Error('The supplier should have created the folder')
		}
		
		
	})

	it('should provide several resources in provider mode', function(done){
		
		var folder = '/tmp/diggersimpletests';

		wrench.rmdirSyncRecursive(folder, true);

		var supplier = digger.suppliers.simpledb({
			
			url:'/json',
			folder:folder
			
		})

		if(!fs.existsSync(folder)){
			throw new Error('The supplier should have created the folder')
		}		

		var supplychain = digger.supplychain(supplier);

		var db1 = supplychain.connect('/json/apples');
		var db2 = supplychain.connect('/json/oranges');

		async.series([

			function(next){

				var append = supplychain.merge([
					db1.append(digger.create('fruit').addClass('apple')),
					db2.append(digger.create('fruit').addClass('orange'))
				]).ship(function(){
					
					fs.existsSync('/tmp/diggersimpletests/apples.json').should.equal(true);
					fs.existsSync('/tmp/diggersimpletests/oranges.json').should.equal(true);

					next();
				})

				
			},
			
			function(next){
				supplychain.merge([
					db1('fruit'),
					db2('fruit')
				])
				.expect('digger/containers')
				.ship(function(fruit){
					fruit.count().should.equal(2);
					fruit.find('.apple').count().should.equal(1);
					next();
				})
			}

		], function(){

			wrench.rmdirSyncRecursive(folder, true);
			done();
		})
		


		
	})

/*
	it('should provide several databases in provider mode', function(done){
		
		var folder = '/tmp/diggersimpletestsfolder';

		wrench.rmdirSyncRecursive(folder, true);

		var supplier = digger.suppliers.simpledb.file({
			
			url:'/json',
			folder:folder,
			provide:'database',
			autocreate:true
			
		})

		if(!fs.existsSync(folder)){
			throw new Error('The supplier should have created the folder')
		}		

		var supplychain = digger.supplychain(supplier);

		var db1 = supplychain.connect('/json/apples/db1');
		var db2 = supplychain.connect('/json/oranges/db2');

		async.series([

			function(next){

				var append = supplychain.merge([
					db1.append(digger.create('fruit').addClass('apple')),
					db2.append(digger.create('fruit').addClass('orange'))
				]).ship(function(){
					
					fs.existsSync('/tmp/diggersimpletests/apples/db1.json').should.equal(true);
					fs.existsSync('/tmp/diggersimpletests/oranges/db2.json').should.equal(true);

					next();
				})

				
			},
			
			function(next){
				supplychain.merge([
					db1('fruit'),
					db2('fruit')
				])
				.expect('digger/containers')
				.ship(function(fruit){
					fruit.count().should.equal(2);
					fruit.find('.apple').count().should.equal(1);
					next();
				})
			}

		], function(){

			wrench.rmdirSyncRecursive(folder, true);
			done();
		})
		


		
	})
*/
})