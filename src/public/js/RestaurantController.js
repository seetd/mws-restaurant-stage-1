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
        this.dataService = new DataService(!!navigator.serviceWorker);
        this.id = parseInt(this.getParameterByName('id'));
        let form = this.document.getElementById('reviews-form');
        form.addEventListener("submit", (event) => this.addReview(event));
    }

    render(isRefresh=false) {
        return this.dataService
            .getByRestaurantId(this.id)
            .then(restaurant => {
                if (!restaurant) {
                    throw `Restaurant Id: ${this.id} is not valid`
                }                
                this.fillBreadcrumb(restaurant);
                this.renderRestaurant(restaurant);
                const reviewErrors = this.document.getElementById('review-errors');
                reviewErrors.innerHTML = '';
                if (reviewErrors.childNodes.length > 0) reviewErrors.removeChild(reviewErrors.childNodes[0]);
                if(!isRefresh) this.renderMap(restaurant, isRefresh);
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

        this.mapController.clearMarkers();
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
        image.src = this.dataService.imageUrlForRestaurant(restaurant);
        image.alt = restaurant.name;
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

    async addReview(event) {
        event.preventDefault();
        const name = this.document.getElementById('name');
        const rating = this.document.getElementById('rating');
        const comments = this.document.getElementById('comments');
        const reviewErrors = this.document.getElementById('review-errors');
        const errors = await this.dataService.addReview({
            restaurant_id: this.id,
            name: name.value,
            rating: rating.value,
            comments: comments.value,
        });

        if (errors.length === 0) {
            name.value = '';
            rating.value = '';
            comments.value = '';
            name.setAttribute('aria-invalid', 'false');
            rating.setAttribute('aria-invalid', 'false');
            comments.setAttribute('aria-invalid', 'false');
            if (reviewErrors.childNodes.length > 0) reviewErrors.removeChild(reviewErrors.childNodes[0]);
        } else {
            const container = this.document.createElement('div');
            container.id = 'review-errors-container';
            const header = this.document.createElement('p');
            header.id = 'review-errors-header';
            header.innerText = `${errors.length} error${errors.length > 1 ? 's': ''} are found in the submission.`
            container.appendChild(header);
            const list = this.document.createElement('ul');
            errors.forEach(error => {
                const item = this.document.createElement('li');
                let text;
                switch(error) {
                    case 'name':
                        text = 'name cannot be null or empty';
                        name.setAttribute('aria-invalid', 'true');
                        break;
                    case 'rating':
                        text = 'rating cannot be null or empty';
                        rating.setAttribute('aria-invalid', 'true');
                        break;
                    case 'comments':
                        text = 'comments cannot be null or empty';
                        comments.setAttribute('aria-invalid', 'true');
                        break;
                    case 'fetch':
                        text = 'Network connection is unavailable. Data will be resent when the connection is available.';  
                        name.value = '';
                        rating.value = '';
                        comments.value = '';
                        break;                                          
                }
                item.innerText = text;
                list.appendChild(item);
            });
            container.appendChild(list);
            const existingContainer = this.document.getElementById('review-errors-container');
            if (existingContainer) {
                reviewErrors.replaceChild(container, existingContainer);
            } else {
                reviewErrors.appendChild(container);
            }
        }
        this.fillReviewsHTML(await this.dataService.getCachedReviews(this.id));
        name.focus();
        return false;
    }

    /**
     * Create restaurant operating hours HTML table and add it to the webpage.
     */
    fillRestaurantHoursHTML(operatingHours) {
        const hours = this.document.getElementById('restaurant-hours');
        hours.setAttribute("aria-label", "restaurant hours");
        hours.tabIndex = "0";
        hours.innerHTML = '';
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
        container.innerHTML = '';
        const title = this.document.createElement('h2');
        title.innerHTML = 'Reviews';
        container.appendChild(title);

        if (!reviews) {
            const noReviews = this.document.createElement('p');
            noReviews.innerHTML = 'No reviews yet!';
            container.appendChild(noReviews);
            return;
        }

        const ul = this.document.createElement('ul');
        ul.setAttribute('id', 'reviews-list');
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

        if (review.updatedAt) {
            const date = this.document.createElement('p');
            date.innerHTML = `Updated: ${review.updatedAt.toDateString()}`;
            li.appendChild(date);
        }

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
        breadcrumb.innerHTML = '';

        let li = this.document.createElement('li');
        let a = this.document.createElement('a');
        a.setAttribute('href', '/');
        a.setAttribute('aria-label', 'home link');
        a.innerText = 'Home';
        li.appendChild(a);
        breadcrumb.appendChild(li);

        li = this.document.createElement('li');
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