const ENDPOINT = 'http://localhost:1337/restaurants';

/**
 * Generic filter method the uses the supplied accumulator
 * to return the require results from the supplied dataaset
 * @param {*} dataset 
 * @param {*} accumulator 
 */
const filter = (dataset, accumulator) => {
    if (!dataset || dataset.length === 0) {
        return [];
    }

    return dataset.reduce(
        (result, item) => {
            accumulator(result, item);
            return result;
        }, []
    );
};

export default class FilterService {
    /**
     * Get all restaurants back since we are not implementing server side fitler
     */
    static get fetch() {
        return new Promise((resolve, reject) => fetch(ENDPOINT)
            .then(response => resolve(response.json()))
            .catch(error => reject(error))
        );
    }

    /**
     * Get a distinct list of cuisines from the supplied restaurants list 
     * @param {*} restaurants 
     */
    static getAllCuisines(restaurants) {
        return filter(restaurants, (result, restaurant) => {
            if (!result.includes(restaurant.cuisine_type)) {
                result.push(restaurant.cuisine_type);
            }
        });
    }

    /**
     * Get a distinct list of neighbourhoods from the supplied restaurants list 
     * @param {*} restaurants 
     */
    static getAllNeighbourhoods(restaurants) {
        return filter(restaurants, (result, restaurant) => {
            if (!result.includes(restaurant.neighborhood)) {
                result.push(restaurant.neighborhood);
            }
        });
    }

    /**
     * Get specific restaurants from the supplied restaurants list 
     * @param {*} restaurants 
     */
    static getByRestaurantId(id, restaurants) {
        return restaurants.find(function(restaurant) {
            return restaurant.id === id;
        });
    }

    /**
     * Filter the supplied restaurants list by supplied cuisine and neighbourhood
     * @param {*} restaurants 
     * @param {*} cuisine 
     * @param {*} neighborhood 
     */
    static filterRestaurantsByCuisineAndNeighborhood(restaurants, cuisine, neighborhood) {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
            results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
            results = results.filter(r => r.neighborhood == neighborhood);
        }
        return results;
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        return (`/img/${restaurant.photograph}.jpg`);
    }
}