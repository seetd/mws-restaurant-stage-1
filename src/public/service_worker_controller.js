function ServiceWorkerController() {
    const toast = new Toast();

    const updateReady = (worker) => {
        toast.refresh.then(() => {
            worker.postMessage({
                updated: true
            });
            document.getElementById("home-link").focus();
        });

        toast.dismiss.then(() => {
            document.getElementById("home-link").focus();
        });

        toast.show();
    };

    const trackInstalling = (worker) => {
        worker.addEventListener('statechange', function () {
            if (worker.state === 'installed') {
                updateReady(worker);
            }
        });
    };

    const register = () => {
        // Service worker not supported on this browser
        if (!navigator.serviceWorker) return;
        navigator.serviceWorker.register('/service_worker.js')
            .then(function (registration) {
                // If there is no controller this is a fresh and the page is not loaded via a service worker
                if (!navigator.serviceWorker.controller) return;

                // If there is an updated worker already waiting, call update ready.
                // This happens the existing worker session is not closed and the user refreshes the browser
                // or opens a new browser tab
                if (registration.waiting) {
                    updateReady(registration.waiting);
                    return;
                }

                // If there is an updated worker installing, track its progress and call update ready if installed
                if (registration.installing) {
                    trackInstalling(registration.installing);
                    return;
                }

                // Otherwise listen for new workers arriving, track its progress and call update ready if installed
                // This is triggered when there is a new service worker that should replace the current version appears
                registration.addEventListener('updatefound', function () {
                    trackInstalling(registration.installing);
                });
            })
            .catch(function (err) {
                console.log(err);
            });

        var refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    }

    register();
}