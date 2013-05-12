var digger = require('../src');
var data = require('../test/fixtures/data');
var async = require('async');
var fs = require('fs');

var db = digger.suppliers.simpledb({
	filepath:'/tmp/diggertest.json'
})

var container = digger.supplychain(db);

container('city').ship(function(cities, res){	
	console.dir(cities.count());
})