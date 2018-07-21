import idb from 'idb';

const ENDPOINT = 'http://localhost:1337';
const DATABASE = 'rrdb';
const RESTAURANTS_STORE = 'rrdb_restaurants';
const REVIEWS_STORE = 'rrdb_reviews';
const POST_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

const openDatabase = () => {
    return idb.open(DATABASE, 1, function (upgradeDb) {
        if (!upgradeDb.objectStoreNames.contains(RESTAURANTS_STORE)) {
            const restaurants = upgradeDb.createObjectStore(RESTAURANTS_STORE, {
                keyPath: 'id'
            });
        }        

        if (!upgradeDb.objectStoreNames.contains(REVIEWS_STORE)) {
            const reviews = upgradeDb.createObjectStore(REVIEWS_STORE, {
                keyPath: 'id'
            });
            reviews.createIndex('restaurants', 'restaurant_id', {unique: false});
            reviews.createIndex('synced', 'synced', {unique: false});
        }
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

const request = async (url, method = 'GET', headers={}, body=null) => {
    const options = {
        method
    };
    if (headers) options.headers = headers;
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    if (options && options.method) {
        return await response.json();
    }
    return response;
};

const getStore = (storeName, mode) => 
    (dbService) => 
        dbService
            .transaction(storeName, mode)
            .objectStore(storeName);

const get = (supportsOffline, networkService, cacheService) => {
    return new Promise(async (resolve, reject) => {
        try {
            // If the browser doesn't support service work. Skip Offline first
            if (!supportsOffline) {
                const data = networkService();
                resolve(data);
                return;
            }

            const dbService = await openDatabase();
            const data = await cacheService(dbService, networkService);
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
};

const arrayCacheService = (getStoreData, storename, transform = null, cleanStore = null) => {
    return async (dbService, networkService) => {
        let data;
        try {
            data = await networkService();
            if(cleanStore) cleanStore(dbService);

            const store = getStore(storename, 'readwrite')(dbService);
            data = data.map(item => {
                if (transform) {
                    transform(item);
                }
                item.synced = 1;
                store.put(item);
                return item;
            });      
        } catch (error) {
            data = await getStoreData(dbService, storename);
        }

        return data;
    };
};

const objectByIdCacheService = (getStoreData, storename, id) => {
    return async (dbService, networkService) => {
        let data;
        try {
            data = await networkService();
            const store = getStore(storename, 'readwrite')(dbService);
            store.put(data);
        } catch (error) {
            data = await getStoreData(dbService, storename, id);
        }
        return data;
    };
};

const getRestaurant = (id) => {
    return () => request(`${ENDPOINT}/restaurants/${id}`);
};
const getReviews = (id) => {
    return () => request(`${ENDPOINT}/reviews/?restaurant_id=${id}`);
};
const getRestaurants = () => request(`${ENDPOINT}/restaurants`);

const transformForClient = (review) => {
    if(review.createdAt) review.createdAt = new Date(review.createdAt);
    if(review.updatedAt) review.updatedAt = new Date(review.updatedAt);
};

const transformForFetch = (review) => {
    delete review.synced;
    delete review.id;
};

export default class DataService {
    constructor(supportsOffline) {
        this.supportsOffline = supportsOffline;
    }

    async sync() {
        let synced = [];
        const dbService = await openDatabase();
        let store = getStore(REVIEWS_STORE)(dbService).index('synced');
        const unsynced = await store.getAll(0);
        try {
            let unsyncedId, result;
            for (const review of unsynced) {
                // cannot use foreach since that will not allow async/await
                unsyncedId = review.id;
                transformForFetch(review);
                result = await request(`${ENDPOINT}/reviews`, 'POST', POST_HEADERS, review);
                if (result) {
                    // Check for result null which is returned by PreFlight OPTIONS call due to cross domain access
                    transformForClient(result);
                    result.synced = 1;
                    result.unsyncedId = unsyncedId;
                    synced.push(result);  
                } 
            }
        } catch(error) { 
        }

        if (synced.length > 0) {
            store = getStore(REVIEWS_STORE, 'readwrite')(dbService);
            synced.forEach((review) => {
                store.delete(review.unsyncedId);
                delete review.unsyncedId;
                store.put(review);
            })
        }

        if (unsynced.length === 0) {
            return null;
        }

        if (synced.length !== unsynced.length) {
            return `Partially completed syncing ${synced.length} / ${unsynced.length} reviews`;
        }

        return `Completed syncing ${synced.length} reviews`;
    }

    async getCachedReviews(id) {
        const dbService = await openDatabase();
        const store = getStore(REVIEWS_STORE)(dbService);
        return store.index('restaurants').getAll(id);
    }

    async addReview(review) {
        const errors = [];
     
        if (!review.restaurant_id) {
            errors.push('restaurant_id');
        }

        if (!review.name) {
            errors.push('name');
        }

        if (!review.rating) {
            errors.push('rating');
        }

        if (!review.comments) {
            errors.push('comments');
        }        

        if (errors.length === 0) {
            let result, success = true;
            try {
                transformForFetch(review, new Date());
                result = await request(`${ENDPOINT}/reviews`, 'POST', POST_HEADERS, review);
                if (result) {
                    // Check for result null which is returned by PreFlight OPTIONS call due to cross domain access
                    transformForClient(result);
                    result.synced = 1;
                }
            } catch (error) {
                // when request throws an error that means fetch failed and result will be null
                // so we save the existing review
                result = review;
                success = false;
            }

            const dbService = await openDatabase();
            const store = getStore(REVIEWS_STORE, 'readwrite')(dbService);       
            if(!success) {
                const id = await store.count();
                transformForClient(result);
                result.synced = 0;
                result.id = id * -1;
                errors.push('fetch');
            }
            
            store.put(result);
        }

        return errors;
    }

    /**
     * Get all restaurants back since we are not implementing server side filter
     * Keeping result as Promise to maintain compatablity with original Udacity code
     */
    getAllRestaurants() {
        return get(
            this.supportsOffline,
            getRestaurants,
            arrayCacheService(
                async (dbService, storename) => {
                    const store = getStore(storename)(dbService);
                    return store.getAll();
                },
                RESTAURANTS_STORE
            )
        );
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
     * Get specific restaurants from the supplied restaurants list.
     * Keeping result as Promise to maintain compatablity with original Udacity code
     * @param {*} id 
     */
    getByRestaurantId(id) {
        const cleanReviews = async (dbService) => {
            const store = getStore(REVIEWS_STORE, 'readwrite')(dbService);
            const data = await store.index('restaurants').getAll(id);
            if (data) data.forEach((review) => store.delete(review.id));
        }

        return new Promise(async (resolve, reject) => {
            try {
                const restaurant = await get(
                    this.supportsOffline,
                    getRestaurant(id),
                    objectByIdCacheService(
                        async (dbService, storename, restaurant_id) => {
                            const store = getStore(storename)(dbService);
                            return store.get(restaurant_id);
                        },
                        RESTAURANTS_STORE,
                        id
                    )
                );
                const reviews = await get(
                    this.supportsOffline,
                    getReviews(id),
                    arrayCacheService(
                        async (dbService, storename, restaurant_id) => {
                            const store = getStore(storename)(dbService);
                            return store.index('restaurants').getAll(restaurant_id);
                        },       
                        REVIEWS_STORE,
                        transformForClient,
                        cleanReviews
                    )
                );
    
                restaurant.reviews = reviews;
                resolve(restaurant)
            } catch (error) {
                reject(error)
            }
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