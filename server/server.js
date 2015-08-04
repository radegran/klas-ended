//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var crypto  = require('crypto');
var mongoClient = require('mongodb').MongoClient;
var L = require('./localization');
var sendgrid = require("sendgrid")("klas", "qwerQWER1234");
var clientDistDir = "./client/dist/";

var DB = function(mongoClient, url)
{
	var db; 
	
	    // default to a 'localhost' configuration:
    var connectionString = '127.0.0.1:27017/klas';
    // if OPENSHIFT env variables are present, use the available connection info:
    if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
        connectionString = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
        process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
        process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
        process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
        process.env.OPENSHIFT_APP_NAME;
	}
	
	mongoClient.connect("mongodb://" + connectionString, function(err, database)
	{
		if (err) 
		{ 
			console.dir(err); 
		}		
		else
		{
			console.log("Connected to Mongo database!")
			db = database;
		}
	});
	
	var create = function(callback, startData) 
	{
		var collection = db.collection('docs');
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
		var collection = db.collection('docs');

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
		db.collection('docs').find(
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

var db = DB(mongoClient);


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
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };

	var eachResource = function(cb)
	{
		var files = fs.readdirSync(clientDistDir)
					.filter(function(v){
						return (/.(js|css|png|ico|map)$/).test(v);
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
        self.zcache['index.html'] = fs.readFileSync(clientDistDir + 'index.html');
	    self.zcache['app.html'] = fs.readFileSync(clientDistDir + 'app.html');
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
    self.cache_get = function(key) { return self.zcache[key]; };


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

        self.routes['/'] = function(req, res) 
		{
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };
		
		self.routes['/app.appcache'] = function(req, res)
		{
            res.setHeader('Content-Type', 'text/cache-manifest');
            res.send(self.cache_get('app.appcache') );
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
        self.createRoutes();
        self.app = express();
		self.app.use(express.bodyParser());

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }

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
			var payload   = {
				to      : 'jesper.radegran@gmail.com',
				from    : req.body.from,
				subject : 'Meddelande från klas-ended-sajten!',
				text    : req.body.message
			};

			console.log("Sending email...");
			sendgrid.send(payload, function(err, json)
			{
				if (err) 
				{ 
					res.send({"reply": "err" + err}); 
				}
				else
				{
					res.send({"reply": "ok"});
				}
			});	
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
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
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


