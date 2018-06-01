// Simple javascript that is custom to only show Toasts to indicate that an application update is available
// An open source generic version could be used as well but this gives me an opportunity to learn how to build
// an accessible widget. It also removes the risk of plagiarism
function Toast() {
    const toast = this;

    const containerEl = document.createElement('div');
    containerEl.id = 'toast-container';
    containerEl.setAttribute('role', 'dialog');
    containerEl.setAttribute('aria-hidden', 'true');
    containerEl.setAttribute('aria-labelledby', 'toast-title');
    containerEl.setAttribute('aria-describedby', 'toast-text');
    containerEl.tabIndex = -1;

    const headerEl = document.createElement('h2');
    headerEl.id = 'toast-title';
    headerEl.innerText = 'Application Update';

    const messageEl = document.createElement('div');
    messageEl.id = 'toast-text';
    messageEl.innerText = 'New version available';

    const refreshEl = document.createElement('button');
    refreshEl.innerText = 'Refresh';
    refreshEl.id = 'toast-refresh';

    const dismissEl = document.createElement('button');
    dismissEl.innerText = 'Close';
    dismissEl.id = 'toast-close';

    this.refresh = new Promise(function(resolve) {
        toast._refreshResolver = resolve;
    });

    this.show = () => {
        containerEl.setAttribute('aria-hidden', 'false');
        containerEl.focus();
    }

    dismissEl.onclick = () => {
        containerEl.setAttribute('aria-hidden', 'true');
    }

    refreshEl.onclick = () => {
        containerEl.setAttribute('aria-hidden', 'true');
        if (this._refreshResolver) this._refreshResolver();
    }

    containerEl.appendChild(headerEl);
    containerEl.appendChild(messageEl);
    containerEl.appendChild(refreshEl);
    containerEl.appendChild(dismissEl);
    document.body.appendChild(containerEl);

    return toast;
}