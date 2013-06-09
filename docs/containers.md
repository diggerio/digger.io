#digger.io
digger is a designer database.

It lets you:

 * create database systems very quickly
 * do so without any server-side programming knowledge
 * integrate those databases with HTML very easily
 * link databases together to make bigger, better databases
 * run the databases on thousands of servers to cope with 'web scale'
 * speak to those databases using a 'CSS' style query language just like JQuery

In short - if you have ever found yourself doing some JQuery then you can now program database systems!

##Background
Every web designer should understand the following HTML:

```html
<div>
	<div class="product" id="123">
		<span class="title">Product 1</span>
	</div>
	<div class="product" id="456">
		<span class="title">Product 2</span>
	</div>
	<div class="product" id="789">
		<span class="title">Product 3</span>
	</div>
</div>
```

Now lets do some CSS to make our title spans red:

```html
<style>
	div.product span.title {
		background-color:red;
	}
</style>
```

Cool - nice and easy so far - these ideas are EVERYWHERE on the Internet.

###CSS is a powerful database query language
The thing is - the above CSS statement did something that server side databases make a proper meal out of.

Here is a 'simple' SQL statement - it says 'load all captions belonging to products less than £100':

```sql
select
	caption.*
from
	caption, product
where
	caption.product_id = product.id
	and
	product.price<100
group by
	caption.id
```

Now lets do the same in CSS:

```css
product[price<100] caption
```

###But CSS is a client side language - WTF?
That is the point of digger.io - to extend the thinking of a client side web developer and apply it to the server and database systems.

A digger.io network can run on many thousands of servers or just a single one.

It can speak to many different databases systems (MySQL, Redis, MongoDB, Facebook, Twitter, Google etc) and merge the results from them together.

The 2 languages that every client side web developer knows are:

	CSS and JavaScript

The 2 languages that digger.io speaks on the client AND the server are:

	CSS and JavaScript

###JQuery
There is another library that with massive success - combined the ideas of CSS and JavaScript into something altogether useful for web-designers - JQuery.
	
	52% of ALL websites use JQuery

Wow - think about that number!

Why has JQuery dominated other client side libraries?

The answer is simple - because it uses CSS at it's core and web designers 'think' in CSS.

It has enabled whole armies of people to use cool plugins and make their web-pages interactive.

###The Database Shortage
There is however - a HUGE shortage of people able to work the servers.

JQuery helped 52% of the Internet to become interative.

digger.io is a tool that can help the same people create realtime scalable database systems.