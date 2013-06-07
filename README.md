#digger.io
A database system built for web designers and the Internet.

##Features

 SELL THE SIZZLE NOT THE STEAK




##Examples

Including digger.io on a webpage anywhere:

```html
<script src="http://digger.io/binocarlos.js"></script>
```

Writing client JavaScript to connect via our proxy to backend databases

```js

// this is on the page because we put the script tag from the page above
$digger
	
	// connect to a database anywhere - this is over HTTP (plain or WebSockets)
	.connect('http://digger.io/binocarlos/shop')

	// when we are connected we have a digger database
	.then(function(database){

		

	})
```

Using CSS selectors to load data

```js

	database('product[price<100]')
		.limit(20)
		.order('price')
		.ship(function(results){

			results.each(function(product){
				console.log('product loaded: ' + product.attr('name'));
			})

		})
```