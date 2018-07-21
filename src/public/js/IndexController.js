import MapController from './MapController';
import DataService from './DataService';

function renderSelect(document, select, dataset, change) {
    dataset.forEach(item => {
        const option = document.createElement('option');
        option.innerHTML = item;
        option.value = item;
        select.append(option);
    });
    select.addEventListener("change", change);
}

export default class IndexController {
    constructor(window, document) {
        this.window = window;
        this.document = document;
        this.mapController = new MapController({
            window,
            document,
            container: 'map',
            mapboxToken: 'pk.eyJ1Ijoib3JlZGkiLCJhIjoiY2ppZHdiNXVwMDBpODNxcXAxdjl4OWVkayJ9.COiDvF28jozGjkmEqo_AYg'
        });
        this.dataService = new DataService(!!navigator.serviceWorker);
    }

    registerListener(event, func) {
        if (this.window.addEventListener) {
            this.window.addEventListener(event, func)
        } else {
            this.window.attachEvent('on' + event, func)
        }
    }

    lazyLoad(){
        for(var i=0; i<this.lazyImages.length; i++){
            if(this.isInViewport(this.lazyImages[i])){
                if (this.lazyImages[i].getAttribute('data-src')){
                    this.lazyImages[i].src = this.lazyImages[i].getAttribute('data-src');
                    this.lazyImages[i].removeAttribute('data-src');
                }
            }
        }
        
        this.cleanLazy();
    }
    
    cleanLazy(){
        this.lazyImages = Array.prototype.filter.call(this.lazyImages, function(l){ return l.getAttribute('data-src');});
    }

    isInViewport(element){
        var rect = element.getBoundingClientRect();
        
        return (
            rect.bottom >= 0 && 
            rect.right >= 0 && 
            rect.top <= (this.window.innerHeight || this.document.documentElement.clientHeight) && 
            rect.left <= (this.window.innerWidth || this.document.documentElement.clientWidth)
         );
    }    

    getRestaurantHTML(restaurant) {
        const li = this.document.createElement('li');
        li.tabIndex = "0";
        li.setAttribute("aria-label", "Restaurant Details");

        const image = this.document.createElement('img');
        image.className = 'restaurant-img';
        image.classList.add('lazy');
        image.setAttribute('data-src', this.dataService.imageUrlForRestaurant(restaurant));
        image.alt = restaurant.name;
        image.tabIndex = "0";
        li.append(image);

        const name = this.document.createElement('h1');
        name.innerHTML = restaurant.name;
        name.setAttribute("aria-label", `name ${restaurant.name}`);
        name.tabIndex = "0";
        li.append(name);

        const neighborhood = this.document.createElement('p');
        neighborhood.innerHTML = restaurant.neighborhood;
        neighborhood.setAttribute("aria-label", `neighborhood ${restaurant.neighborhood}`);
        neighborhood.tabIndex = "0";
        li.append(neighborhood);

        const address = this.document.createElement('p');
        address.innerHTML = restaurant.address;
        address.setAttribute("aria-label", `address ${restaurant.address}`);
        address.tabIndex = "0";
        li.append(address);

        const more = this.document.createElement('a');
        more.innerHTML = 'View Details';
        more.setAttribute('aria-label', `View ${restaurant.name}`)
        more.href = this.dataService.urlForRestaurant(restaurant);
        li.append(more)

        return li;
    }

    fetchRestaurantByCuisineAndNeighborhood(resolve, reject) {
        const cSelect = this.document.getElementById('cuisines-select');
        const nSelect = this.document.getElementById('neighborhoods-select');

        const cIndex = cSelect.selectedIndex;
        const nIndex = nSelect.selectedIndex;

        const cuisine = cSelect[cIndex].value;
        const neighborhood = nSelect[nIndex].value;

        return this.dataService
            .getAllRestaurants()
            .then(restaurants => {
                const filtered = this.dataService.filterRestaurantsByCuisineAndNeighborhood(restaurants, cuisine, neighborhood)
                resolve(filtered);
            })
            .catch(error => reject(error));     
    }

    render(isRefresh=false) {
        if(!isRefresh) {
            this.mapController.render({
                lat: 40.722216,
                lng: -73.987501,
                zoom: 12,
                scrollWheelZoom: false,
                maxZoom: 18,
                id: 'mapbox.streets'
            });
        }

        this.fetchRestaurantByCuisineAndNeighborhood(
            restaurants => {
                this.renderRestaurants(restaurants);
                this.renderNeighborhoods(restaurants);
                this.renderCuisines(restaurants);     
                this.lazyImages = this.document.getElementsByClassName('lazy');
                this.lazyLoad();
                this.registerListener('scroll', this.lazyLoad.bind(this));
                this.registerListener('resize', this.lazyLoad.bind(this));                 
            },
            error => console.error(error)
        );
    }

    renderRestaurants(restaurants) {
        // Clear existing data
        const ul = this.document.getElementById('restaurants-list');
        ul.innerHTML = '';

        // Remove all map markers
        this.mapController.clearMarkers();

        restaurants.forEach(restaurant => {
            ul.append(this.getRestaurantHTML(restaurant));
            this.mapController.addMarker(restaurant);
        });
    }

    /**
     * Renders the select control with the list of neighborhoods 
     * available in the supplied restaurants
     * @param {*} restaurants 
     */
    renderNeighborhoods(restaurants) {
        const neighborhoods = this.dataService.getAllNeighbourhoods(restaurants);
        const select = this.document.getElementById('neighborhoods-select');
        renderSelect(this.document, select, neighborhoods, this.updateRestaurants.bind(this));
    }

    /**
     * Renders the select control with the list of cuisines 
     * available in the supplied restaurants
     * @param {*} restaurants 
     */
    renderCuisines(restaurants) {
        const cuisines = this.dataService.getAllCuisines(restaurants);
        const select = this.document.getElementById('cuisines-select');
        renderSelect(this.document, select, cuisines, this.updateRestaurants.bind(this));
    }

    updateRestaurants() {
        this.fetchRestaurantByCuisineAndNeighborhood(
            restaurants => {
                this.renderRestaurants(restaurants);
            },
            error => console.error(error)
        );
    }
}