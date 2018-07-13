import template from '../templates/toast.template.html';

const KEY_TAB = 9;
const KEY_ESC = 27;

// Simple javascript that is custom to only show Toasts to indicate that an application update is available
// An open source generic version could be used as well but this gives me an opportunity to learn how to build
// an accessible widget. It also removes the risk of plagiarism.
export default class Toast {
    constructor(document) {
        const parser = new DOMParser();
        const toast = parser.parseFromString(template, 'text/html');
        this.containerElement = toast.getElementById('toast-container');
        this.overlayElement = toast.getElementById('toast-overlay');
        this.refreshElement = toast.getElementById('toast-refresh');
        this.closeElement = toast.getElementById('toast-close');
        this.focusableItems = [this.refreshElement, this.closeElement];
        this.activeFocus = 0;
        this.refresh = new Promise((resolve) => {
            this._refreshResolver = resolve;
        });
        this.dismiss = new Promise((resolve) =>  {
            this._dismissResolver = resolve;
        });   
        this.closeElement.onclick = () => {
            this.hide('true');
            if (this._dismissResolver) this._dismissResolver();
        }
    
        this.refreshElement.onclick = () => {
            this.hide('true');
            if (this._refreshResolver) this._refreshResolver();
        }

        document.body.appendChild(this.containerElement);
        document.body.appendChild(this.overlayElement);
    }

    keyHandler() {
        const handleForwardTab = () => {
            event.preventDefault();
            if (this.activeFocus === this.focusableItems.length - 1) {
                this.activeFocus = 0;
            } else {
                this.activeFocus += 1;
            }
            this.focusableItems[this.activeFocus].focus();
        };

        const handleBackwardTab = () => {
            event.preventDefault();
            if (this.activeFocus === 0) {
                this.activeFocus = this.focusableItems.length - 1 ;
            } else {
                this.activeFocus -= 1;
            }
            this.focusableItems[this.activeFocus].focus();
        };

        switch (event.keyCode) {
            case KEY_TAB:
                if (this.focusableItems.length === 1) {
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
                // Dismiss resolver should handle hide
                if (this._dismissResolver)  this._dismissResolver();
                this.hide('true');
                break;
            default:
                break;
        }        
    }

    hide(isHidden) {
        this.containerElement.setAttribute('aria-hidden', isHidden);
        this.overlayElement.setAttribute('aria-hidden', isHidden);
    }            
}