let manager;

async function init() {
    manager = new TabsManager();
    await manager.init();
    console.log(manager);

    initAllListeners(manager);
}

init();
