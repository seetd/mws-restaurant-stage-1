import template from '../templates/toast.template.html';

const KEY_TAB = 9;
const KEY_ESC = 27;

// Simple javascript that is custom to only show Toasts to indicate that an application update is available
// An open source generic version could be used as well but this gives me an opportunity to learn how to build
// an accessible widget. It also removes the risk of plagiarism.
export default class Toast {
    constructor(document) {
        this.document = document;
        const parser = new DOMParser();
        const doc = parser.parseFromString(template, 'text/html');
        this.containerElement = doc.getElementById('toast-container');
        this.overlayElement = doc.getElementById('toast-overlay');
        this.refreshElement = doc.getElementById('toast-refresh');
        this.closeElement = doc.getElementById('toast-close');
        this.focusableItems = [this.refreshElement, this.closeElement];
        this.activeFocus = 0;
        this.refresh = new Promise((resolve) => {
            this._refreshResolver = resolve;
        });
    
    
        this.dismiss = new Promise((resolve) =>  {
            this._dismissResolver = resolve;
        });        
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
                this.close();
                if (this._dismissResolver) this._dismissResolver();
                break;
            default:
                break;
        }        
    }

    close() {
        this.containerElement.setAttribute('aria-hidden', 'true');
        this.overlayElement.setAttribute('aria-hidden', 'true');
    }    
}