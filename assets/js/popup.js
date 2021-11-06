let tabsManager;
let settingsManager;
let dbManager;

async function init() {
    dbManager = new DbManager();

    tabsManager = new TabsManager();
    await tabsManager.init();

    settingsManager = new SettingsManager();
    await settingsManager.init();
    settingsManager.translateAll();

    initAllListeners(tabsManager, settingsManager);
}

init();
