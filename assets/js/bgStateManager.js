class BgStateManager {
    constructor() {
        this.tabGroups = [];
        this.currentGroup = null; // this could be an array if more than one group is opened
        this.ready = false;
    }

    async refreshStorage() {
        let storageData = await chromeStorageSyncGet('groups');
        this.tabGroups = storageData.map((group) => TabGroup.fromJSON(group));
    }

    async saveChanges() {
        await chromeStorageSyncSet({ groups: this.tabGroups.map((group) => group.toJSON()) });
        let current = await chromeStorageSyncGet('groups');
    }

    getGroupById(id) {
        return this.tabGroups.find((tabGroup) => tabGroup.id === id);
    }

    getGroupByWindowId(windowId) {
        return this.tabGroups.find((tabGroup) => tabGroup.windowId === windowId);
    }

    startListeners() {
        chrome.tabs.onCreated.addListener((tab) => {
            this.manageTabCreate(tab);
        });

        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.manageTabUpdate(tab);
        });

        chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
            this.manageTabRemove(tabId, removeInfo.windowId);
        });

        chrome.windows.onRemoved.addListener((windowId) => {
            this.manageWindowRemove(windowId);
        });
    }

    async manageTabCreate(createdTab) {
        await this.refreshStorage();
        let tabGroup = this.getGroupByWindowId(createdTab.windowId);
        if(tabGroup) {
            tabGroup.addTab(new Tab(createdTab.url, createdTab.title, createdTab.favIconUrl, createdTab.id));
            this.saveChanges();
        } else {
            console.error(`No group found with id ${createdTab.windowId} in tab create`);
            console.error(this.tabGroups);
        }
    }

    async manageTabUpdate(updatedTab) {
        // TODO: what happens when a tab id moved to a new window?????
        await this.refreshStorage();
        let tabGroup = this.getGroupByWindowId(updatedTab.windowId);
        if(tabGroup) {
            let tab = tabGroup.getTabById(updatedTab.id);
            if(tab && tab.shouldUpdate(updatedTab)) {
                tab.updateWith({
                    url: updatedTab.url,
                    title: updatedTab.title,
                    favIconUrl: updatedTab.favIconUrl
                });
                this.saveChanges();
            } 
        } else {
            console.error(`No group found with id ${updatedTab.windowId} in tab update`);
            console.error(this.tabGroups);
        }
    }

    async manageTabRemove(tabId, windowId) {
        // TODO: remove and create do not work sometimes
        console.log('remove was triggered ' + tabId);
        await this.refreshStorage();
        let tabGroup = this.getGroupByWindowId(windowId);
        if(tabGroup) {
            tabGroup.removeTab(tabId);
            this.saveChanges();
        } else {
            console.error(`No group found with id ${windowId} in tab remove`);
            console.log(this.tabGroups);
        }
    }

    async manageWindowRemove(windowId) {
        await this.refreshStorage();
        let closedTabGroup = this.getGroupByWindowId(windowId);
        if(closedTabGroup) {
            closedTabGroup.unlinkWindow();
            this.saveChanges();
        }
    }
}
