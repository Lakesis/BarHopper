/*
 * GET home page.
 */

var User = require('./api').userAPI;
 
exports.index = function(req, res){
	res.render('index', {section: 'index'});
};

exports.wizard = function(req, res){
	res.render('wizard', {section: 'wizard'});
};

exports.login = function(req, res){
	res.render('login', {section: 'login', redirect: req.query.redirect});
};

exports.logout = function(req, res){
	delete req.session.user;
	res.redirect('/');
};

exports.newUser = function(req, res){
	res.render('newUser', {section: 'newUser'});
};

exports.authenticate = function(req, res){
	User.authenticate(req.body.loginId, req.body.password, function(err, user){
		if(!err){
			if(user){
				req.session.user = user;
				res.redirect(req.body.redirect || '/');
			} else {
				console.log('Error authenticating user: '+err)
				res.render('login', {section: 'login', redirect: req.query.redirect});
			}
		} else {
			console.log('Error authenticating user: '+err)
			res.render('login', {section: 'login', redirect: req.query.redirect});
		}
	});
};

exports.createUser = function(req, res){
	User.newUser(req.body.loginId, req.body.password, function(err, user){
		if(!err){
			res.session.user = user;
			res.redirect('/');
		} else {
			console.log('Error creating user: '+err);
			res.render('newUser', {section: 'newUser'});
		}
		
	});
	
};