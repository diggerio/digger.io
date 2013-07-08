var digger = require('../../src');

var async = require('async');
var fs = require('fs');
var wrench = require('wrench');


/*

	make the database
	
*/
var database = digger.suppliers.simpledb({
	file:__dirname + '/cities.json'
})


/*

	create a handler
	
*/
var warehouse = digger.warehouse();

/*

	custom middleware
	
*/
warehouse.use(function(req, res, next){
	console.log('-------------------------------------------');
	console.dir(req.toJSON());
})

/*

	mount the database
	
*/
warehouse.use(database);

/*

	create a supplychain
	
*/
var container = digger.supplychain(database);

container('city')

.ship(function(results, res){
	console.log('-------------------------------------------');
	console.log('loaded: ' + results.count() + ' results');
	results.each(function(result){
		console.log('     ' + result);
	})
})