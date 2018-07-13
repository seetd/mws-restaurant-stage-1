import idb from 'idb';

const ENDPOINT = 'http://localhost:1337/restaurants';
const database = 'rrdb';
const storeName = 'rrdb_restaurants';

const openDatabase = () => {
    return idb.open(database, 1, function (upgradeDb) {
        var store = upgradeDb.createObjectStore(storeName, {
            keyPath: 'id'
        });
    });
};

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

export default class DataService {
    constructor(supportsOffline) {
        this.supportsOffline = supportsOffline;
    }

    /**
     * Get all restaurants back since we are not implementing server side filter
     */
    fetch() {
        // If the browser doesn't support service work. Skip Offline first
        if (!this.supportsOffline) {
            return new Promise((resolve, reject) => fetch(ENDPOINT)
                .then(response => resolve(response.json()))
                .catch(error => reject(error))
            );
        }

        return new Promise((resolve, reject) => openDatabase()
            .then(db => {
                if (db) {
                    return db.transaction(storeName, 'readonly')
                        .objectStore(storeName)
                        .getAll();
                }

                return [];
            })
            .then(async restaurants => {
                if (!restaurants || restaurants.length === 0) {
                    const response = await fetch(ENDPOINT);
                    restaurants = await response.json();
                    const db = await openDatabase();
                    restaurants.forEach(
                        restaurant => db.transaction(storeName, 'readwrite')
                            .objectStore(storeName)
                            .put(restaurant)
                    );
                }

                return restaurants;
            })
            .then(restaurants => resolve(restaurants))
            .catch(error => reject(error)));
    }

    /**
     * Get a distinct list of cuisines from the supplied restaurants list 
     * @param {*} restaurants 
     */
    getAllCuisines(restaurants) {
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
    getAllNeighbourhoods(restaurants) {
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
    getByRestaurantId(id, restaurants) {
        return restaurants.find(function (restaurant) {
            return restaurant.id === id;
        });
    }

    /**
     * Filter the supplied restaurants list by supplied cuisine and neighbourhood
     * @param {*} restaurants 
     * @param {*} cuisine 
     * @param {*} neighborhood 
     */
    filterRestaurantsByCuisineAndNeighborhood(restaurants, cuisine, neighborhood) {
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
    urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    imageUrlForRestaurant(restaurant) {
        if (!restaurant.photograph)
            return (`/img/noimage.png`);
    
        return (`/img/${restaurant.photograph}.jpg`);
    }
}