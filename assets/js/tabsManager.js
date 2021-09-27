class TabsManager {
    constructor() {
        this.tabGroups = [];
        this.currentGroup = null;
        this.rowReferences = [];
        this.ready = false;
    }

    async init(callback) {
        let storageData = await chromeStorageSyncGet('groups');
        this.tabGroups = storageData.map((group) => TabGroup.fromJSON(group));
        this.ready = true;
        // if(callback != null) callback(this.tabGroups);
        // this.displayGroups();
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
        let rowHtml = `<div id="${group.id}-row" class="tabs-row">
            <div class="tabs-row-top ${this.currentGroup == group ? 'selected' : ''}">
                <div>${group.name}</div>
                <div><a id="${group.id}-delete" class="button row-delete-btn"><i class="fas fa-trash-alt"></i></a></div>
            </div>
            <div id="${group.id}-row-main" class="tabs-row-main">`;
        for(let tab of group.tabs) {
            rowHtml += `<div class="tab-list-icon">
                <div class="centered-icon-container">
                    <img class="contained-icon" src="${tab.favIconUrl ?? 'assets/images/icon32.png'}">
                </div>
            </div>`; 
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
        for(let tabGroup of targetGroups) {
            let deleteBtn = tabGroup.getDeleteButton();
            deleteBtn.onclick = () => this.deleteTabGroup(tabGroup.id);
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
            await chrome.windows.update(selectedTabGroup.windowId, {
                focused: true,
                state: 'maximized'
            });
        } else {
            let newWindow = await chrome.windows.create({
                focused: true,
                url: selectedTabGroup.getUrlStrings(),
                state: 'maximized' 
            });
            selectedTabGroup.linkWindow(newWindow.id);
            this.saveChanges();
        }
    }
}