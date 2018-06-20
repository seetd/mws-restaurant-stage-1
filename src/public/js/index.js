
import '@babel/polyfill';
import ServiceWorkerController from './ServiceWorkerController';
import IndexController from './IndexController';

(function (window, navigator, document) {
    window.addEventListener('load', () => {
        new ServiceWorkerController(window, navigator, document).register();
    });

    /**
     * Fetch neighborhoods and cuisines as soon as the page is loaded.
     */
    document.addEventListener('DOMContentLoaded', (event) => {
        new IndexController(window, document).render();
    });
})(window, navigator, document);