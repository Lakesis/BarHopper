var mongoose = require('mongoose');

//TODO - Put in model file

mongoose.connect('mongodb://localhost/test');

var Pub = mongoose.model('Pub', new mongoose.Schema({})), //any thing goes schema
User = mongoose.model('User', new mongoose.Schema({})),

// Users

userAPI = {};
userAPI.authenticate = function(loginId, password, callback){
	User.find({loginId : loginId},function(err, user) {
		
	});
};

// Pubs
pubAPI = {};

pubAPI.listAll = function(req, res){ console.log('asdas');
	Pub.find(function(err, pubs) {
		return res.send(pubs);
	});
};

pubAPI.findById = function(req, res){
    Pub.findById(req.params.id, function(err, pub) {
        if (!err) {
            return res.send(pub);
        }
    });
};

pubAPI.update = function(req, res){
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

pubAPI.create = function(req, res){
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

pubAPI.remove = function(req, res){
    Pub.findById(req.params.id, function(err, pub) {
        pub.remove(function(err) {
            if (!err) {
                console.log("removed");
                return res.send('')
            }
        });
    });
};


pubAPI.nearDistance = function(req, res){

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

pubAPI.near = function(req, res){

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

exports.pubAPI = pubAPI;




