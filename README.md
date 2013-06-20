#digger
develop databases like a boss.

Paste the script tag pointing to your digger host:
```html
<script src="http://digger.io/binocarlos.js"></script>
```

this loads data from the server, using JQuery selectors for databases!
```js
var database = digger.connect('/mytestdatabase');

database('product[price<100]:tree')
	.order('name')
	.ship(function(products){
		alert('we have ' + products.count() + ' products under £100');
	})
```