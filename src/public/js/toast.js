// Simple javascript that is custom to only show Toasts to indicate that an application update is available
// An open source generic version could be used as well but this gives me an opportunity to learn how to build
// an accessible widget. It also removes the risk of plagiarism.
function Toast() {
    const KEY_TAB = 9;
    const KEY_ESC = 27;
    const toast = this;
    const containerEl = document.createElement('div');
    const headerEl = document.createElement('h3');
    const messageEl = document.createElement('div');
    const refreshEl = document.createElement('button');
    const dismissEl = document.createElement('button');
    const overlayEl = document.createElement('div');

    const focusableItems = [refreshEl, dismissEl];

    let activeFocus = 0;

    this.refresh = new Promise((resolve) => {
        this._refreshResolver = resolve;
    });


    this.dismiss = new Promise((resolve) =>  {
        this._dismissResolver = resolve;
    });

    const keyHandler = (event) => {
        const handleForwardTab = () => {
            event.preventDefault();
            if (activeFocus === focusableItems.length - 1) {
                activeFocus = 0;
            } else {
                activeFocus += 1;
            }
            focusableItems[activeFocus].focus();
        };

        const handleBackTab = () => {
            event.preventDefault();
            if (activeFocus === 0) {
                activeFocus = focusableItems.length - 1 ;
            } else {
                activeFocus -= 1;
            }
            focusableItems[activeFocus].focus();
        };

        switch (event.keyCode) {
            case KEY_TAB:
                if (focusableItems.length === 1) {
                    event.preventDefault();
                    break;
                }

                if (event.shiftKey) {
                    handleBackwardTab();
                } else {
                    handleForwardTab();
                }
                break;
            case KEY_ESC:
                event.preventDefault();
                close();
                if (this._dismissResolver) this._dismissResolver();
                break;
            default:
                break;
        }
    }

    const close = () => {
        containerEl.setAttribute('aria-hidden', 'true');
        overlayEl.setAttribute('aria-hidden', 'true');
    }

    containerEl.id = 'toast-container';
    containerEl.setAttribute('role', 'dialog');
    containerEl.setAttribute('aria-hidden', 'true');
    containerEl.setAttribute('aria-labelledby', 'toast-title');
    containerEl.setAttribute('aria-describedby', 'toast-text');
    containerEl.tabIndex = -1;
    containerEl.addEventListener('keydown', keyHandler);

    headerEl.id = 'toast-title';
    headerEl.innerText = 'Application Update';

    messageEl.id = 'toast-text';
    messageEl.innerText = 'New version available';

    refreshEl.innerText = 'Refresh';
    refreshEl.id = 'toast-refresh';

    dismissEl.innerText = 'Close';
    dismissEl.id = 'toast-close';

    this.show = () => {
        containerEl.setAttribute('aria-hidden', 'false');
        overlayEl.setAttribute('aria-hidden', 'false');
        activeFocus = 0;
        focusableItems[activeFocus].focus();
    }

    dismissEl.onclick = () => {
        close();
        if (this._dismissResolver) this._dismissResolver();
    }

    refreshEl.onclick = () => {
        close();
        if (this._refreshResolver) this._refreshResolver();
    }

    overlayEl.id = 'toast-overlay';
    overlayEl.tabIndex = -1;
    overlayEl.setAttribute('aria-hidden', 'true');
    overlayEl.addEventListener('keydown', keyHandler);

    containerEl.appendChild(headerEl);
    containerEl.appendChild(messageEl);
    containerEl.appendChild(refreshEl);
    containerEl.appendChild(dismissEl);
    document.body.appendChild(containerEl);
    document.body.appendChild(overlayEl);
    return toast;
}