chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.clear(async () => {
        chrome.storage.sync.set({
            groups: [],
            settings: {
                languageOptions: [ 'en', 'es' ],
                language: 'en',
                themeOptions: [ 'browser', 'light', 'dark'],
                theme: 'browser'
            }
        }, () => {
            console.log('Instalation default data set!');
        });
    });
});

// Event listeners have to be registered in top level
let stateManager = new BgStateManager();
stateManager.startListeners();
