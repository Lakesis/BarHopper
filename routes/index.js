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


exports.authenticate = function(req, res){
	User.authenticate(req.body.loginId, req.body.password, function(user){
		if(user){
			res.redirect(req.body.redirect || '/');
		} else {
			res.render('login', {section: 'login', redirect: req.query.redirect});
		}
		
	});
};

exports.authenticate = function(req, res){
	User.newUser(req.body.loginId, req.body.password, function(err){
		if(!err){
			res.redirect('/',{});
		} else {
			res.render('login', {section: 'login', redirect: req.query.redirect});
		}
		
	});
	
};