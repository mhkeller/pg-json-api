Postgres json api
===

A thin json api around one or many postgres databases. Adapted from [brianc](https://github.com/brianc/node-postgres/wiki/Example).

Send it a URL such as the one below and return a json response. Specify which database you want to connect to along with a query. 

````
http://localhost:3001?db=my_database_name&SELECT * FROM my_table
````

Out of the box, it's set to use a superuser named `postgres`, which you can create with `createuser -s -r postgres`.

If you want to query under a different user/role change the `con_string` variable to your desired connection string with the name of that role. Setting up a different role would be a good idea if you wanted to restrict permissions so that users couldn't easily drop tables or alter the database in a damagine way.

If you're logged in as a superuser, it will take any sql you enter, which has [some downsides](http://xkcd.com/327/). This script is meant as a simple wrapper to get you started, so the configuratoin is up to you.

### Running the server

Start this server with `node server.js`. You could use [forever](https://github.com/foreverjs/forever) to run it continually or set it up in a [tmux](http://tmux.sourceforge.net/) window, which you can also brew install if you don't want to run that installer.


**server.js** looks like this. If you see any improvements, pull requests welcome!

````js
var http 	= require('http');
var pg 		= require('pg');
var url 	= require('url');

var server = http.createServer(function(req, res) {
	var url_parts 	= url.parse(req.url, true),
		query 		= url_parts.query,
		con_string	= 'postgres://postgres@localhost/' + query.db,
		sql_query 	= query.q;

		if (query.q && query.db){
				// get a pg client from the connection pool
			pg.connect(con_string, function(err, client, done) {

				var handleError = function(err) {
					// no error occurred, continue with the request
					if(!err) return false;

					// An error occurred, remove the client from the connection pool.
					// A truthy value passed to done will remove the connection from the pool
					// instead of simply returning it to be reused.
					// In this case, if we have successfully received a client (truthy)
					// then it will be removed from the pool.
					done(client);
					res.writeHead(500, {'content-type': 'text/plain'});
					res.end('Oh no! ' + err);
					return true;
				};

				handleError(err);

				// Log date
				console.log(new Date()); 
				client.query(sql_query, function(err, result) {
					// handle an error from the query
					if(handleError(err)) return;

					// return the client to the connection pool for other requests to reuse
					done();
					res.writeHead(200, {'content-type': 'application/json'});
					res.end(JSON.stringify(result.rows));
				});
			});
		}	else {
			res.writeHead(500, {'content-type': 'text/plain'});
			res.end('Please enter a request with the following structure. Replace values in <> with your values: ?db=<database_name>&q=SELECT * FROM <tablename>');
		}

})

server.listen(3001);
````

### License

MIT
