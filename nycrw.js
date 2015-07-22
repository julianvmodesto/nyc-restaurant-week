var request = require('request');
var cheerio = require('cheerio');
var yelp = require('yelp').createClient({
	consumer_key: 'RcSuxhO-6iEhSIk3UvJeag',
	consumer_secret: 'ymVgSTqtq-E1Dv7QWztGT8OWxro',
	token: 'CrNbBqwxncKcaDw334WyNjFNqsxlISEh',
	token_secret: 'gSd7urb0_diYt_XiJH5_UbAT4cI'
});
var async = require('async');

// scrape the NYC Restaurant Week website
request('http://m.nycgo.com/rw', function(error, response, html) {
	if (!error && response.statusCode == 200) {
		var $ = cheerio.load(html, {
			normalizeWhitespace: true,
			decodeEntities: true
		});

		var restaurants = [];
		var calls = [];

		$('li.arrow').each(function(i, element) {
			var restaurant = $(this).find($('a')).text().trim();
			var neighborhood = $(this).find($('div.venue_distance')).text().trim();
			var mealtypes = $(this).find($('div.venue_mealtypes')).text().trim();

			// filter out only M-F and Sunday lunch / brunch
			// filter out bad Yelp results
			if ((mealtypes.indexOf('Lunch') > -1 || mealtypes.indexOf('L/B') > -1)) {
				var search_term = (restaurant.indexOf(' - ') > -1) ? restaurant.substring(0, restaurant.indexOf(' - ')) : restaurant;

				calls.push(function(callback) {
					yelp.search({
						term: search_term,
						location: 'New York, NY',
						limit: 1
					}, function(error, data) {
						if (!error && data.total > 0) {
							var yelp_business = data.businesses[0];
							restaurants.push({
								name: restaurant,
								neighborhood: neighborhood,
								mealtypes: mealtypes,
								yelp_name: yelp_business.name,
								yelp_rating: yelp_business.rating,
								yelp_review_count: yelp_business.review_count
							});
						}
						callback(null);
					});
				});
			}
		});

		async.parallel(calls, function(err) {
			if (err) return err;
			restaurants = restaurants.filter(function(el) {
				return el.yelp_rating >= 4 && el.yelp_review_count > 150;
			});
			restaurants.sort(function(a, b) {
				if (a.yelp_rating == b.yelp_rating) {
					return (a.yelp_review_count > b.yelp_review_count) ? -1 : (a.yelp_review_count < b.yelp_review_count) ? 1 : 0;
				} else {
					return (a.yelp_rating > b.yelp_rating) ? -1 : 1;
				}

			});
			console.log(restaurants);
		});
	}
});