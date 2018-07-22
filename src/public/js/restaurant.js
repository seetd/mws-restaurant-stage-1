
import '@babel/polyfill';
import ServiceWorkerController from './ServiceWorkerController';
import RestaurantController from './RestaurantController';
import DataService from './DataService';

(function (window, navigator, document) {
    const supportsNotifications = ('Notification' in window);
    const controller = new RestaurantController(window, document);
    const dataService = new DataService(!!navigator.serviceWorker);    
    window.addEventListener('load', () => {
        new ServiceWorkerController(window, navigator, document).register();
    });

    /**
     * Fetch restaurant and reviews as soon as the page is loaded.
     */
    document.addEventListener('DOMContentLoaded', async (event) => {
        if(navigator.onLine) {
            // This sync will handle browsers that do not support online event and also when server is down without polling
            const message = await dataService.sync();
            if (supportsNotifications && Notification.permission === "default") {
                Notification.requestPermission().then(function(result) {
                });
            } 
            if (message) {
                if (supportsNotifications && Notification.permission === "granted") {
                    new Notification(message);
                } else {
                    console.log(`DOMContentLoaded: ${message}`);
                }             
            }
        }
        controller.render();
    });

    // Using online event handler as I consider it a lesser evil compared to polling
    window.addEventListener('online', async function(event) {
        const message = await dataService.sync();
        if(!message) return;
        if (supportsNotifications && Notification.permission === "granted") {
            new Notification(message);
        } else {
            console.log(`online: ${message}`);
        }    
        controller.render(true);        
    });    
})(window, navigator, document);