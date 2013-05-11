var digger = require('../src');
var data = require('../test/fixtures/data');
var async = require('async');
var fs = require('fs');


var simple = digger.container(data.simplexml);
var cities = digger.container(data.citiesxml);

fs.writeFileSync('../test/fixtures/simple.json', JSON.stringify(simple.toJSON(), null, 4), 'utf8');
fs.writeFileSync('../test/fixtures/cities.json', JSON.stringify(cities.toJSON(), null, 4), 'utf8');