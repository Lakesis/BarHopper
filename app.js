/**
 * Module dependencies.
	express
	jade
	mongoose
	nodemailer 		
	connect	
	connect-mongo
	crypto
	
	/// Paynode and Mocha
 */

var express = require('express'),
	connect = require('connect'),
	routes = require('./routes'),
	api = require('./routes/api'),
	MongoStore = require('connect-mongo')(express);

var app = express();		// Create server

// DB session
var conf = {
  db: {
    db: 'barhopper-dev',
    host: 'pablogil.org',
    username: 'pablo', // optional
    password: 'development'
  },
  secret: 'Iba yo de peregrina'
};

// Configure server
app.configure(function(){
	app.set('views', __dirname + '/views');	
	app.set('view engine', 'jade');
	
	app.use(express.favicon());
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({
		secret: conf.secret,
		maxAge: new Date(Date.now() + 3600000),
		store: new MongoStore(conf.db)
	}));
	app.use(express.methodOverride());
	
	// Helper middleware for the views. Apply before routing
	app.use(function(req, res, next){
		if (req.session.user){
			res.locals.user = req.session.user;
		}else{
			res.locals.user = null;
		}
		next();
	});
	app.locals.pretty = true;
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

// Environments
app.configure('development', function() {
  app.use(express.logger());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
  app.use(express.logger());
  app.use(express.errorHandler()); 
});

// Web
app.get('/', routes.index);
app.get('/newCrawl',requiresLogin, routes.wizard);

// Account
app.get('/login', routes.login);
app.post('/login', routes.authenticate);
app.get('/logout', routes.logout);
app.get('/newUser', routes.newUser);
app.post('/newUser', routes.createUser);

// API
// CRUD
app.get('/api/pubs', api.pubAPI.listAll);
app.get('/api/pubs/:id', api.pubAPI.findById);
app.put('/api/pubs/:id', api.pubAPI.update);
app.post('/api/pubs', api.pubAPI.create);
app.del('/api/pubs/:id', api.pubAPI.remove);

app.get('/api/pubs/near/:lon/:lat', api.pubAPI.near);
app.get('/api/pubs/distances/:lon/:lat', api.pubAPI.nearDistance);


function requiresLogin(req, res, next){
	if(req.session.user){
		next();
	}else{
		res.redirect('/login?redirect='+req.url);
	}	
};

if(!module.parent){
	app.listen(3000);
}
