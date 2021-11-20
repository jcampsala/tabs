chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.clear(async () => {
        chrome.storage.sync.set({
            groups: [],
            // tab_groups_index: [],
            // tabs_index: [],
            // db_autoincrement: 0,
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

// Event listeners must be registered in top level
let stateManager = new BgStateManager();
stateManager.startListeners();

let dbManager = new DbManager();

chrome.runtime.onStartup.addListener(() => {
    stateManager.resetLinkedWindows();
});
