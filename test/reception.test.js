var digger = require('../src');
var data = require('./fixtures/data');
var async = require('async');
var fs = require('fs');
var wrench = require('wrench');

describe('reception', function(){

	it('should host several suppliers and route to them', function(done){
		done();
/*
		function makeselect(tag){
			return function(select_query, promise){
				promise.resolve({
					_digger:{
						tag:tag
					}
				})
			}
		}

		var supplierA = digger.supplier({
			url:'/a'
		})

		var supplierB = digger.supplier({
			url:'/b'
		})

		supplierA.select(makeselect('a'));
		supplierB.select(makeselect('b'));

		var reception = digger.reception();

		})

		reception.use(function(req, res, next){

		})






		var folder = '/tmp/diggersimpletests';

		wrench.rmdirSyncRecursive(folder, true);

		var supplier = digger.suppliers.simpledb({
			
			url:'/json',
			database:folder
			
		})


		if(!fs.existsSync(folder)){
			throw new Error('The supplier should have created the folder')
		}		

		var supplychain = digger.supplychain('/', supplier);

		var uk = supplychain.connect('/json/uk/fruit');
		var france = supplychain.connect('/json/france/orchard');

		var ukfruit = digger.create('<folder><fruit name="Apple" class="green" /><fruit name="Pear" class="green" /><fruit name="Orange" class="orange" /></folder>');
		var francefruit = digger.create('<folder><fruit name="Lime" class="green" /><fruit name="Grape" class="green" /><fruit name="Lemon" class="yellow" /></folder>');

		var linkfolder = digger.create('folder', {
			name:'French Fruit'
		}).branchto(france)

		ukfruit.add(linkfolder);

		async.series([

			function(next){


				var append = supplychain.merge([
					uk.append(ukfruit),
					france.append(francefruit)
				]).ship(function(){
					
					fs.existsSync('/tmp/diggersimpletests/uk/fruit.json').should.equal(true);
					fs.existsSync('/tmp/diggersimpletests/france/orchard.json').should.equal(true);

					next();
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
		

*/
		
	})

})