var unirest = require('unirest');
var express = require('express');
var events = require('events');

var app = express();
app.use(express.static('public'));


// search for artist
app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {

    	// if search yields no results, throw error
        if (item.artists.items.length === 0) {
        	console.log('Search returned no results');
        	res.json('error');
        }

        else {
	        var artist = item.artists.items[0];
	        var id = item.artists.items[0].id;
	        console.log('name: ', item.artists.items[0].name, '  id: ', id);

        	// search for related artists based on artist id
			var relatedReq = getFromApi('artists/' + id + '/related-artists', {});
		    relatedReq.on('end', function(item) {
				artist.related = item.artists;				

			//	check related artists results	
		    //	console.log(artist.related);

		    	var count = 0;
		    	var relatedArtists = artist.related.length;
		    	

		    	// use 'item' parameter to get related artist results and not artist search
		    	artist.related.forEach(function(item) { 

		    		getTracks(item, function(error) {

		    			if (error) {
		    				console.log('getTracks error line 44');
		    				res.json('error');
		    			}

		    			count += 1;
		    			if ( count === relatedArtists ) {
		    				res.json(artist);  // request finishes here
		    			}
		    		});
		    	});	
			});
		}; 
		
    });

    searchReq.on('error', function(code) {
        res.sendStatus(code);
	});

});
 

var getTracks = function(artist, callback) {
	unirest.get('https://api.spotify.com/v1/artists/' + artist.id + '/top-tracks?country=US')
		.end(function(response) {
			if (response.ok) {
				artist.tracks = response.body.tracks;
				callback();
			
			}
			else {
				callback(response.error);
			}
		});
};

var getFromApi = function(endpoint, args) {
	var emitter = new events.EventEmitter();
	unirest.get('https://api.spotify.com/v1/' + endpoint)
		.qs(args)
		.end(function(response) {
			if (response.ok) {
				emitter.emit('end', response.body);
			}
			else {
				emitter.emit('error', response.code);
			}
		});
	return emitter;
};


// for local testing
//		app.listen(8080, function(){ 
//			console.log('server started at http://localhost:8080');
//		});

app.listen(process.env.PORT || 8080);

