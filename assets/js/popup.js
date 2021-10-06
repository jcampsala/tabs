let manager;
let settingsManager;

async function init() {
    manager = new TabsManager();
    await manager.init();

    settingsManager = new SettingsManager();
    await settingsManager.init();

    initAllListeners(manager);
}

init();
