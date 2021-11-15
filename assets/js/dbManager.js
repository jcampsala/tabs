class DbManager {
    constructor() {
        this.tabGroupsKey = 'tab_groups_index';
        this.tabsKey = 'tabs_index';
        this.autoincrementKey = 'db_autoincrement';
    }

    async autoincrement() {
        let currentIndex = await chromeStorageSyncGet(this.autoincrementKey);
        currentIndex += 1;
        await chromeStorageSyncSet(this.storageObj(this.autoincrementKey, currentIndex));
        return currentIndex;
    }

    updateIndex(index, value) {
        return new Promise(async (resolve, reject) => {
            if(![this.tabGroupsKey, this.tabsKey].includes(index)) {
                reject(`Type ${type} is not a valid index type`);
            }
            // TODO: check if this circumvents problem of overwriting data
            await chromeStorageSyncSet(this.storageObj(index, value.map((id) => id.toString())));
            resolve(true);
        });
    }

    getAllGroups() {
        return new Promise(async (resolve, reject) => {
            try {
                let tabGroupsIds = await chromeStorageSyncGet(this.tabGroupsKey);
                console.log('found group ids: ', tabGroupsIds);
                let tabGroups = await chromeStorageSyncGet(tabGroupsIds);
                console.log('found groups: ', tabGroups);
                resolve(tabGroups ?? []);
            } catch(e) {
                console.error('db error: getAllGroups', e);
                reject(e);
            }
        });
    }

    getAllTabs() {
        return new Promise(async (resolve, reject) => {
            try {
                let tabsIds = await chromeStorageSyncGet(this.tabsKey);
                let tabs = await chromeStorageSyncGet(tabsIds);
                resolve(tabs ?? []);
            } catch(e) {
                console.error('db error: getAllTabs', e);
                reject(e);
            }
        });
    }

    async getGroup(id) {
        return await chromeStorageSyncGet(id);
    }

    async getTab(id) {
        return await chromeStorageSyncGet(id);
    }

    async getGroupTabs(tabGroup) {
        return await this.getTab(tabGroup.children);
    }

    async addTabGroups(tabGroups) {
        return new Promise(async (resolve, reject) => {
            try {
                let currentGroups = await chromeStorageSyncGet(this.tabGroupsKey);
                for(let tabGroup of tabGroups) {
                    if(!currentGroups.includes(tabGroup.id)) {
                        let id = await this.autoincrement();
                        tabGroup.updateWith({id: id});
                        await chromeStorageSyncSet(this.storageObj(id, tabGroup.toJSON()));
                        await this.addTabs(tabGroup.tabs);
                        currentGroups.push(id);
                    } else {
                        console.log(`A tab group with id ${tab.id} aleady exists, updating... NOT IMPLEMENTED`);
                        // await this.update(tab.id, tab);
                    }
                }
                await this.updateIndex(this.tabGroupsKey, currentGroups);
                resolve(true);
            } catch(e) {
                console.error('db error: addTabs', e);
                reject(e);
            }
        });
    }

    async addTabs(tabs) {
        return new Promise(async (resolve, reject) => {
            try {
                let currentTabs = await chromeStorageSyncGet(this.tabsKey);
                for(let tab of tabs) {
                    if(!currentTabs.includes(tab.id)) {
                        let id = await this.autoincrement();
                        tab.updateWith({id: id});
                        await chromeStorageSyncSet(this.storageObj(id, tab.toJSON()));
                        currentTabs.push(id);
                    } else {
                        console.log(`A tab with id ${tab.id} aleady exists, updating... NOT IMPLEMENTED`);
                        // await this.update(tab.id, tab);
                    }
                }
                await this.updateIndex(this.tabsKey, currentTabs);
                resolve(true);
            } catch(e) {
                console.error('db error: addTabs', e);
                reject(e);
            }
        });
    }

    async update(id, data) {
        return new Promise(async (resolve, reject) => {
            try {
                let toUpdate = await chromeStorageSyncGet(id);

                if(toUpdate) {
                    for(let key of Object.keys(data)) {
                        toUpdate[key] = data[key];
                    }
                    await chromeStorageSyncSet({ id: toUpdate });
                    resolve(true);
                } else {
                    reject(`No element with id ${id} found!`);
                }
            } catch(e) {
                console.error('db error: update', e);
                reject(e)
            }
        });
    }

    storageObj(storageId, storageData) {
        let storageObj = {};
        storageObj[storageId] = storageData;
        return storageObj;
    }
}