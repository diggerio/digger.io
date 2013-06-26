#Routing and stack configs

The routes for an app are the databases it's warehouse will route to...

If the app is mounted on:

	http://digger.io/binocarlos/app1

And the following routes apply:

```yaml
  /db
 	  type: diggerdb
 	  provide: database
```

Internally this will be logged after a POST request to the diggerdb provider

binocarlos/app1/db -> some/internal/path/343434

Then we can:

```html
	<script src="http://digger.io/binocarlos/app1.js"></script>
```

then

```js

	// this is the REST url: http://digger.io/binocarlos/app1/db/users
  var users = $digger.connect('/db/users');
```