var digger = require('../../src');

var async = require('async');
var fs = require('fs');
var wrench = require('wrench');


var citiesxml = [ 
  '<folder id="places" class="hello">',
  '  <country class="big apples" name="UK">',
  '    <city class="south" name="Bristol" team="Bristol City">',
  '      <area class="poor" name="St. Pauls" population="103" />',
  '      <area class="rich" name="Redland" population="79" />',
  '      <area class="poor" name="Easton" population="38" />',
  '      <area class="rich" name="Hotwells" population="320" />',
  '    </city>',
  '    <city class="south" name="London" team="Arsenal">',
  '      <area class="rich" name="Westminster" population="298" />',
  '      <area class="rich" name="Ealing" population="98" />',
  '      <area class="poor" name="Woolwich" population="68" />',
  '    </city>',
  '    <city class="midlands" name="Birmingham" team="Ason Villa">',
  '      <area  class="rich" name="Edgbaston" population="183" />',
  '    </city>',
  '    <city class="midlands" name="Nottingham" team="Nottingham Forest">',
  '      <area class="rich" name="Edgbaston" population="183" />',
  '    </city>',
  '    <city class="north" name="Liverpool" team="Everton">',
  '      <area class="poor" name="Everton" population="89" />',
  '    </city>',
  '    <city class="north" name="Middlesbrough" team="Middlesbrough">',
  '      <area class="rich" name="Linthorpe" population="28" />',
  '      <area class="poor" name="Grangetown" population="39" />',
  '    </city>',
  '  </country>',
  '  <country class="big" name="Scotland">',
  '    <city class="north" name="Aberdeen" team="Aberdeen">',
  '      <area class="poor" name="Harbourside" population="39" />',
  '    </city>',
  '    <city class="south" name="Edinburgh" team="Hearts">',
  '      <area class="rich" name="Meadows" population="97" />',
  '    </city>',
  '  </country>',
  '</folder>'
].join("\n");


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