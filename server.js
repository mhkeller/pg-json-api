var http 	= require('http');
var pg 		= require('pg');
var url 	= require('url');

var port = 3101;

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
					res.setHeader("Access-Control-Allow-Origin", "*");
					res.writeHead(500, {'content-type': 'text/plain'});
					res.end('Error:' + err);
					done(client);
					return true;
				};

				handleError(err);

				// Log date
				console.log(new Date(), sql_query);
				client.query(sql_query, function(err, result) {
					// handle an error from the query
					if(handleError(err)) return

					// return the client to the connection pool for other requests to reuse
					done();
			    res.setHeader("Access-Control-Allow-Origin", "*");
					res.writeHead(200, {'content-type': 'application/json'});
					res.end(JSON.stringify(result.rows));
				});
			});
		}	else {
			res.writeHead(500, {'content-type': 'text/plain'});
			res.end('Please enter a request with the following structure. Replace values in <> with your values: ?db=<database_name>&q=SELECT * FROM <tablename>');
		}

})


server.listen(port);
console.log('Listening on port', port);
