
var NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({

    start: function () {
        console.log('MMM-MySeattleHomeSearch helper, started...');
    },

    getHomeData: function(payload) {

        var _this = this;
        this.url = payload.url;
        this.parameters = payload.parameters;

        request.post({url: this.url, form: this.parameters}, function(error, response, body) {
            // Check to see if we are error free and got an OK response
            if (error || response.statusCode !== 200) {
                console.log(error);
                console.log(body);
                return;
            }
            // const dom = new JSDOM(body);
            const result = JSON.parse(body);
            // console.log(result);
            const homes = result.properties.map((h) => {
                return {
                    image: h.photos.url,
                    address1: h.address1,
                    address2: h.address2,
                    price: h.price,
                    beds: h.beds.count,
                    baths: h.baths.count,
                    sqft: h.sqft,
                    lat: h.lat,
                    lon: h.lon,
                    daysOn: h.daysOn.value,
                }
            });
            console.log(`Found ${homes.length} homes!`);

            // We have the response figured out so lets fire off the notifiction
            _this.sendSocketNotification('GOT-HOME-DATA', {
                'url': response.request.uri.href, 
                'homes': homes
            });
        });
    },


    socketNotificationReceived: function(notification, payload) {
        // Check this is for us and if it is let's get the weather data
        if (notification === 'GET-HOME-DATA') {
            this.getHomeData(payload);
        }
    }

});