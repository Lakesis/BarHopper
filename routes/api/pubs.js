<<<<<<< HEAD:routes/api/index.js
var mongoose = require('mongoose'),
crypto = require('crypto');

//TODO - Put in model file

mongoose.connect('mongodb://pablo:development@pablogil.org/barhopper-dev');


// Users

var userSchema = new mongoose.Schema({
	loginId : { type: String, index: { unique: true } },
	encryptedPassword : String,
	userName : String,
	salt: String
});

userSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

userSchema.virtual('password').set(function(password){
    this._password = password;
    this.salt = this.makeSalt();
    this.encryptedPassword = this.encryptPassword(password);
}).get(function() { return this._password; });

userSchema.methods.authenticate = function(plainText) {
	return this.encryptPassword(plainText) === this.encryptedPassword;
};

userSchema.methods.makeSalt = function() {
	return Math.round((new Date().valueOf() * Math.random())) + '';
};

userSchema.methods.encryptPassword = function(password) {
	return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

mongoose.model('User', userSchema);
var User = mongoose.model('User'),
userAPI = {};

userAPI.authenticate = function(loginId, password, callback){
	User.findOne({loginId : loginId},function(err, user) {
		if(!err){
			if(user.authenticate(password)){
				return callback(null, user);
			} else {
				return callback(new Error('User could not be authenticated'));
			}
		}else{
			return callback(err);
		}
	});
};

userAPI.newUser = function(loginId, password, callback){
	var user = new User({loginId: loginId, password: password });
	if(user.password && user.password.length){
		user.save(function(err) {
			if (!err) {
				return callback(null, user);
			}else{
				return callback(err);
			};
		});
	} else {
		return callback(new Error('Password is empty'));
	}
};

exports.userAPI = userAPI;

=======
var mongoose = require('mongoose');
>>>>>>> server side cleaning:routes/api/pubs.js
// Pubs

var pubSchema = new mongoose.Schema({
	name : { type: String, index: { unique: true } },
	address: String,
	suburb: String,
	state: String,
	postcode: Number,
	phone: String,
	url: String,
	description: String,
	location:{
		lon: Number,
		lat: Number
	}
},
	{
		toObject: {
			virtuals: true
		}
	}
);

pubSchema.virtual('id').get(function(){ return this._id.toString()});

mongoose.model('Pub', pubSchema);
var Pub = mongoose.model('Pub'); 

exports.listAll = function(req, res){
	Pub.find(function(err, pubs) {
		var flatPubs = pubs.map(function(pub){
			return pub.toObject();
		});
		return res.send(JSON.stringify(flatPubs));
	});
};

exports.findById = function(req, res){
    Pub.findById(req.params.id, function(err, pub) {
        if (!err) {
            return res.send(pub);
        }
    });
};

exports.update = function(req, res){
    Pub.findById(req.params.id, function(err, pub) {
        pub.name = req.body.name;
        pub.address = req.body.address;
        pub.save(function(err) {
            if (!err) {
                console.log("updated");
            }
            return res.send(pub);
        });
    });
};

exports.create = function(req, res){
    var pub;
    pub = new Pub({
        name: req.body.name,
        address: req.body.address
    });
    pub.save(function(err) {
        if (!err) {
            return console.log("created");
        }
    });
    return res.send(pub);
};

exports.remove = function(req, res){
    Pub.findById(req.params.id, function(err, pub) {
        pub.remove(function(err) {
            if (!err) {
                console.log("removed");
                return res.send('')
            }
        });
    });
};

exports.nearDistance = function(req, res){

    var lon = parseFloat(req.params.lon),
	lat = parseFloat(req.params.lat),
	range = 300 / 6378, //300KM (result in radians, earth radius is 6378km)
    numberOfPubs = 6;

    Pub.db.db.executeDbCommand({geoNear : "pubs", near : [lon,lat], spherical: true, maxDistance : range, num : numberOfPubs  }, function(err,pubs) {
        if (!err) {
            console.log(pubs.documents[0].results);
            return res.send(pubs.documents[0].results);
        }
    });
};

exports.near = function(req, res){

    var lon = parseFloat(req.params.lon),
    lat = parseFloat(req.params.lat),
	numberOfPubs = 20;

    Pub.find({location: {$near: [lon,lat]}},null,null,function(err,pubs){
        if (!err) {
            console.log("Long:" + req.params.lon + ",Lat:" + req.params.lat);
            return res.send(pubs);
        }
    }).limit(numberOfPubs);
};





