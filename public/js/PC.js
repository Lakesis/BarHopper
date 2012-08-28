var PC = {};

PC.core = (function(core, $, mediator, undefined){
	
	var section,
	step
	;
	
	
	var wizardManager = function(){

		//	Main object storing the pubs
		var pubCrawl = [],
		// Pub data retrieved from the system via AJAX
		pubs = [];
		
		mediator.on('mapInitialised', function(){
			 PC.wizard.init();
		});		
		
		
		
		// Pub added to the Pub Crawl
		mediator.on('addPub', function(data){
			var id = data[0],
			newPub = true;
			
			for(index in pubCrawl){
				if(pubCrawl[index].id === id) newPub = false;  
			}
			if (newPub) pubCrawl.push(pubs[id]);

			PC.mapManager.manageMarkers({control: 'select', id: id});
			PC.mapManager.route({pubCrawl:pubCrawl, travelMode : 'WALKING'});
		//	PC.wizard.updateTimeline(pubCrawl);
		});
		
		// Pub deleted from the Pub Crawl
		mediator.on('deletePub', function(data){
			for(var i=0, l = pubCrawl.length; i<l; i++){
				if(pubCrawl[i].id === data[0]) pubCrawl.splice(i,1) 
			}
			PC.mapManager.manageMarkers({control: 'remove', id: data[0]})
			PC.mapManager.route({pubCrawl:pubCrawl, travelMode : 'WALKING'});
			PC.wizard.updateTimeline(pubCrawl);
		});
		
		// Pub modified from the Pub Crawl
		mediator.on('modifyPubCrawl', function(data){
			pubCrawl = [];
			var list = data[0];
			for(var i=0, l=list.length; i<l; i++){ 
				pubCrawl.push(pubs[list[i]]);
			}
			PC.mapManager.route({pubCrawl:pubCrawl, travelMode : 'WALKING'});
			PC.wizard.updateTimeline(pubCrawl);
		});
		
		// Pub details displayed
		mediator.on('displayPubDetails', function(data){
			var id = data[0], 
			pub = {};
			for(var i=0, l = pubs.length; i<l; i++){
				if(pubs[i].id === id) pub = pubs[i];
			}
			PC.wizard.displayPubDetails(pub);
		});
		
		// MAP OPTIONS
		function launchMap(){
			if(pubs.length > 0){
				var map = {
					element : $('#mapContainer')[0],
					options : {
						center: new google.maps.LatLng(-33.859635,151.208701),
						zoom: 17,
						panControl: false,
						streetViewControl: false,
						zoomControl: true,
						zoomControlOptions: {
							style: google.maps.ZoomControlStyle.SMALL
						},
						mapTypeControl: true,
						mapTypeControlOptions: {
							position: google.maps.ControlPosition.TOP_LEFT
						},
						mapTypeId: google.maps.MapTypeId.ROADMAP
					}
				},
				directions = {
					options : {
						draggable : true,
						suppressMarkers : true,
						preserveViewport : true
					}
				}
				
				PC.mapManager.init({mode:'wizard',map : map, directions : directions, pubs : pubs});
			}
		};
		
		$.ajax({
            type:       'GET',
            url:        '/api/pubs', //Test - get pubs near Lord Nelson
            //url:        '/api/pubs/near/151.187148/-33.879697/',   //Test - get pubs near Ancient Briton
            dataType:   'json',
            async:      false,
            data:       {},
            success:function(data) {
			console.log(data);
                    temp_pubs = data;
                    for (var i = 0; i < temp_pubs.length; i++) {
                        temp_pubs[i].latlng = new google.maps.LatLng(temp_pubs[i].location.lat,temp_pubs[i].location.lon);						
                        pubs.push(temp_pubs[i]);
                    }
				launchMap();
            }
        });
	};
	
	var init = function(){
		var mapping = {
			wizard : wizardManager
		};
			
		$(document).ready(function(){
			section = $('body').data('section');
			step = $('body').data('step');
			
			if(mapping[section]) mapping[section]();
			
		});
	}();
	
	return core;

})(PC.core || {}, jQuery, mediator);

