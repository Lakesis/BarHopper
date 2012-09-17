var mongoose = require('mongoose'),
crypto = require('crypto'),
db = mongoose.createConnection('mongodb://pablo:development@pablogil.org/barhopper-dev');

//mongoose.connect('mongodb://pablo:development@pablogil.org/barhopper-dev');

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
var User = mongoose.model('User');

exports.authenticate = function(loginId, password, callback){
	User.findOne({loginId : loginId},function(err, user) {
		if(!err){
			if(user!== null && user.authenticate(password)){
				callback(null, user);
			} else {
				callback('User could not be authenticated');
			}
		}else{
			callback(err);
		}
	});
};

exports.newUser = function(loginId, password, callback){
	var user = new User({loginId: loginId, password: password });
	if(user.password && user.password.length){
		user.save(function(err) {
			if (!err) {
				callback(null, user);
			}else{
				callback(err);
			};
		});
	} else {
		callback("Password is empty");
	}
};
