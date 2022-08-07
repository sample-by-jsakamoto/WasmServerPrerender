(async function () {

    let resolve = () => { };
    const waitForReady = new Promise(r => { resolve = r; });

    window.BlazorPWAUpdater = {
        _dotNetObjectRef: null,
        waitForReady,
        setToBeReady: function (obj) {
            this._dotNetObjectRef = obj;
            resolve();
        },
        waiting: null,
        notifyNextVersionIsWaitingToBlazor: async function (waiting) {
            this.waiting = waiting;
            await this.waitForReady;
            if (this._dotNetObjectRef !== null) {
                await this._dotNetObjectRef.invokeMethodAsync("OnNextVersionIsWaiting");
            }
        },
        skipWaiting: function () {
            if (this.waiting === null) return;
            this.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    };

    const serviceWorkerScriptPath = document.currentScript.dataset.scriptPath || null;
    if (serviceWorkerScriptPath === null) return;

    const registration = await navigator.serviceWorker.register(serviceWorkerScriptPath);
    let iinitialInstallation = registration.active === null;

    const waiting = registration.waiting;
    if (waiting !== null) {
        BlazorPWAUpdater.notifyNextVersionIsWaitingToBlazor(waiting);
        monitor(waiting);
    }

    registration.addEventListener('updatefound', () => {
        monitor(registration.installing);
    });

    function monitor(worker) {
        worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') {
                if (!iinitialInstallation) BlazorPWAUpdater.notifyNextVersionIsWaitingToBlazor(worker);
            }
            if (worker.state === 'activated') {
                if (!iinitialInstallation) {
                    setTimeout(()=> window.location.reload(), 10);
                }
                iinitialInstallation = false;
            }
        });
    }

})();
