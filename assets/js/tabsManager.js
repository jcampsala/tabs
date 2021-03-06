class TabsManager {
    constructor() {
        this.tabGroups = [];
        this.currentGroup = null;
        this.ready = false;
    }

    async init(callback) {
        let storageData = await chromeStorageSyncGet('groups');
        this.tabGroups = storageData.map((group) => TabGroup.fromJSON(group));
        this.ready = true;
        this.updateDisplay();
    }

    async createNewGroup(name, withTabs) {
        // TODO: prevent creation if current window is already linked to a group
        let newGroup = new TabGroup(name, 
            withTabs ? await this.getActiveWindowTabs() : [],
            withTabs ? await this.getCurrentWindowId() : -1);
        this.tabGroups.push(newGroup);
        this.saveAndUpdate();
        if(!withTabs)
            this.openGroup(newGroup.id);
    }

    async getCurrentTab() {
        let queryOptions = { active: true, currentWindow: true };
        let [tab] = await chrome.tabs.query(queryOptions);
        return new Tab(tab.url, tab.title, tab.favIconUrl, tab.id);
    }

    async getActiveWindowTabs() {
        let queryOptions = { currentWindow: true };
        let tabs = await chrome.tabs.query(queryOptions);
        return tabs.map((tab) => new Tab(tab.url, tab.title, tab.favIconUrl, tab.id));
    }

    async getCurrentWindowId() {
        let currentWindow = await chrome.windows.getCurrent(); 
        return currentWindow.id;
    }

    getGroupById(id) {
        return this.tabGroups.find((tabGroup) => tabGroup.id === id);
    }

    async saveChanges() {
        await chromeStorageSyncSet({ groups: this.tabGroups.map((group) => group.toJSON()) });
        let current = await chromeStorageSyncGet('groups');
        console.log(current);
    }

    // this function could be inside tabGroup.js
    buildRow(group) {
        let rowHtml = `<div id="${group.id}-row" class="tabs-row theme">
            <div class="tabs-row-top theme ${this.currentGroup == group ? 'selected' : ''}">
                <div class="row-top-name">${group.name}</div>
                <div class="row-top-button"><a id="${group.id}-delete" class="row-delete-btn theme"><i class="fas fa-trash-alt"></i></a></div>
            </div>
            <div id="${group.id}-row-main" class="tabs-row-main">`;
        let limit = 5; let count = 0;
        for(let tab of group.tabs) {
            if(count < limit) {
                rowHtml += `<div class="tab-list-icon theme">
                    <div class="centered-icon-container">
                        <img class="contained-icon" src="${tab.favIconUrl != null && tab.favIconUrl.length > 0 ? tab.favIconUrl : 'assets/images/icon32.png'}">
                    </div>
                </div>`;
            } else {
                rowHtml += `<div class="tab-list-icon theme">
                    <div class="centered-icon-container">
                        <div class="contained-icon more-tab">
                            <i class="fas fa-plus"></i>
                            <span style="font-size: 15px;"><strong>${group.tabs.length - count}</strong></span>
                        </div>
                    </div>
                </div>`;
                break;
            }
            count += 1;
        }
        rowHtml += `</div>
            </div>`;
        return rowHtml;
    }

    updateDisplay() {
        let firstDisplay = false;
        let groupGrid = document.getElementById('tab-groups-container');
        if(!groupGrid) {
            firstDisplay =  true;
            groupGrid = document.createElement('div');
            groupGrid.className = 'tab-groups-container';
            groupGrid.id = 'tab-groups-container';
        }

        while(!firstDisplay && groupGrid.hasChildNodes()) {
            groupGrid.firstChild.remove();
        }

        for(let tabGroup of this.tabGroups) {
            groupGrid.insertAdjacentHTML('beforeend', this.buildRow(tabGroup));
        }

        if(firstDisplay) {
            document.getElementById('group-grid-container').appendChild(groupGrid);
        }
        
        this.registerTabGroupEvents();
    }

    async saveAndUpdate() {
        await this.saveChanges();
        this.updateDisplay();
    }

    registerTabGroupEvents(targets = []) {
        let targetGroups = targets.length > 0 ? targets : this.tabGroups;
        let dialog = document.getElementById('delete-dialog-page');
        let confirmButton = document.getElementById('delete-dialog-confirm');
        for(let tabGroup of targetGroups) {
            let deleteBtn = tabGroup.getDeleteButton();
            deleteBtn.onclick = () => {
                confirmButton.dialogAction = () => this.deleteTabGroup(tabGroup.id);
                dialog.updateTargetName(tabGroup.name);
                dialog.togglePage(true);
            }

            let row = tabGroup.getDOMRow();
            row.onclick = () => this.openGroup(tabGroup.id);
        }
    }

    deleteTabGroup(id) {
        let indexToDelete = this.tabGroups.findIndex((tabGroup) => tabGroup.id === id);
        if(indexToDelete != -1) {
            this.tabGroups.splice(indexToDelete, 1);
        } else {
            console.error(`tabGroup with if <${id}> does not exist!`);
        }
        this.saveAndUpdate();
    }

    async openGroup(id) {
        let selectedTabGroup = this.getGroupById(id);
        if(selectedTabGroup.hasLinkedWindow()) {
            try {
                await chrome.windows.update(selectedTabGroup.windowId, {
                    focused: true,
                    state: 'maximized'
                });
                window.close();
            } catch(e) {
                // TODO: tab tracking can fail when this route is taken
                selectedTabGroup.unlinkWindow();
                this.openGroup(id);
            }
        } else {
            let newWindow = await chrome.windows.create({
                focused: true,
                url: selectedTabGroup.getUrlStrings(),
                state: 'maximized' 
            });
            selectedTabGroup.linkWindow(newWindow.id);
            selectedTabGroup.openedByExtension = true;
            await this.saveChanges();
            window.close();
        }
    }

    exportJSON() {
        let json = this.tabGroups.map((tabGroup) => {
            let tabGroupJson = tabGroup.toJSON();
            tabGroupJson['windowId'] = -1;
            for(let tabJson of tabGroupJson['tabs']) {
                tabJson['tabId'] = -1;
            }
            return tabGroupJson;
        });
        let hiddenTextArea = document.createElement('textarea');
        hiddenTextArea.value = JSON.stringify(json);
        let downloadElem = document.createElement('a');
        downloadElem.href = `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(json))}`;
        downloadElem.setAttribute('download', `tabs_export_${Date.now()}.json`);
        downloadElem.click();
    }

    checkImportData(data) {
        try {
            let parsedData = data.map((group) => TabGroup.fromJSON(group));
            return parsedData.length;
        } catch(e) {
            return -1;
        }
    }

    importJSON(data, merge = false) {
        try {
            let parsedData = data.map((group) => TabGroup.fromJSON(group));
            if(merge) {
                for(let tabGroup of parsedData) {
                    if(this.getGroupById(tabGroup.id)) {
                        tabGroup.id = Date.now();
                    }
                    this.tabGroups.push(tabGroup);
                }
            } else {
                this.tabGroups = parsedData;
            }
            this.saveAndUpdate();
            return parsedData.length;
        } catch(e) {
            return -1;
        }
    }
}