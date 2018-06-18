import MapController from './MapController';
import DataService from './DataService';

export default class RestaurantController {
    constructor(window, document) {
        this.window = window;
        this.document = document;
        this.mapController = new MapController({
            window,
            document,
            container: 'map',
            mapboxToken: 'pk.eyJ1Ijoib3JlZGkiLCJhIjoiY2ppZHdiNXVwMDBpODNxcXAxdjl4OWVkayJ9.COiDvF28jozGjkmEqo_AYg'
        });
    }

    render() {
        return DataService
            .fetch
            .then(restaurants => {
                const id = parseInt(this.getParameterByName('id'));
                const restaurant = DataService.getByRestaurantId(id, restaurants);
                if (!restaurant) {
                    throw `Restaurant Id: ${id} is not valid`
                }

                this.fillBreadcrumb(restaurant);
                this.renderRestaurant(restaurant);
                this.renderMap(restaurant);                
            })
            .catch(error => console.log(error));
    }

    renderMap(restaurant) {
        this.mapController.render({
            lat: restaurant.latlng.lat,
            lng: restaurant.latlng.lng,
            zoom: 16,
            scrollWheelZoom: false,
            maxZoom: 18,
            id: 'mapbox.streets'
        });

        this.mapController.addMarker(restaurant);
    }

    renderRestaurant(restaurant) {
        const name = this.document.getElementById('restaurant-name');
        name.innerHTML = restaurant.name;
        name.tabIndex = "0";
        name.setAttribute("aria-label", `Name ${restaurant.name}`);

        const address = this.document.getElementById('restaurant-address');
        address.innerHTML = restaurant.address;
        address.tabIndex = "0";
        address.setAttribute("aria-label", `Address ${restaurant.address}`);

        const image = this.document.getElementById('restaurant-img');
        image.className = 'restaurant-img'
        image.src = DataService.imageUrlForRestaurant(restaurant);
        image.alt = restaurant.photograph_description;
        image.tabIndex = "0";

        const cuisine = this.document.getElementById('restaurant-cuisine');
        cuisine.innerHTML = restaurant.cuisine_type;
        cuisine.tabIndex = "0";
        cuisine.setAttribute("aria-label", `Cuisine ${restaurant.cuisine_type}`);

        // fill operating hours
        if (restaurant.operating_hours) {
            this.fillRestaurantHoursHTML(restaurant.operating_hours);
        }

        // fill reviews
        this.fillReviewsHTML(restaurant.reviews);
    }

    /**
     * Create restaurant operating hours HTML table and add it to the webpage.
     */
    fillRestaurantHoursHTML(operatingHours) {
        const hours = this.document.getElementById('restaurant-hours');
        hours.setAttribute("aria-label", "restaurant hours");
        hours.tabIndex = "0";
        for (let key in operatingHours) {
            const row = this.document.createElement('tr');
            row.tabIndex = "0";
            const day = this.document.createElement('td');
            day.innerHTML = key;
            row.appendChild(day);

            const time = this.document.createElement('td');
            time.innerHTML = operatingHours[key];
            row.appendChild(time);

            hours.appendChild(row);
        }
    }

    /**
     * Create all reviews HTML and add them to the webpage.
     */
    fillReviewsHTML(reviews) {
        const container = this.document.getElementById('reviews-container');
        const title = this.document.createElement('h2');
        title.innerHTML = 'Reviews';
        container.appendChild(title);

        if (!reviews) {
            const noReviews = this.document.createElement('p');
            noReviews.innerHTML = 'No reviews yet!';
            container.appendChild(noReviews);
            return;
        }
        const ul = this.document.getElementById('reviews-list');
        reviews.forEach(review => {
            ul.appendChild(this.createReviewHTML(review));
        });
        container.appendChild(ul);
    }

    /**
     * Create review HTML and add it to the webpage.
     */
    createReviewHTML(review) {
        const li = this.document.createElement('li');
        const name = this.document.createElement('p');
        li.tabIndex = "0";
        name.innerHTML = review.name;
        li.appendChild(name);

        const date = this.document.createElement('p');
        date.innerHTML = review.date;
        li.appendChild(date);

        const rating = this.document.createElement('p');
        rating.innerHTML = `Rating: ${review.rating}`;
        li.appendChild(rating);

        const comments = this.document.createElement('p');
        comments.innerHTML = review.comments;
        li.appendChild(comments);

        return li;
    }

    /**
     * Add restaurant name to the breadcrumb navigation menu
     */
    fillBreadcrumb(restaurant) {
        const breadcrumb = this.document.getElementById('breadcrumb');
        const li = this.document.createElement('li');
        li.innerHTML = restaurant.name;
        breadcrumb.appendChild(li);
    }

    /**
     * Get a parameter by name from page URL.
     */
    getParameterByName(name, url) {
        if (!url)
            url = this.window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
            results = regex.exec(url);
        if (!results)
            return null;
        if (!results[2])
            return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
}