#Suppliers
A warehouse that talks in terms of containers and selectors.

Get the details for the supplier itself

	GET /api

Load a single container by it's digger id

	GET /api/123

This is shorthand for

	GET /api/dig/=123

Run a single selector from the top

	GET /api?q=product.onsale
	GET /api?selector=product.onsale
	GET /api/dig/product.onsale

Run a single selector from a single context

	GET /api/123?q=product.onsale
	GET /api/123?selector=product.onsale
	GET /api/123#product.onsale

Run a digger step

	POST /api/dig

	x-digger-selector = selector
	body = context models

Run a digger contract

	POST /api/contract

	body = contract

	{
		type:'pipe',
		children:[{
			method:'get',
			path:/dig,
			headers:{
				'x-digger-selector':...
			}
		},{
			method:'get',
			path:/dig,
			headers:{
				'x-digger-selector':...
			}
		}]
	}

This means run a selector in a supplier

	GET /api/dig/product.onsale/caption