PC.utils = (function(utils, $, undefined){

	// Hash table object implementation
	utils.HashTable = function(){
		this.table = {},
		this.length = 0
	};
	utils.HashTable.prototype = {	
		hasItem : function(key){
			return this.table.hasOwnProperty(key);
		},		
		getItem : function(key) {
			return this.hasItem(key) ? this.table[key] : undefined;
		},
		setItem = function(key, value){
			if(!this.hasItem(key)) {
				this.length++;
			}
			this.table[key] = value;
			
			return this;
		},
		remove : function(key){
			if(this.hasItem(key)){
				this.length--;
				delete this.table[key];
			}
			return this;
		},
		keys :  function(){
			var keys = [];
			for (var k in this.table){
				if(this.hasItem(k)){
					keys.push(k);
				}
			}
			return keys;
		},
		values :  function(){
			var values = [];
			for (var k in this.table){
				if(this.hasItem(k)){
					values.push(this.table[k]);
				}
			}
			return values;
		},
		each : function(fn){
			for(var k in this.table){
				if(this.hasItem(k)){
					fn(k, this.table[k]);
				}
			}
			return this;
		},
		reset : function(){
			this.length = 0;
			delete this.table; 
			this.table = {}; 
			
			return this;
		}
	};

	return utils;

})(PC.utils || {}, jQuery);

PC.mapManager = (function(mapManager, $, mediator, undefined){

	var map,
	directionsDisplay,
	directionsService,
	polyline,
	// Array of markers placed in the map
	markers = []
	;
	
	var loadBars = function(pubs){
		for (var i=0, l = pubs.length; i<l; i++){
			var marker = new google.maps.Marker({
				position: pubs[i].latlng,
				map: map,
				icon : 'resources/images/pub_marker_unselected.png'
			});
			marker.set('id', pubs[i].id);	// marker gets the id of the pub
			markers[pubs[i].id] = marker;	// gets indexed in the its id
			// Display details
			google.maps.event.addListener(marker,'click', function() {
				if (mediator) mediator.publish('displayPubDetails',this.get('id'));
				else console.log('mediator is missing');
			});
			// Gets added
			google.maps.event.addListener(marker,'dblclick', function() {
				if (mediator) mediator.publish('addPub',this.get('id'));
				else console.log('mediator is missing');
			});
			google.maps.event.addListener(marker, 'mouseover', function() {
				this.setIcon('resources/images/pub_marker_unselected_highlight.png');
			});
			google.maps.event.addListener(marker, 'mouseout', function() {
				this.setIcon('resources/images/pub_marker_unselected.png');
			});				
		}
	};
	
	mapManager.manageMarkers = function(config){
	
		var baseImageUrl = 'resources/images/pub_marker_',
		marker = markers[config.id];
		
		if(config.control === 'select') baseImageUrl += 'selected';
		else  baseImageUrl += 'unselected';
		
		marker.setIcon(baseImageUrl+'.png');
		
		google.maps.event.addListener(marker, 'mouseover', function() {
			this.setIcon(baseImageUrl+'_highlight.png');
		});
		google.maps.event.addListener(marker, 'mouseout', function() {
			this.setIcon(baseImageUrl+'.png');
		});	
	};
	
	mapManager.init = function(config){
		map = new google.maps.Map(config.map.element, config.map.options);
		directionsDisplay = new google.maps.DirectionsRenderer(config.directions.options);
		directionsService = new google.maps.DirectionsService();
		directionsDisplay.setMap(map);
		
	/*	var $wizardSearchBar = $('<div id="wizardSearch"><input type="text" value="Search" name="wizardSearchBar" id="wizardSearchBar"/></div>');
		map.controls[google.maps.ControlPosition.TOP_LEFT].push($wizardSearchBar[0]);*/

		if (config.pubs.length > 0){
			loadBars(config.pubs)
		} else console.log('Pubs object is empty');
		
		google.maps.event.addListener(map, 'click', function(e) {
			// Handle adding a new venue
		});
		
		/*
			Handle click in path
			Handle drag in path
		*/
		
		if (mediator){ mediator.publish('mapInitialised');  }
		else console.log('mediator is missing');
	};
	
	mapManager.staticMapURL = function(config){
	
		var url = 'http://maps.googleapis.com/maps/api/staticmap?',
		center = 'center='+map.center,
		zoom = '&zoom'+config.zoom,
		size = '&size='+config.size,
		scale = '&scale='+config.scale,
		maptype = '&maptype='+config.maptype,
		markers = '&markers=icon:resources/images/pub_marker_unselected.png%7',
		path = '&path=enc:'+polyline,
		sensor = '&sensor='+config.sensor
		;
		
		for (var i=0, l = config.pubCrawl.lenght; i<l; i++){
			markers += config.pubCrawl[i].latlng + '%7';
		}
		
		return url+center+zoom+size+scale+maptype+markers+path+sensor;
	};
	
	mapManager.route = function(config){
		
		var request = {
			travelMode :  google.maps.TravelMode[config.travelMode]
		};
		
		if(config.pubCrawl.length > 1){ 
			request.origin = config.pubCrawl[0].address;
			request.destination = config.pubCrawl[config.pubCrawl.length-1].address;
			request.waypoints = [];
			for (var i=1, l = config.pubCrawl.length-1; i<l; i++) { 
				request.waypoints.push({
					location: config.pubCrawl[i].address,
					stopover: true
				});
			}
			directionsService.route(request, function(response, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					polyline = response.routes[0].overview_polyline.points;
					directionsDisplay.setMap(map);	
					directionsDisplay.setDirections(response);
				  // Handle distances
				}
			});
		} else {
			directionsDisplay.setMap(null);		
		}
		
	};
	
	return mapManager;

})(PC.mapManager || {}, jQuery, mediator);


