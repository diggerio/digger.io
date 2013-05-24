var digger = require('../src');
var data = require('../test/fixtures/data');
var async = require('async');
var fs = require('fs');


		var data = require(__dirname + '/../test/fixtures/cities.json');
		var datac = digger.container(data);

		fs.writeFileSync('/tmp/diggertest.json', JSON.stringify(datac.toJSON(), null, 4), 'utf8');
		
		var db = digger.suppliers.simpledb({
			filepath:'/tmp/diggertest.json'
		})

		var container = digger.supplychain(db);

		container('city area').ship(function(areas, res){
			
			areas.each(function(area){
				console.dir(area.attr('name') + ' = ' + area.diggerid());
			})
			

		})