import Toast from './Toast';

export default class ServiceWorkerController {
    constructor(window, navigator, document) {
        this.window = window;
        this.navigator = navigator;
        this.document = document;
        this.toast = new Toast(document);
    }

    updateReady(worker) {
        this.toast.refresh.then(() => {
            worker.postMessage({
                updated: true
            });
            this.document.getElementById("home-link").focus();
        });

        this.toast.dismiss.then(() => {
            this.document.getElementById("home-link").focus();
        });

        this.toast.hide('false');
    }

    trackInstalling(worker) {
        worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') {
                this.updateReady(worker);
            }
        });
    }

    register() {
        // Service worker not supported on this browser
        if ('serviceWorker' in this.navigator === false) return;
        this.navigator.serviceWorker.register('/service_worker.js')
            .then((registration) => {
                // If there is no controller this is a fresh and the page is not loaded via a service worker
                if (!this.navigator.serviceWorker.controller) return;

                // If there is an updated worker already waiting, call update ready.
                // This happens the existing worker session is not closed and the user refreshes the browser
                // or opens a new browser tab
                if (registration.waiting) {
                    this.updateReady(registration.waiting);
                    return;
                }

                // If there is an updated worker installing, track its progress and call update ready if installed
                if (registration.installing) {
                    this.trackInstalling(registration.installing);
                    return;
                }

                // Otherwise listen for new workers arriving, track its progress and call update ready if installed
                // This is triggered when there is a new service worker that should replace the current version appears
                registration.addEventListener('updatefound', () => {
                    this.trackInstalling(registration.installing);
                });
            })
            .catch((err) => {
                console.log(err);
            });

        let refreshing;
        this.navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            this.window.location.reload();
            refreshing = true;
        });
    }    
}