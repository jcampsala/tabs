let tabsManager;
let settingsManager;

async function init() {
    tabsManager = new TabsManager();
    await tabsManager.init();

    settingsManager = new SettingsManager();
    await settingsManager.init();
    settingsManager.translateAll();

    initAllListeners(tabsManager, settingsManager);
}

init();
