var unirest = require('unirest');
var express = require('express');
var events = require('events');

var app = express();
app.use(express.static('public'));


app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
	        var artist = item.artists.items[0];
	        var id = item.artists.items[0].id;
	        console.log(item.artists.items);
	        console.log('name: ', item.artists.items[0].name, '  id: ', id);

			var relatedReq = getFromApi('artists/' + id + '/related-artists', {});
			    relatedReq.on('end', function(item) {
					artist.related = item.artists;
			    	console.log(artist.related);
			    	res.json(artist);  // request finishes here
			    });
    });



    searchReq.on('error', function(code) {
        res.sendStatus(code);

	});
});
 


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


app.listen(8080, function(){ 
	console.log('server started at http://localhost:8080');
});

