#digger
develop databases like a boss.

PLEASE NOTE - this is massively alpha and not nearly finished.

If you want to help - give me a buzz : )

I promise I will write some help soon...

## example of running a digger from the browser
This will need a digger express mounted server.

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