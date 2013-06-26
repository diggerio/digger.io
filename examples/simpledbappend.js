var digger = require('../src');
var data = require('../test/fixtures/data');
var async = require('async');
var fs = require('fs');
var wrench = require('wrench');

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