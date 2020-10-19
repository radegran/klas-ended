//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var crypto  = require('crypto');
var mongoClient = require('mongodb').MongoClient;
var L = require('./localization');
var sendgrid = require("sendgrid")("klas-ended", process.env.SENDGRID_PASSWORD || "");
var slack = require('slack-notify')(process.env.SLACKWEBHOOK); // "https://hooks.slack.com/services/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");
var clientDistDir = "./client/dist/";

var MockDataBase = function()
{
	var objects = {};

	// findOne({"id":doc.id}, function(err, foundDoc) 
	var findOne = function(o, cb) 
	{
		if (objects.hasOwnProperty(o.id))
		{
			cb(null, objects[o.id]);
		}
		else
		{
			cb(null, null);
		}
	};

	// insert(doc, {w:1}, function(err, result)
	var insert = function(doc, dummy, cb)
	{
		objects[doc.id] = doc;
		cb(null, true);
	};
	
	// update({"id":doc.id}, {$set:setter}, {w:1}, function(err, result)
	var update = function(o, setterWrap, dummy2, cb)
	{
		var setter = setterWrap["$set"];
		var doc = objects[o.id];

		for (var key in setter)
		{
			if (setter.hasOwnProperty(key))
			{
				doc[key] = setter[key];
			}
		}
		
		cb(null, true);
	};
	
	var mockDocs = {
		"findOne": findOne,
		"insert": insert,
		"update": update
	};

	return {
		"collection": function() { return mockDocs; }
	};
};

var DB = function(mongoClient, isDevelEnv)
{
	var database; 
	
	    // default to a 'localhost' configuration:
    var mongoURL = 'mongodb://127.0.0.1:27017/klas';

    // if OPENSHIFT env variables are present, use the available connection info:
    // if (process.env.MONGODB_PASSWORD) {
    //     connectionString = "mongodb://" + process.env.MONGODB_USER + ":" +
    //     process.env.MONGODB_PASSWORD + "@" +
    //     process.env.MONGODB_SERVICE_HOST + ':' +
    //     process.env.MONGODB_SERVICE_PORT + '/' +
    //     process.env.MONGODB_DATABASE;
	// }

    // 2nd TRY
	
	// mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    // mongoURLLabel = "";

	// console.log("DBG1 " + mongoURL);

	// if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
	// 	var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
	// 		mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
	// 		mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
	// 		mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
	// 		mongoPassword = process.env[mongoServiceName + '_PASSWORD']
	// 		mongoUser = process.env[mongoServiceName + '_USER'];

	// 	if (mongoHost && mongoPort && mongoDatabase) {
	// 		mongoURLLabel = mongoURL = 'mongodb://';
	// 		if (mongoUser && mongoPassword) {
	// 		mongoURL += mongoUser + ':' + mongoPassword + '@';
	// 		}
	// 		// Provide UI label that excludes user id and pw
	// 		mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
	// 		mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
	// 	}

	// 	console.log("DBG2 " + mongoURL);
	// }
	
	// 3rd TRY
	mongoURL = process.env.DB_URI || "mongodb://klas.com";
	
	mongoClient.connect(mongoURL, function(err, validDatabase)
	{
		if (err) 
		{ 
			console.dir(err); 
		    if (isDevelEnv)
			{
				console.log(">>> Using mock database!");
				database = MockDataBase();
			}
		}		
		else
		{
			console.log("Connected to Mongo database!")
			database = validDatabase;
		}
	});
	
	var create = function(callback, startData) 
	{
		var collection = database.collection('docs');
		var id = crypto.randomBytes(10).toString('hex');
		var now = Date.now();
		
		var doc = {
			"id":id,
			"created": now,
			"lastUpdated": now,
			"generation":0, 
			"data": startData()
			};

		collection.findOne({"id":doc.id}, function(err, foundDoc) 
		{
			if (!err && foundDoc === null)
			{						
				collection.insert(doc, {w:1}, function(err, result)
				{
					callback(err, id);
				});
			}
			else
			{
				callback("err", null);
			}
		});
	};
		
	var update = function(doc, callback) 
	{
		var collection = database.collection('docs');

		collection.findOne({"id":doc.id}, function(err, foundDoc) 
		{
			if (err || foundDoc === null) 
			{ 
				callback("NoDocumentFound", foundDoc);
				return; 
			}

			if (foundDoc.generation >= doc.generation)
			{
				// Conflict
				callback(null, foundDoc);
			}
			else
			{
				var setter = {
					"lastUpdated": Date.now(),
					"generation": doc.generation, 
					"data": doc.data
				};
				
				collection.update({"id":doc.id}, {$set:setter}, {w:1}, function(err, result)
				{
					if (err) 
					{ 
						callback(err, foundDoc);
					}
					
					doc.ok = true;
					callback(null, doc);
				});
			}
		});		
	};
	
	var stats = function(callback)
	{
		database.collection('docs').find(
			{"lastUpdated":{"$exists":true}}, 
			{"sort":[["lastUpdated", "descending"]], "limit": 500})
			.toArray(function(err, docs)
			{
				callback(docs);
			});
	};
	
	return {
		"create": create,
		"update": update,
		"stats": stats
	};
};

// The database instance
var db;

