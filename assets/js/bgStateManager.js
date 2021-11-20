class BgStateManager {
    constructor() {
        this.tabGroups = [];
        this.currentGroup = null;
        this.ready = false;
        this.transactionStack = [];
        this.transactionActive = false;
    }

    async refreshStorage() {
        let storageData = await chromeStorageSyncGet('groups');
        this.tabGroups = storageData.map((group) => TabGroup.fromJSON(group));
    }

    async saveChanges() {
        await chromeStorageSyncSet({ groups: this.tabGroups.map((group) => group.toJSON()) });
    }

    getGroupById(id) {
        return this.tabGroups.find((tabGroup) => tabGroup.id === id);
    }

    getGroupByWindowId(windowId) {
        return this.tabGroups.find((tabGroup) => tabGroup.windowId === windowId);
    }

    existsGroupWithLength(length) {
        let matches = [];
        for(let tabGroup of this.tabGroups) {
            if(tabGroup.tabs.length === length) {
                matches.push(tabGroup);
            }
        }
        return matches;
    }

    getGroupWithUrls(urls, tabGroups) {
        for(let tabGroup of tabGroups) {
            let match = 0;
            for(let tab of tabGroup.tabs) {
                match += urls.includes(tab.url) ? 1 : 0;
            }
            if(match === urls.length) {
                return tabGroup;
            }
        }
        return null;
    }

    async resetLinkedWindows() {
        await this.refreshStorage();
        for(let tabGroup of this.tabGroups) {
            tabGroup.unlinkWindow();
            for(let tab of tabGroup) {
                tab.unlinkTab();
            }
        }
        this.saveChanges();
    }

    startListeners() {
        chrome.tabs.onCreated.addListener((tab) => {
            // this.manageTabCreate(tab);
            this.scheduleTransaction({ id: this.createId(), type: 'tab create', fn: () => this.manageTabCreate(tab) });
        });

        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            // this.manageTabUpdate(tab);
            this.scheduleTransaction({ id: this.createId(), type: 'tab update', fn: () => this.manageTabUpdate(tab) });
        });

        chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
            // this.manageTabRemove(tabId, removeInfo.windowId);
            this.scheduleTransaction({ id: this.createId(), type: 'tab remove', fn: () => this.manageTabRemove(tabId, removeInfo.windowId) });
        });

        chrome.windows.onRemoved.addListener((windowId) => {
            // this.manageWindowRemove(windowId);
            this.scheduleTransaction({ id: this.createId(), type: 'window remove', fn: () => this.manageWindowRemove(windowId) });
        });

        chrome.windows.onCreated.addListener((window) => {
            // this.manageWindowCreate(window);
            this.scheduleTransaction({ id: this.createId(), type: 'window create', fn: () => this.manageWindowCreate(window) });
        });
    }

    async manageTabCreate(createdTab) {
        await this.refreshStorage();
        let tabGroup = this.getGroupByWindowId(createdTab.windowId);
        if(tabGroup) {
            let tabQuery = tabGroup.getTabByUrl(createdTab.url.length > 0 ? createdTab.url : createdTab.pendingUrl, true); 
            if(tabQuery) {
                tabQuery.linkTab(createdTab.id);
            } else {
                tabGroup.addTab(new Tab(createdTab.url, createdTab.title, createdTab.favIconUrl, createdTab.id));
            }
            this.saveChanges();
        } else {
            // console.error(`No group found with id ${createdTab.windowId} in tab create`);
            // console.error(this.tabGroups);
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
                this.saveChanges('tab update finished');
            } 
        } else {
            // console.error(`No group found with id ${updatedTab.windowId} in tab update`);
            // console.error(this.tabGroups);
        }
    }

    async manageTabRemove(tabId, windowId) {
        try {
            await chrome.windows.get(windowId);
            await this.refreshStorage();
            let tabGroup = this.getGroupByWindowId(windowId);
            if(tabGroup) {
                tabGroup.removeTab(tabId);
                await this.saveChanges('tab remove finished');
            } else {
                // console.error(`No group found with id ${windowId} in tab remove`);
                // console.log(this.tabGroups);
            }
        } catch(e) {
            // If there is no window with windowId it means the window was closed and that tiggered the tab delete.
            // This case should be ignored for manageWindowRemove to take care of the event   .
        }
    }

    async manageWindowRemove(windowId) {
        await this.refreshStorage();
        let closedTabGroup = this.getGroupByWindowId(windowId);
        if(closedTabGroup) {
            closedTabGroup.unlinkWindow(true);
            await this.saveChanges('window remove finished');
        }
    }

    async manageWindowCreate(window) {
        await this.refreshStorage();
        if(this.getGroupByWindowId(window.id)) {
            // This could be a restore situation
            let relatedTabs = await chrome.tabs.query({ windowId: window.id });
            // Parse tabs and check if there is a group with same number of tabs and same urls
            let contenderTabGroups = this.existsGroupWithLength(relatedTabs.length);
            if(contenderTabGroups.length > 0) {
                let matchingTabGroup = this.getGroupWithUrls(relatedTabs.map((tab) => tab.url), contenderTabGroups);
                if(matchingTabGroup) {
                    matchingTabGroup.linkWindow(window.id);
                    this.saveChanges('window create finished');
                }
            }
        }
    }

    async transactionScheduler() {
        if(this.transactionStack.length < 1) {
            this.transactionActive = false;
        } else {
            let transaction = this.transactionStack.shift();
            await transaction.fn();
            this.transactionScheduler();
        }
    }

    async scheduleTransaction(transaction) {
        this.transactionStack.push(transaction);
        if(!this.transactionActive) {
            this.transactionActive = true;
            this.transactionScheduler();
        }
    }

    createId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}
