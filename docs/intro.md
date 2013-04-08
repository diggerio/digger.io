#digger.io
The basic point of the digger is:

	to extract data from the Internet

There is a heck of a lot of that data floating about these days - Facebook, Twitter, news streams, stock market movements, vehicle telemetry, home sensors etc - it's a seething mass of attention seeking bitsteams.

80% of ALL data in the world has been created in the past 2 years.

Think forward 5 years - we need a raft upon which to sail this ocean.

##It's just like shipping!
Let us take an example business that everyone should have a basic idea about - a shipping company.

Here is a scenario of how one might interact with a shipping company:

 1. You take a contract to reception - the contract lists what you want to receieve (oranges, plastic toys and coffee for us).

 2. The contract is analyzed and multiple orders are placed with suppliers around the world based upon it.

 3. Empty shipping containers are loaded onto boats which leave the holding bay and make their way to the respective suppliers to be filled up with oranges, plastic toys and coffee.

 4. The boats make their way home, laden with goods.

 5. The holding bay will prepare a final container for the customer by pouring in the oranges, plastic toys and coffee, just as the contract had requested.

The whole process might take a few weeks, but you get your stuff because it's a system that works.

Let's try applying the same idea to databases.

##Containers
Much like shipping containers, digger.io containers allow us to move data around the world.

There are many busy shipping ports and they are all loading/unloading thousands of containers each day.

Inside each container lives a variety of things - a crane operator is shifting around oranges one minute and then plastic toys the next.

They need not care what is inside each container, indeed, their focus is just to move the container from A to B.

That is the job of a digger.io container - not to get involved with the data that is inside, just to allow you access to it and to shift it around the world at lightspeed.

##Content Agnostic
Databases, like humans, speak many different languages (formats in their case).

You have the whole SQL range (MySQL, Postgres etc) - which speak in 'table format'.

You have the NoSQL range (Mongo, Redis etc) - they speak in 'document format'.

Then you have the plethora of API databases (Facebook, Twitter etc) - which speak in 'various' formats (JSON, XML, custom).

In a world where we need to mix, match and ultimately derive value from all these signals - a master linguist is needed.

##Star Trek to the rescue
IMHO the best thing in Star Trek is the little device where you speak and it translates into alien for you instantly.

It is my proposal that by applying the shipping industries 'Standardized Container' approach - we get a poor mans version of this translator for databases.

##Containers are just arrays of raw data
Here is the example contents of a container:

```json
[{
	name:'Chocolate Brownie',
	price:1.27
},{
	name:'Pecan Brownie',
	price:1.29
}]
```

Notice how it is just an array of raw JSON values.

This is the container format - an array, that's it.

There are a couple of other things you can do but we'll leave that for later.

The important thing to understand is that EVERY container consists of an array of raw objects at the top level - even if you know there is only one object in the results, it will still be an array with one element.

##Leave the data alone
Part of a standardization proccess involves knowing what to leave alone.

In our case that means the actual data itself.

We don't want to have to 'convert' anything - that would be akin to taking the oranges and plastic toys out of their containers and trying to turn them into a mixed juice drink (yuk) - it will not make sense.

Let us imagine an ant colony - each ant belongs inside the container of the nest.

Now - if we had a system that tried to get inside the nest and put a little RFID tracker onto each ant and then keep track of them all - well, it would end badly.

The container wrapper is the same - it does not try to get in amoungst the ants.

It leaves the data inside alone and only when you want to ask questions about it or change some of it will the container be opened.

How you deal with the fact their might be oranges mixed in with plastic toys is something we will discuss soon.

For the moment, be happy in the knowledge that item 3 in a container might be an orange and item 4 a plastic toy - providing all of the things are in a list, it counts as a container (an example of leaving the ants alone).

Onwards - we have much to explore.

##Databases should not be hard
I've have hacked around with various different databases for a long time.

I have realised that the very mention of the word 'Database' seems to scare everybody who is not a robot munching geek (like me) to death.

