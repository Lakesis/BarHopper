/**
 * Module dependencies.
	express
	jade
	mongoose
	nodemailer 		
	connect	
 */

var express = require('express'),
	connect = require('connect'),
	routes = require('./routes'),
	api = require('./routes/api');

var app = express();		// Create server

var MemoryStore = require('connect').session.MemoryStore;

// Configure server
app.configure(function(){
	app.set('views', __dirname + '/views');	
	app.set('view engine', 'jade');
	
	app.use(express.favicon());
	app.use(express.bodyParser());
	app.use(express.cookieParser('your secret here'));
	app.use(express.session({
		store: new MemoryStore({
		reapInterval: 60000 * 10
	  }), secret:'foobar'
	}));
	app.use(express.methodOverride());
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
app.get('/logout', routes.logout);
app.post('/authenticate', routes.authenticate);

// API
// CRUD
app.get('/api/pubs', api.pubAPI.listAll);
app.get('/api/pubs/:id', api.pubAPI.findById);
app.put('/api/pubs/:id', api.pubAPI.update);
app.post('/api/pubs', api.pubAPI.create);
app.del('/api/pubs/:id', api.pubAPI.remove);

app.get('/api/pubs/near/:lon/:lat', api.pubAPI.nearDistance);
app.get('/api/pubs/distances/:lon/:lat', api.pubAPI.near);


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