/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;

    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080; 

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No NODEJS_MONGO_PERSISTENT_SERVICE_HOST var, using 127.0.0.1');
            self.ipaddress = "0.0.0.0" || "127.0.0.1";
			self.isDevelEnv = true;
			console.log("USING MOCK DATABASE")
        };
    };

	var eachResource = function(cb)
	{
		var files = fs.readdirSync(clientDistDir)
					.filter(function(v){
						return (/.(js|css|png|svg|ico|map)$/).test(v);
					});
					
		for (var i = 0; i < files.length; i++)
		{
			cb(files[i]);
		}			
	};

    /**
     *  Populate the cache.
     */
    self.populateCache = function() 
	{
		self.zcache = {};
        
        //  Local cache for static content.
		self.zcache['google1cc9300789172331.html'] = fs.readFileSync(clientDistDir + 'google1cc9300789172331.html');
        self.zcache['index.html'] = fs.readFileSync(clientDistDir + 'index.html');
	    self.zcache['app.html'] = fs.readFileSync(clientDistDir + 'app.html');
	    self.zcache['summary.html'] = fs.readFileSync(clientDistDir + 'summary.html');
	    self.zcache['app.appcache'] = fs.readFileSync(clientDistDir + 'app.appcache');
		
		eachResource(function(file)
		{
			self.zcache[file] = fs.readFileSync(clientDistDir + file);
		});
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) 
	{ 
		if (self.isDevelEnv)
		{
			return fs.readFileSync(clientDistDir + key);
		}
		else
		{
			return self.zcache[key]; 			
		}
	};


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

		self.routes['/google1cc9300789172331.html'] = function(req, res)
		{
			res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('google1cc9300789172331.html') );
		};

        self.routes['/'] = function(req, res) 
		{
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };
		
		self.routes['/app.appcache'] = function(req, res)
		{
			if (self.isDevelEnv)
			{
				res.send('');
			}
			else
			{
				res.setHeader('Content-Type', 'text/cache-manifest');
				res.send(self.cache_get('app.appcache') );				
			}
		};
		
        self.routes['/stats'] = function(req, res) 
		{
            res.setHeader('Content-Type', 'text/html');
			var response = "<html><head><meta charset='UTF-8'></head><body>";
            db.stats(function(docs) 
			{
				for (var i = 0; i < docs.length; i++)
				{
					var d = docs[i];
					var ageDays = Math.floor((d.lastUpdated - (d.created || d.lastUpdated)) / 1000 / 60 / 60 / 24);
					response += (new Date(d.lastUpdated)).toString().substring(0, 33) + 
						" : age " + ageDays + 
						", gen " + d.generation + 
						", " + d.data.title +
						"<br/>";
				}
				
				res.send(response + "</body></html>");
			});
        };
		
		// Localization!! Not a very standard solution I guess
		self.routes['/localization.js'] = function(req, res)
		{
			res.setHeader('Content-Type', 'text/html');
            res.send("var L = " + JSON.stringify(L.allStrings(req)));
		};
		
		self.routes['/[0-9a-f]+$'] = function(req, res) 
		{
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('app.html') );			
		};
		
		self.routes['/summary/[0-9a-f]+$'] = function(req, res) 
		{
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('summary.html') );			
		};
        
        self.routes['/summary/$'] = function(req, res) 
		{
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('summary.html') );			
		};
		
		// DEBUG
		self.routes["/[.]*.js"] = function(req, res)
		{
			console.log("ALL-JS-MATCH: " + req.url)
			res.send("");
		};
		
		eachResource(function(file)
		{	
			self.routes['/' + file] = function(req, res)
			{
				if (file.search("ico") > -1)
				{
					res.setHeader('Content-Type', 'image/x-icon');
				}
				else if (file.search("png") > -1)
				{
					res.setHeader('Content-Type', 'image/png');
				}
				else if (file.search("svg") > -1)
				{
					res.setHeader('Content-Type', 'image/svg+xml');
				}
				else if (file.search("css") > -1)
				{
					res.setHeader('Content-Type', 'text/css');
				}
				else
				{
					res.setHeader('Content-Type', 'text/javascript');
				}
				res.send(self.cache_get(file) );	
			}
		});
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {

		console.log("initializeServer 1")

        self.createRoutes();
        self.app = express();
		self.app.use(express.bodyParser());

		console.log("initializeServer 2")

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }

		console.log("initializeServer 3")

		var update = function(doc, req, res)
		{
			db.update(doc, function(err, foundDoc)
			{
				if (err)
				{
					var message = err.message || err;
					var translation = L.getTranslator(req)(message);
					console.log(message);
					res.send({"err": translation});
				}
				else
				{
					delete foundDoc.touchedTime;
					delete foundDoc._id;
					res.send(foundDoc);
				}
			});			
		};
		
		// P O S T   H A N D L E R S
		self.app.post("/ping", function(req, res) 
		{
			res.send("pong");
		});
		
		self.app.post("/sendmail", function(req, res)
		{
			slack.send({
				channel: '#splittanotan',
				text: req.body.message,
				unfurl_links: 1,
				username: req.body.from
			});

			return;

		});
		
		self.app.post("/update", function(req, res) 
		{
			console.log("GOT update REQUEST");
			
			var doc = {
				"id": req.body.id,
				"generation": req.body.generation,
				"data": req.body.data
			};
			
			update(doc, req, res);
		});

		self.app.post("/get", function(req, res) 
		{
			console.log("GOT get REQUEST");
			
			var doc = {
				"id": req.body.id,
				"generation": -1
			};
			
			update(doc, req, res);
		});

		self.app.post("/create", function(req, res) 
		{
			var startData = function()
			{
				return L.getTranslator(req)("StartData");
			};
			
			console.log("GOT create REQUEST");
			db.create(function(err, id)
			{
				if (err)
				{
					res.send({"err": L.CouldNotCreateDocument});
				}
				else
				{
					res.send({"url": id});
				}
			}, startData);
		});
    };

    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
		db = DB(mongoClient, self.isDevelEnv);
        self.populateCache();
        self.setupTerminationHandlers();

		console.log("initialize 1")

        // Create the express server and routes.
        self.initializeServer();

		console.log("initialize 2")
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */

module.exports.SampleApp = SampleApp;


