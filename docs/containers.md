#Containers
A digger.io container is at it's most basic, an array of raw JSON objects.

##Basic Data Structure
Let us look at an example of some raw data in container format:

```js
[{
	name:'My Orange',
	price:20,
	__meta__:{
		tagname:'orange',
		class:['organic']
	}
},{
	name:'My Plastic Toy',
	price:2
	__meta__:{
		tag:'toy',
		class:['synthetic']
	}
}]

So - container format is an array of models, with each model being a plain vanilla JSON object.

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
