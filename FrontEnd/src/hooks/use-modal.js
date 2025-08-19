export function useModal() {
    let isOpen = false;
    let modalElement = null;
    const listeners = new Set();

    const subscribe = (callback) => {
        listeners.add(callback);
        return () => listeners.delete(callback);
    };

    const notify = (state) => {
        listeners.forEach(callback => {
            try {
                callback(state);
            } catch (error) {
                console.error('Error in modal state callback:', error);
            }
        });
    };

    const open = (modal) => {
        if (modalElement && modalElement !== modal) {
            close();
        }

        modalElement = modal;
        isOpen = true;

        if (!document.body.contains(modalElement)) {
            document.body.appendChild(modalElement);
        }

        modalElement.open();

        notify({ isOpen: true, modal: modalElement });
    };

    const close = () => {
        if (modalElement) {
            modalElement.close();
            modalElement = null;
        }
        isOpen = false;
        notify({ isOpen: false, modal: null });
    };

    const toggle = (modal) => {
        if (isOpen) {
            close();
        } else {
            open(modal);
        }
    };

    return {
        get isOpen() { return isOpen; },
        get modal() { return modalElement; },
        open,
        close,
        toggle,
        subscribe
    };
}