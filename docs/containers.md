#Containers
Containers are the fundamental building block of a digger.io system.

They provide you with a common method of talking to lots of different databases and for moving data around the world.

Understanding how to put data into a container and then get it out at the other end will make you a database ninja!

So - just like Karate Kid - time for some wax on.

##What are containers?
Containers do not actually exist - they just 'wrap' your data and move it around as required.

They provide you with 2 main features:

 * to get at the data inside
 * to make contracts that will load more containers from the server

Before we learn how to do these things - let us study a library we must pay homage to.

##JQuery
JQuery works very well because it can treat lots of different things (Images, Links, Divs etc) as an ambiguous list of 'stuff'.

Take this HTML:

```html
		<div class="red"></div>
		<span class="blue"></span>
		<img src="img.png" />
```

It is a mix mash of different things entirely - yet JQuery elegantly lets us alter properties of all 3 in 1 line of code:

```
	$('*').attr('title', 'all 3 have this');
```

##Digger
Just like JQuery gives you an array of underlying DOM elements - digger.io containers are an array of underlying JavaScript objects.

Take this data structure:

```js

var data = 
	[{
		name:'Sofa',
		size:45
	},{
		name:'Chair',
		size:28
	},{
		name:'Beanbag',
		size:16
	}]
```

digger.io can work with the data above:

```js
	var container = digger.create(data);

	container.attr('title', 'all 3 have this');
```

##Basic Container











##Basic Data Structure
Here is some raw data in container format:

```js
[{

	name:'My Orange',
	price:20,

	__digger__:{
		meta:{
			tagname:'orange',
			class:['organic']
		},
		children:[]
	}
},{

	name:'My Plastic Toy',
	price:24,

	__digger__:{
		meta:{
			tag:'product',
			class:['synthetic']
		},
		children:[]
	}
}]

Each model has top level attributes - it is just a plain old JavaScript object.

Th

##Models
Think of a model as the same as a single DOM element in JQuery speak.

Each model will contain the following data:

 * attributes
 * meta
 * children

###Underlying structure
An example of a model with everything specified:

```js
{

	// these are the attributes - the actual data for the model
	name:'My big model',
	description:'This is a model with lots of things plugged in',

	// this is the meta data - the stuff digger needs to work with
	__meta__:{
		tag:'parent',
		id:'bigmodel',
		class:['big', 'example']
	},

	// these are the children - <div><span></span></div> is an example of a span inside a div
	__children__:[{
		name:'A child of the parent',
		__meta__:{
			tag:'child'
		}
	}]
}
```

###In XML format
and example of the same data in XML:

```xml
<parent id="bigmodel" class="big example" name="My big model" description="This is a model with lots of things plugged in">
	<child name="A child of the parent" />
</parent>

```

As you can see, the XML version is shorter and much more like JQuery speak.

##Putting data into containers
When you have some raw data - the next step is to pour it into a container, this then lets us use the cool container API on the data.

Creating a container from some raw data:

```js
var rawdata = [...]; // the JSON data above

var stuff = Container.new(rawdata);
```

Now we have a container rather than a raw JavaScript object, we can start to do JQuery type stuff:

```js
// add a class name to each model
stuff.addClass('hello');

// add a class name to the 2nd model
stuff.eq(1).addClass('hello');

// add an attribute to all models
stuff.attr('akey', 'avalue');

// get the raw data for the 4th model
var raw = stuff.get(3);

// 


// loop over each model wrapped in it's own container
stuff.each(function(container){
	// this will always echo '1'
	console.log(container.length);
})


```




Here is some code that creates a new container object from the XML above:

	var test = Container(xmlstring);
	test.log(container.toJSON())

Here would be the output:

```js
{
	name:'My big model',
	description:'This is a model with lots of things plugged in',
	__meta__:{
		tag:'parent',
		id:'bigmodel',
		class:['big', 'example']
	},
	__children__:[{
		name:'A child of the parent',
		__meta__:{
			tag:'child'
		}
	}]
}
```
