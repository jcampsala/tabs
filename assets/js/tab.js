class Tab {
    constructor(url, title, favIconUrl, tabId, priority, id) {
        this.url = url;
        this.title = title;
        this.favIconUrl = favIconUrl;
        this.tabId = tabId ?? -1;
        this.priority = priority ?? 0;
        this.id = id;
    }

    toJSON() {
        return {
            url: this.url,
            title: this.title,
            favIconUrl: this.favIconUrl,
            tabId: this.tabId,
            priority: this.priority,
            id: this.id
        };
    }

    static fromJSON(json) {
        return new Tab(
            json['url'],
            json['title'],
            json['favIconUrl'],
            json['tabId'],
            json['priority'],
            json['id']
        );
    }

    linkTab(tabId) {
        this.tabId = tabId;
    }

    unlinkTab() {
        this.tabId = -1;
    }

    hasLinkedTab() {
        return this.tabId != -1;
    }

    updateWith(newData) {
        this.url = newData.url ?? this.url;
        this.title = newData.title ?? this.title;
        this.favIconUrl = newData.favIconUrl ?? this.favIconUrl;
        this.tabId = newData.tabId ?? this.tabId;
        this.priority = newData.priority ?? this.priority;
        this.id = newData.id ?? this.id;
    }

    shouldUpdate(newTab) {
        return this.url != newTab.url || this.favIconUrl != newTab.favIconUrl || this.title != newTab.title;
    }
}
