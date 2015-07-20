var request = require('request');
var cheerio = require('cheerio');
var yelp = require('yelp').createClient({
	consumer_key: 'RcSuxhO-6iEhSIk3UvJeag',
	consumer_secret: 'ymVgSTqtq-E1Dv7QWztGT8OWxro',
	token: 'CrNbBqwxncKcaDw334WyNjFNqsxlISEh',
	token_secret: 'gSd7urb0_diYt_XiJH5_UbAT4cI'
});
var async = require('async');

// scrape the Open Table NYC Restaurant Week website
request('http://www.opentable.com/promo.aspx?pid=69&m=8', function(error, response, html) {
	if (!error && response.statusCode == 200) {
		var $ = cheerio.load(html, {
			normalizeWhitespace: true,
			decodeEntities: true
		});
		var restaurants = [];
		var calls = [];

		$('div.rest-row-info').each(function(i, element) {
			var restaurant = $(this).find($('a.rest-name')).text().trim();
			var meta = $(this).find($('div.rest-row-meta')).text().trim().split('|');
			calls.push(function(callback) {
				yelp.search({
					term: restaurant,
					location: 'New York, NY',
					limit: 1
				}, function(error, data) {
					if (!error && data.total > 0) {
						var yelp_business = data.businesses[0];

						restaurants.push({
							name: restaurant,
							yelp_name: yelp_business.name,
							yelp_rating: yelp_business.rating,
							yelp_review_count: yelp_business.review_count,
							cuisine: meta[0].trim(),
							district: meta[1].trim()
						});
					}
					callback(null);
				});
			});

		});

		async.parallel(calls, function(err) {
			if (err) return err;
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