This is a problem akin to having a million pounds inside a safe that no-one knows the combination for.

What can we do about this?

Well, some re-branding will help.

##KISS
Take this statement:

	Execute a recursive database query that filters results based on their hierarchical relationships

And turn it into this one:

	Find me all the stuff that lives inside that other stuff

They mean the same thing and it ain't clever to say the first.

Compare these 2 database queries - one is in SQL and the other in a CSS type language:

SQL:
```sql
select
	image.*
from
	product, image
where
	image.product_id = product.id
	and
	product.name LIKE 'b%'
group by
	image.id
```

CSS:
```
product[name^=b] > image
```

They mean the same thing:

	find all images inside of products who's name starts with 'b'

And it ain't clever to say the first.

Could this be an example of a KISS?

Certainly - however there is not a solution for running CSS style database queries on a server - against actual MySQL, NOSQL dbs and API's.

Well - there wasn't, until now:

	digger.io - data = tada!

##Inspired by JQuery
JQuery is used on more than 50% of ALL pages on the Internet [source](http://w3techs.com/blog/entry/jquery_now_runs_on_every_second_website)

Wow - think about that for a moment - one small(ish) JavaScript file dominates half of desktop and mobile screens out there.

Why?

Because it opens up the ability to create JavaScript programs to people who could not do so before.

Who are these people - the armies of Photoshop designers and HTML guys of course!

##The skillz gap
For a long time, robot munching geeks (like me) have monopolised the ability to write database code on servers meanwhile
the demand for this type of work has rocketed and now there is a skills shortage.

At the same time - Photoshop Designers and HTML guys are writing amazing client side apps (because they got their head around JQuery) but do not have such a wealth of opportunity.

This is because the servers run the Internet and the browsers just participate in it.

##JQuery on the server
What you should be thinking right now:

	But how CAN we run JQuery on the server - there is no DOM, no browser and where do we even get the HTML from?

This is where a slight shift in thinking is required.

We are not actually running JQuery on the server - we are just using the same ideas that JQuery uses so that Designer folk can grapple with the server at all.

(NOTE: if you are thinking - hey I can run JQuery on the server by launching PhantomJS and pointing to a page - nice one, but this ain't that : )

###An example of JQuery in the browser
Lets take the following HTML running in the browser - this should be plain vanilla to your eyes.

```html
<div class="top">
	<a href="http://digger.io">click</a>
	<img src="http://digger.io/logo.png" />
	<span>hello world</span>
</div>
```

```js
	$(function(){

		// add .stamped class to each child of everything with the .top class
		$('.top > *').addClass('stamped');	

	})
```

3 magical things just happened:

- we used our knowledge of CSS to execute a database query
- we changed the data of 3 completely different things simultaneously
- we operated on multiple elements without having to think about it

###Using the same idea on the server
Now lets take an example of digger.io code running on the server (perhaps we are powering the screens of a 1000 different users now):

```xml
<folder name="stuff" class="top">
	 <product name="Ice Cream" price="100" />
	 <friend name="Bob" provider="facebook" />
	 <weather name="Bristol" price="raining" />
</folder>
```

```js
// create a container with the data inside
var container = $digger.new(data);

// add .stamped class to each child of everything with the .top class
container.find('.top > *').addClass('stamped');
```
Hopefully - the similarity is hitting you.

##digger.io can run anywhere
We can run JQuery style JavaScript on the server and speak to multiple databases using CSS.

We can also run digger.io in the browser - connected to the digger running on the server.

This is where the REAL power comes in - you are now controlling the whole stack - from browser to server to database,
using the languages that have been around for ever:

	JavaScript and CSS

##You have those 1337 skillz right now
To conclude this techo-babble:

digger.io provides you with a range of industrial grade realtime database tools that speak to the globe.

You can speak to them all using CSS selectors.

You can manipulate the data using JQuery style functions.

In a nutshell - if you can answer yes to this question:

	Can you make a webpage using some JQuery

Then you can now answer yes to this question also:

	Can you create realtime scalable database applications