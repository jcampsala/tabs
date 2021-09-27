chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.clear(() => {
        chrome.storage.sync.set({ groups: [] }, () => {
            console.log('Instalation default data set!');
        });
    });
});

// Event listeners have to be registered in top level
let stateManager = new BgStateManager();
stateManager.startListeners();
