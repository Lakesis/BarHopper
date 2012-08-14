/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes');
	

var app = express();


app.configure(function(){
	app.set('views', __dirname + '/views');	
	app.set('view engine', 'jade');
	
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

app.get('/api/pubs', routes.api.pubs);
app.get('/api/pubs/:id', routes.api.pub_by_id);
app.put('/api/pubs/:id', routes.api.pub_update);
app.post('/api/pubs', routes.api.pub_create);
app.delete('/api/pubs/:id', routes.api.pub_delete);

app.get('/api/pubs/near/:lon/:lat', routes.api.pubs_near);
app.get('/api/pubs/distances/:lon/:lat', routes.api.pubs_near_with_distances);

app.listen(3000);