PC.wizard = (function(wizard, $, mediator, undefined){
	
	var $timeline,
	$sidePanel
	;
	
	var controlSidePanel = function(control){
		var mode = {
			toggle : function(){
				if($sidePanel.is(':visible'))  $sidePanel.hide("blind", { direction: "right" });
				else $sidePanel.show("blind", { direction: "left" });
			},
			open : function(){
				if(!$sidePanel.is(':visible'))  $sidePanel.show("blind", { direction: "right" });
			},
			close : function(){
				if($sidePanel.is(':visible'))  $sidePanel.hide("blind", { direction: "right" });
			},
		};
		mode[control]();
	};
	
	wizard.init = function(){
		$timeline = $('#timeline');
		$sidePanel = $('#sidePanel');
		var $timeList = $timeline.find('ul');
		$timeList.sortable();
		
		// Close panel
		$('a.closePanel').click(function(e){
			e.preventDefault();
			$sidePanel.data('id','');
			controlSidePanel('close');
		});
		
		//Add a pub from the panel
		$('a.addPub').click(function(e){
			e.preventDefault()
			var pubId = $sidePanel.data('id');
			if (mediator) mediator.publish('addPub',pubId);
			else console.log('mediator is missing');
		});
		
		// Remove a pub
		$(document).on("click","a.deletePub", function(e){
			e.preventDefault(); 
			if (mediator) mediator.publish('deletePub',$(this).parent().data('id'));
			else console.log('mediator is missing');
		});
		
		// Display pub details
		$(document).on("click","span.pubName", function(e){
			e.preventDefault();
			if (mediator) mediator.publish('displayPubDetails',$(this).parent().data('id'));
			else console.log('mediator is missing');
		});
		
		// Modify Pub Crawl arrangement
		$timeList.on('sortstop', function(e){
			var idList = [];
			$(this).find('li').each(function(i,el){
				idList.push($(el).data('id'));
			});
			if (mediator){ mediator.publish('modifyPubCrawl', idList);}
			else console.log('mediator is missing');
		});
		if (mediator){ mediator.publish('wizardInitialised');}
		else console.log('mediator is missing');
	};
	
	wizard.displayPubDetails = function(pub){
		$sidePanel.find('#pubName').text(pub.name).end().find('#pubAddress').text(pub.address);
		$sidePanel.data('id',pub.id);
		controlSidePanel('open');
	};
	
	wizard.updateTimeline = function(pubCrawl){
		var	$target = $timeline.find('ul').html(''),
		$item = $('<li><a href="" class="deletePub"></a><span class="pubName"></span></li>'),
		aux
		;
		for(var i=0, l=pubCrawl.length; i<l; i++){ 
			aux = $item.clone();
			aux.data('id',pubCrawl[i].id).find('.pubName').text(pubCrawl[i].name);
			$target.append(aux);
		}
	};

	return wizard;

})(PC.wizard || {}, jQuery, mediator);