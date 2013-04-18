#Network
[https://github.com/dotcloud/zerorpc-node](https://github.com/dotcloud/zerorpc-node) is used as the transport layer

##URL
Warehouse functions are discovered on the network by using the URL.

This has the following parts:

- protocol
- location
- path

The protocol is one of:

- local - a functional network (i.e. all the supply chains work by just connecting functions - never leaves the process)
- http - an external from the current stack request (i.e. off to the Internet to a page or some other digger stack)
- zmq - internal stack request - using the zmq transport
- axon - internal stack request - using the axon transport

The location is:

- digger department - a xxxxxx.digger name that resembles the department - this dictates what the format of the message will be
- domain name - a FQDN for HTTP requests

Here are the departments:

- warehouse - container request
- portal - portal trigger
- api - plain old REST http request
- rpc - JSON-RPC request

The path is a file path:

	/some/place
	/some/other/place



##HQ
So that everything knows where everything else is (and we don't need a broker) - we will use a realtime DNS via the HQ server.

The HQ server gives us the current state of a given network

It is a simplified version of the containers it holds in the container database running the stack.

The HQ container database is used by the stack owner to congigure and deploy the network.

The DNS broadcasts are a summary of the locations

```
{
	// this means we have 2 root warehouses
	'warehouse:/':[{
		host:'123.123.123.123',
		port:546
	},{
		host:'123.123.123.124',
		port:548
	}],
	// and our one API that is steaming gets lots of servers to itself
	// we have added servers for the same location but on a varying path
	// DNS clients are smart to return this if the path matches
	'warehouse:/busyapi':[{
		... 20 servers here
	}]
}

NOTE - if the DNS returns 'localhost' it means we are running locally and not leaving the process

this gives us a way of running the DNS system with all warehouses attached in a browser

this is useful for simulating the network

###Server

	REP (ROUTER) - used to push the whole state tree and receive requests to add/remove entries
	PUB - used to broadcast changes realtime

###Client

	REQ (DEALER) - used to 
	SUB - used to get changes realtime

```
	// connect to the stack's DNS server
	var network = digger.network();

	// you can provide multiple DNS servers
	network.connect(['123.123.123.121']);

	// register a function onto a URL
	dns.register('warehouse:/', function(req, res){
		// this has arrived becauses it's pointing to a warehouse
	})




	// get a pointer to 

```
##Supply Chains
These are just functions that are either clients or servers


###Client
This is used to ask questions and get an answer

	// get a connection to the DNS server running our stack
	var dns = digger.dns('123.45.34.32', {
		ports:{
			rpc:17777,
			pub:17778
		}
	})

	// choose which transport layer we want to use
	var transport = digger.transport('zmq');

	// combine the DNS and transport into a supplychain
	// this lets us run requests and will have a connection to the switchboard for realtime
	var supplychain = digger.supplychain('warehouse:/busyapi');

	// this is if we have stuck our switchboard somewhere else or want to use a different one
	var supplychain = digger.supplychain('warehouse:/busyapi', 'switchboard:/');	
	

	var apiendpoints = {
		api:
	}
	// maintain a list of endpoints for where we want to send stuff (/busyapi servers in this case)
	var apiendpoints = dns.listen('warehouse:/busyapi');

	// maintain a list of the stack switchboards
	var switchboardservers = hq.dns('switchboard:/');

	var swi

	// create a supplychain out of these things
	var supplychain = digger.supplychain()

	transport.connect(dns())

	var supplychainclient = function(req, res){
		transport.send(req, function(result){
			res.send(result);
		})
	}

###Server
This is used to answer questions

	var supplychainserver = function(req, res){
		supplier(req, res);
	})
##Routing
The supply chain function that a request is passed through decides how to route however it wants.

A warehouse is an example of a supply chain that can route based on path, method etc

##Transport Layers
Each transport layer has client and server.

All clients must:

- be a function accepting a req res and know how to use a transport layer to get it sent
- use a DNS client and be told where they are supposed to sent their requests to



Each service is mounted using the UR