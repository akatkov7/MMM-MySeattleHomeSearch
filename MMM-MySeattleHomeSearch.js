Module.register("MMM-MySeattleHomeSearch", {
    // Default module config.
    defaults: {
        text: "Hello World!"
    },

    start: function() {
        Log.log('Starting module: ' + this.name);

        // Set up the local values, here we construct the request url to use
        this.firstLoad = true;
        this.loaded = false;
		this.url = 'https://www.myseattlehomesearch.com/property-search/res/includes/search_application/get_listings.asp';
        this.parameters = {	
            'searchParameters': '{"searchType":"gallery","adminUserId":-1,"clientSearch":{"id":"79367","active":false,"type":1,"featuredFirst":false},"favorite":false,"mlsRegionId":69,"mlsRegions":"69","listingClass":1,"listingStatus":"Active","quickSearch":{"mls":"","address":"","type":-1},"search":{"acreage":{"max":"","min":""},"age":{"min":0},"baths":{"max":100,"min":""},"beds":{"max":100,"min":""},"daysOnMarket":3,"extra":{"basement":"","construction":"","energy":"","exterior":"","fencing":"","interior":"","lots":"","owner":"","stories":"","styles":"","searchFeatures":""},"filter":{"excludeMLSIds":"","includeAgentIds":"","includeMLSIds":"","includeOfficeIds":""},"flags":{"acrossStreetFromOcean":false,"bayFront":false,"beachfront":false,"equestrian":false,"foreclosure":false,"golfCourseFront":false,"gulfFront":false,"hdPhotos":false,"hudHome":false,"mbOnFirstFloor":false,"newConstruction":false,"oceanFront":false,"openHouse":false,"pool":false,"reo":false,"shortSale":false,"singleLevel":false,"spa":false,"viewScenic":false,"virtualTour":false,"waterFront":false,"woodedLot":false,"hasPhoto":false},"garageCap":{"min":2},"hoaFees":{"max":"","min":""},"supportedListTypes":"1,2,4,5,6","listType":"1","listTypeDescrip":"","location":{"areas":"","cities":"","condoProjectNames":"","counties":"King","schools":"","states":"","subAreas":"","subDivisions":"","townships":"","zips":"","elementarySchools":"","middleSchools":"","highSchools":"","juniorHighSchools":""},"map":{"eastLong":"","northLat":"","searchRegion":"","southLat":"","westLong":"","centerLat":"","centerLong":"","zoomLevel":""},"alert":{"startDate":"","priceChangeDate":""},"price":{"max":1250000,"min":""},"priceReductionPercentage":"","soldDays":"","openHouseDays":0,"openHouseType":0,"priceChangeDays":0,"sortBy":"m.DateListed DESC","sqft":{"max":"","min":""},"yearBuilt":{"max":"","min":""},"offset":{"pageSize":12,"pageNumber":1,"listingId":""},"statusActivityDays":""},"searchId":-1,"userId":""}',
            'pageSize': 12,
            'pageNumber': 1,
        }
        this.index = 0;

        // Trigger the first request
        this.getHomeData(this);
    },

    getStyles: function() {
        return ['myseattlehomesearch.css', "https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"];
    },

    getHomeData: function(_this) {
        // Make the initial request to the helper then set up the timer to perform the updates
        _this.sendSocketNotification('GET-HOME-DATA', { url: _this.url, parameters: _this.parameters});
        setTimeout(_this.getWeatherData, 3600, _this);
    },

    // Override dom generator.
    getDom: function() {
        // We must load the leaflet js _after_ the css, so we cannot rely on getScripts.
        // Instead, on the first dom request, add a <script> tag and trigger a dom refresh
        // once leaflet.js is loaded.
        if (this.firstLoad) {
            this.firstLoad = false;
    
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = () => {
                console.debug("leaflet.js loaded");
                this.updateDom();
            };
    
            script.src = "https://unpkg.com/leaflet@1.7.1/dist/leaflet.js";
            document.querySelector("head").appendChild(script);
            return document.createElement("span");
        }


        var wrapper = document.createElement("div");
        wrapper.style.width = '200px';
        if (!this.loaded) {
            wrapper.innerHTML = this.translate('LOADING');
            return wrapper;
        }
        // show all homes
        // const table = document.createElement('table');
        // table.style.width = '400px';
        // table.style.lineHeight = '0.15em';
        // for (const home of this.homes) {
        //     const tableRow = table.insertRow();
        //     tableRow.insertCell().appendChild(this.createP(home.address1, 'homeText'));
        //     tableRow.insertCell().appendChild(this.createP(home.price, 'homeText'));
        // }
        // wrapper.appendChild(table);
        
        // show one home
        const home = this.homes[this.index];
        const mapDiv = document.createElement("div");
        mapDiv.classList.add("map");
        mapDiv.style.width = "200px";
        mapDiv.style.height = "200px";
        // Create the map
        const map = L.map(mapDiv, {
            zoomControl: false
        }).setView([47.6136, -122.2267], 9);
        // Set up the MapBox layer
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            // attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            attribution: '',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: this.config.mapboxApiKey,
        }).addTo(map);
        wrapper.appendChild(mapDiv);
        L.marker([home.lat, home.lon]).addTo(map)
        this.map = map;
        wrapper.appendChild(this.createImg(home.image, 'homeImage'));
        wrapper.appendChild(this.createP(home.address1, 'homeText'));
        wrapper.appendChild(this.createP(home.address2, 'homeText'));
        wrapper.appendChild(this.createP(home.price, 'homeText'));
        wrapper.appendChild(this.createP(`${home.beds} beds`, 'homeText'));
        wrapper.appendChild(this.createP(`${home.baths} baths`, 'homeText'));
        wrapper.appendChild(this.createP(`${home.sqft} sqft`, 'homeText'));
        wrapper.appendChild(this.createP(`${home.daysOn} days on market`, 'homeText'));

        // We need to wait until the div is added, then we need to invalidateSize()
        // in order for the map to behave correctly. This is brittle, but seems to do the trick.
        const observer = new MutationObserver(mutations => {
            map.invalidateSize(false);
            observer.disconnect();
        });
    
        observer.observe(mapDiv, {
            attributes: true,
            childList: true,
            subtree: true
        });

        // TODO: figure how not to do this
        setTimeout(() => {
            map.invalidateSize();
        }, 1500);

        return wrapper;
    },

    createP: function(text, classes) {
        const p = document.createElement('p');
        p.innerHTML = text;
        p.className = classes;
        return p;
    },

    createImg: function(src, classes) {
        const img = document.createElement('img');
        img.src = src;
        img.className = classes;
        return img;
    },

    showNextHouse: function() {
        this.index = (this.index + 1) % this.homes.length;
        this.updateDom(1000);
    },

    socketNotificationReceived: function(notification, payload) {
        // check to see if the response was for us and used the same url
        if (notification === 'GOT-HOME-DATA' && payload.url === this.url) {
            // we got some data so set the flag, stash the data to display then request the dom update
            this.loaded = true;
            this.homes = payload.homes;
            this.index = -1;
            this.showNextHouse();
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
            this.intervalId = setInterval(() => {
                this.showNextHouse();
            }, 5000);
        }
    },
});