var mongoose = require('mongoose');

mongoose.connect('mongodb://pablo:development@pablogil.org/barhopper-dev');

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





