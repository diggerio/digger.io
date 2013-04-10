#digger.io
The basic point of the digger is:

	to extract data from the Internet

80% of ALL data in the world has been created in the past 2 years.

Think forward a number of years - there will be a seething mass of attention-seeking bitsteams, one that's only controllable by the uber-geeks who run the world.

Before we drown in meaningless data, we must build real tools for normal people.

The problem is that writing database systems on Internet servers is a hard task.

##The skills gap
For a long time, the geeks have monopolised the ability to write database code on servers.

Meanwhile the demand for this type of work has rocketed and now there is a skills shortage.

Photoshop Designers and HTML guys are writing amazing client side apps (because they got their head around JQuery) yet do not have such a wealth of opportunity as a server-side database programmer.

This is because the servers run the Internet and the browsers just participate in it.

##Databases should not be hard
I've hacked around with various databases for a long time.

During this time, I've noticed that the very mention of the word 'database' seems to scare people to death.

What can we do about this?

Well, some re-branding might help.

##Shipping Containers
A detour - here is an example of how one might interact with a shipping company:

 1. You take a contract to reception - the contract lists what you want to recieve (oranges, plastic toys and coffee for us).

 2. The contract is analysed and multiple orders are placed with suppliers around the world based upon it.

 3. Empty shipping containers are loaded onto boats which make their way around the world to fetch your stuff.

 4. Warehouse suppliers fetch the stuff and fill up containers with it before putting them onto the boat.

 5. All of the boats make their way home, laden with goods.

 6. The holding bay pours all of the stuff from the different places into a container and it is on to the customer.

The whole process might take a few weeks, but you get your stuff because it's a system that works.

There are many busy shipping ports and they are all loading/unloading thousands of containers each day.

The crane operator does not care what's inside the container, he just follows instructions to move it from A to B.

##Keep It Simple Stupid
Take this statement:

	Execute a recursive database query that filters results based on their hierarchical relationships

And turn it into this one:

	Find me all the stuff that lives inside that other stuff

They mean the same thing and one is much easier than the other.

How can we make databases feel easy like this?

Well, we might learn a thing or two from the shipping companies!

##Data Containers
We need a way of moving data from lots of different places around in standard containers.

We also need a way of writing contracts in a languages that the maximum number of people can understand.

##Enter JQuery
JQuery is used on more than 50% of ALL pages on the Internet [source](http://w3techs.com/blog/entry/jquery_now_runs_on_every_second_website)

Wow - think about that for a moment - one small(ish) JavaScript file dominates half of desktop and mobile screens out there.

Why?

Because it speaks in 'CSS selectors', a language that non-geeks can understand.

Using JQuery, non-geeks can control computers in more powerful ways - they can 'think' in JQuery because they can 'think' in CSS.

##JQuery as a query language
JQuery is much like a database - one that uses CSS selectors as a query language and searches the DOM in the browser.

digger.io uses the same idea - it uses CSS selectors as a query language.

When you give JQuery a CSS selector - it will search the current web-page and return DOM elements.

When you give digger.io a CSS selector - it will search the Internet and return JSON models.

Using JQuery, non-geeks can program interactive pages because they can 'think' in CSS.

Using digger.io, non-geeks can program database servers because they can 'think' in CSS.

##Moving our mind onto the server
What you should be thinking right now:

	But how CAN we run JQuery on the server - there is no DOM, no browser and where do we even get the HTML from?

This is where a slight shift in thinking is required.

We are not actually running JQuery on the server - we are just using the same ideas that JQuery uses so that Designer folk can grapple with the server at all.

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
You can run digger.io pages in a browser and they will use a 'supplychain' to connect to the server.

You can run digger.io scripts on the server and they will use a 'supplychain' to connect to multiple databases.

You use CSS to ask for data and HTML to write templates for when it returns.

This is where the REAL power comes in - you are now controlling the whole stack - from browser to server to database,
using the languages that have been around for ever:

	JavaScript and CSS

##You have those 1337 skillz right now
In a nutshell - if you can answer yes to this question:

	Can you make a webpage using some JQuery

Then you can now answer yes to this question also:

	Can you create realtime scalable database applications