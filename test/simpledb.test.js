var digger = require('../src');
var async = require('async');
var fs = require('fs');
var wrench = require('wrench');

var Bridge = require('digger-bridge');
var XML = require('digger-xml');

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
		var datac = Bridge.container(data);

		fs.writeFileSync('/tmp/diggertest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			file:'/tmp/diggertest.json'
		})

		var container = Bridge(db).connect();

		var contract = container('city');

		contract.ship(function(cities, res){
			res.statusCode.should.equal(200);
			cities.count().should.equal(8);
			done();
		})
		
	})


	it('should perform a multi-stage selector', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');
		var datac = Bridge.container(data);

		fs.writeFileSync('/tmp/diggertest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			file:'/tmp/diggertest.json'
		})

		var container = Bridge(db).connect();

		container('city area').ship(function(areas, res){
			res.statusCode.should.equal(200);

			areas.eq(0).tag().should.equal('area');
			areas.count().should.equal(14);

			done();
		})
	})


	it('should perform a self selector', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');
		var datac = Bridge.container(data);

		fs.writeFileSync('/tmp/diggertest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			file:'/tmp/diggertest.json'
		})

		var container = Bridge(db).connect();

		container('city:limit(1)').ship(function(results, res){

			results('self:tree').ship(function(tree, res){
				tree.diggerid().should.equal(results.diggerid());
				done();
			})

		})
	})

	it('should perform a multi-stage selector and return the count', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');
		var datac = Bridge.container(data);

		fs.writeFileSync('/tmp/diggertest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			file:'/tmp/diggertest.json'
		})

		var container = Bridge(db).connect();

		container('city area:count').ship(function(results, res){
			res.statusCode.should.equal(200);
			results.attr('count').should.equal(8);
			done();
		})
	})

	it('should perform a multi-stage selector and apply the limit', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');
		var datac = Bridge.container(data);

		fs.writeFileSync('/tmp/diggertest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			file:'/tmp/diggertest.json'
		})

		var container = Bridge(db).connect();

		container('city area:limit(3)').ship(function(areas, res){
			res.statusCode.should.equal(200);

			areas.eq(0).tag().should.equal('area');
			areas.count().should.equal(3);

			done();
		})
	})


	it('should perform a multi-stage selector and apply the first and last modifiers', function(done){
		
		var data = require(__dirname + '/fixtures/cities.json');
		var datac = Bridge.container(data);

		fs.writeFileSync('/tmp/diggertest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			file:'/tmp/diggertest.json'
		})

		var container = Bridge(db).connect();

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
		var datac = Bridge.container(data);

		fs.writeFileSync('/tmp/diggerappendtest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			//url:'/db3',
			file:'/tmp/diggerappendtest.json'
		})

		//db.url().should.equal('/db3');

		var container = Bridge(db).connect('/');

		container('city area:first').ship(function(areas, res){

			res.statusCode.should.equal(200);

			areas.count().should.equal(1);
			//areas.diggerwarehouse().should.equal('/db3');
			areas.diggerwarehouse().should.equal('/');

			var newthing = Bridge.container('house', {
				name:'Big Test House',
				height:123
			})

			var contract = areas.append(newthing);

			contract.headers["x-contract-type"].should.equal('merge');

			var req = contract.body[0];

			//req.url.should.equal('/db3/' + areas.diggerid());
			req.url.should.equal('/' + areas.diggerid());

			contract.ship(function(){

				newthing.diggerparentid().should.equal(areas.diggerid());
				
				var db2 = digger.suppliers.simpledb({
					//url:'/db3',
					file:'/tmp/diggerappendtest.json'
				})

				var container2 = Bridge(db2).connect('/');

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
		var datac = Bridge.container(data);

		fs.writeFileSync('/tmp/diggerappendtest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			url:'/db3',
			file:'/tmp/diggerappendtest.json'
		})

		db.url().should.equal('/db3');

		var container = Bridge(db).connect('/db3');

		container('city area:first').ship(function(areas, res){



			res.statusCode.should.equal(200);

			areas.count().should.equal(1);
			areas.diggerwarehouse().should.equal('/db3');

			areas.attr('testing', 123);

			var contract = areas.save();


			contract.headers['x-contract-type'].should.equal('merge');

			var req = contract.body[0];

			req.url.should.equal('/db3/' + areas.diggerid());
			req.method.should.equal('put');

			contract.ship(function(){
				var db2 = digger.suppliers.simpledb({
					url:'/db3',
					file:'/tmp/diggerappendtest.json'
				})

				var container2 = Bridge(db2).connect('/db3');

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

		var datac = Bridge.container(data);

		fs.writeFileSync('/tmp/diggerappendtest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			url:'/db3',
			file:'/tmp/diggerappendtest.json'
		})

		db.url().should.equal('/db3');

		var container = Bridge(db).connect('/db3');
		
		container('city area').ship(function(areas, res){
			res.statusCode.should.equal(200);

			areas.count().should.equal(14);
			areas.diggerwarehouse().should.equal('/db3');

			var contract = areas.eq(3).remove();

			contract.headers['x-contract-type'].should.equal('merge');

			var req = contract.body[0];

			req.url.should.equal('/db3/' + areas.eq(3).diggerid());
			req.method.should.equal('delete');

			contract.ship(function(){

				var db2 = digger.suppliers.simpledb({
					url:'/db3',
					file:'/tmp/diggerappendtest.json'
				})

				var container2 = Bridge(db2).connect('/db3');

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

		var supplychain = Bridge(supplier);

		var db1 = supplychain.connect('/json/apples');
		var db2 = supplychain.connect('/json/oranges');

		async.series([

			function(next){

				var append = supplychain.merge([
					db1.append(Bridge.container('fruit').addClass('apple')),
					db2.append(Bridge.container('fruit').addClass('orange'))
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
				.expect('containers')
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

	it('should provide several databases in provider mode', function(done){
		
		var folder = '/tmp/diggersimpletests';

		wrench.rmdirSyncRecursive(folder, true);

		var supplier = digger.suppliers.simpledb({
			
			url:'/json',
			database:folder
			
		})

		if(!fs.existsSync(folder)){
			throw new Error('The supplier should have created the folder')
		}		

		var supplychain = Bridge(supplier);

		var db1 = supplychain.connect('/json/apples/grannysmith');
		var db2 = supplychain.connect('/json/oranges/jaffa');

		async.series([

			function(next){

				var append = supplychain.merge([
					db1.append(Bridge.container('fruit').addClass('apple')),
					db2.append(Bridge.container('fruit').addClass('orange'))
				]).ship(function(){
					
					fs.existsSync('/tmp/diggersimpletests/apples/grannysmith.json').should.equal(true);
					fs.existsSync('/tmp/diggersimpletests/oranges/jaffa.json').should.equal(true);

					next();
				})

				
			},
			
			function(next){
				supplychain.merge([
					db1('fruit'),
					db2('fruit')
				])
				.expect('containers')
				.ship(function(fruit){
					fruit.count().should.equal(2);
					fruit.find('.apple').count().should.equal(1);
					next();
				})
			}

		], function(){

			//wrench.rmdirSyncRecursive(folder, true);
			done();
		})
		


		
	})


	it('should create proper digger.diggerpath properties', function(done){
		
		var folder = '/tmp/diggersimpletests';

		wrench.rmdirSyncRecursive(folder, true);

		var supplier = digger.suppliers.simpledb({
			
			url:'/json',
			database:folder
			
		})

		if(!fs.existsSync(folder)){
			throw new Error('The supplier should have created the folder')
		}		

		var supplychain = Bridge(supplier);

		var db1 = supplychain.connect('/json/apples/grannysmith');

		async.series([

			function(next){

				db1
					.append(Bridge.container('fruit').addClass('apple'))
					.ship(function(){
						next();
					})

			},

			function(next){

				db1
					.append(Bridge.container('fruit').addClass('orange'))
					.ship(function(){
						next();
					})

			},

			function(next){
				db1('*').ship(function(things){
					things.eq(0).digger('rootposition').should.equal(1);
					things.eq(0).digger('diggerpath')[0].should.equal(1);
					things.eq(1).digger('rootposition').should.equal(2);
					things.eq(1).digger('diggerpath')[0].should.equal(2);
					next();
				})
			}

		], function(){

			//wrench.rmdirSyncRecursive(folder, true);
			done();
		})
		


		
	})

	it('should branch to several databases in provider mode', function(done){
		
		var folder = '/tmp/diggersimpletests';

		wrench.rmdirSyncRecursive(folder, true);

		var supplier = digger.suppliers.simpledb({
			
			url:'/json',
			database:folder
			
		})


		if(!fs.existsSync(folder)){
			throw new Error('The supplier should have created the folder')
		}		

		var supplychain = Bridge(supplier);

		var uk = supplychain.connect('/json/uk/fruit');
		var france = supplychain.connect('/json/france/orchard');

		var ukfruit = Bridge.container(XML.parse('<folder><fruit name="Apple" class="green" /><fruit name="Pear" class="green" /><fruit name="Orange" class="orange" /></folder>'));
		var francefruit = Bridge.container(XML.parse('<folder><fruit name="Lime" class="green" /><fruit name="Grape" class="green" /><fruit name="Lemon" class="yellow" /></folder>'));

		var linkfolder = Bridge.container('folder', {
			name:'French Fruit'
		}).addBranch(france)

		ukfruit.add(linkfolder);

		async.series([

			function(next){


				var append = supplychain.merge([
					uk.append(ukfruit),
					france.append(francefruit)
				]).ship(function(){
					
					fs.existsSync('/tmp/diggersimpletests/uk/fruit.json').should.equal(true);
					fs.existsSync('/tmp/diggersimpletests/france/orchard.json').should.equal(true);

					setTimeout(function(){
						next();
					}, 50)
					
				})

				
			},
			
			function(next){
				uk('folder fruit.green').debug().ship(function(fruit){
					fruit.count().should.equal(4);
					next();
				})
			}

		], function(){

			//wrench.rmdirSyncRecursive(folder, true);
			done();
		})
		


		
	})

})