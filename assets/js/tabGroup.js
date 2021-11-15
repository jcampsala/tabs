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

    getTabByUrl(url, unlinked = false) {
        if(unlinked) {
            return this.tabs.find((tab) => tab.url === url && tab.tabId === -1);
        } else {
            return this.tabs.find((tab) => tab.url === url); 
        }
        // return this.tabs.find((tab) => !active ? tab.url === url : tab.url === url && tab.id === -1);
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

    unlinkWindow(cascade = false) {
        this.windowId = -1;
        if(cascade) {
            for(let tab of this.tabs) {
                tab.unlinkTab();
            }
        }
    }

    hasLinkedWindow() {
        return this.windowId != -1;
    }

    addTab(tab) {
        this.tabs.push(tab);
    }

    removeTab(id) {
        for(let i = 0; i < this.tabs.length; i++) {
            if(this.tabs[i].tabId === id) {
                this.tabs.splice(i, 1);
                return 0;
            }
        }
        console.error(`No tab found with id ${id} in taab group ${this.id}`);
        return -1;
    }

    updateWith(newData) {
        this.name = newData.name ?? this.name;
        this.tabs = newData.tabs ?? this.tabs;
        this.windowId = newData.windowId ?? this.windowId;
        this.priority = newData.priority ?? this.priority;
        this.creationDate = newData.creationDate ?? this.creationDate; 
        this.id = newData.id ?? this.id;
    }
}
