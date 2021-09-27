class TabGroup {
    constructor(name, tabs, windowId, priority, creationDate, id) {
        this.name = name;
        this.tabs = tabs ?? [];
        this.windowId = windowId ?? -1;
        this.priority = priority ?? 0;
        this.creationDate = creationDate ?? Date.now(); 
        this.id = id ?? this.creationDate.toString();
    }

    toJSON() {
        return {
            name: this.name,
            tabs: this.tabs.map((tab) => tab.toJSON()),
            windowId: this.windowId,
            priority: this.priority,
            creationDate: this.creationDate,
            id: this.id
        };
    }

    static fromJSON(json) {
        console.log(json);
        return new TabGroup(
            json['name'],
            json['tabs'].map((tab) => Tab.fromJSON(tab)),
            json['windowId'],
            json['priority'],
            json['creationDate'],
            json['id']
        );
    }

    getTabById(id) {
        return this.tabs.find((tab) => tab.tabId === id);
    }

    // show() {
    //     let groupHtml = `<div id="${this.id}-row" class="tabs-row">
    //         <div class="tabs-row-top ${/*this.currentGroup == group ? 'selected' : */''}">
    //             <div>${this.name}</div>
    //             <div><a id="${this.id}-delete" class="button row-delete-btn"><i class="fas fa-trash-alt"></i></a></div>
    //         </div>
    //         <div class="tabs-row-main">`;
    //     for(let tab of this.tabs) groupHtml += tab.show();
    //     groupHtml += `</div></div>`;
    //     return groupHtml;
    // }

    getDeleteButton() {
        return document.getElementById(`${this.id}-delete`);
    }

    getDOMRow() {
        // return document.getElementById(`${this.id}-row`);
        return document.getElementById(`${this.id}-row-main`);
    }

    getUrlStrings() {
        return this.tabs.map((tab) => tab.url);
    }

    linkWindow(windowId) {
        this.windowId = windowId;
    }

    unlinkWindow() {
        this.windowId = -1;
    }

    hasLinkedWindow() {
        return this.windowId != -1;
    }

    addTab(tab) {
        this.tabs.push(tab);
    }

    removeTab(id) {
        let tabId = this.tabs.findIndex((tab) => tab.tabId === id);
        if(tabId) {
            this.tabs.splice(tabId, 1);
        } else {
            console.error(`No tab found with id ${id} in taab group ${this.id}`);
        }
    }
}