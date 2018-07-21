
import '@babel/polyfill';
import ServiceWorkerController from './ServiceWorkerController';
import IndexController from './IndexController';
import DataService from './DataService';

(function (window, navigator, document) {
    const supportsNotifications = ('Notification' in window);
    const controller = new IndexController(window, document);
    const dataService = new DataService(!!navigator.serviceWorker);
    window.addEventListener('load', () => {
        new ServiceWorkerController(window, navigator, document).register();
    });

    /**
     * Fetch neighborhoods and cuisines as soon as the page is loaded.
     */
    document.addEventListener('DOMContentLoaded', (event) => {
        controller.render();
        if (supportsNotifications && Notification.permission === "default") {
            Notification.requestPermission().then(function(result) {
            });
        }
    });

    // Using online event handler as I consider it a lesser evil compared to polling
    window.addEventListener('online', async function(event) {
        const message = await dataService.sync();
        if(!message) return;
        if (supportsNotifications && Notification.permission === "granted") {
            new Notification(message);
        } else {
            console.log(message);
        }
        controller.render(true);
    });
})(window, navigator, document);