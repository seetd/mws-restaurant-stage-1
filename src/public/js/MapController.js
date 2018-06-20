import DataService from './DataService';

const endpoint = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}';
const attribution = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

export default class MapController {
    constructor(options) {
        const {
            window,
            document,
            container,
            mapboxToken
        } = options;
        this.window = window;
        this.document = document;
        this.container = container;
        this.mapboxToken = mapboxToken;
        this.dataService = new DataService();
        this.markers = [];
    }

    /**
     * Initialize leaflet map, called from HTML.
     */
    render(options, postConfigure) {
        const {
            lat,
            lng,
            zoom,
            scrollWheelZoom,
            maxZoom,
            id
        } = options;

        this.map = L.map(this.container, {
            center: [lat, lng],
            zoom: zoom,
            scrollWheelZoom: scrollWheelZoom
        });

        L.tileLayer(endpoint, {
            mapboxToken: this.mapboxToken,
            maxZoom: maxZoom,
            attribution: attribution,
            id: id
        }).addTo(this.map);
    }

    /**
     * Map marker for a restaurant.
     */
    addMarker(restaurant) {
        // https://leafletjs.com/reference-1.3.0.html#marker  
        const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
            title: restaurant.name,
            alt: restaurant.name,
            url: this.dataService.urlForRestaurant(restaurant)
        })
        marker.on("click", () => {
            this.window.location.href = marker.options.url;
        });
        marker.addTo(this.map);
        this.markers.push(marker);
    }

    /**
     * Clear markers.
     */
    clearMarkers() {
        this.markers.forEach(m => m.remove());
        this.markers = [];
    }    
}