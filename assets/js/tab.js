class Tab {
    constructor(url, title, favIconUrl, tabId, priority) {
        this.url = url;
        this.title = title;
        this.favIconUrl = favIconUrl;
        this.tabId = tabId ?? -1;
        this.priority = priority ?? 0;
    }

    toJSON() {
        return {
            url: this.url,
            title: this.title,
            favIconUrl: this.favIconUrl,
            tabId: this.tabId,
            priority: this.priority
        };
    }

    static fromJSON(json) {
        return new Tab(
            json['url'],
            json['title'],
            json['favIconUrl'],
            json['tabId'],
            json['priority']
        );
    }

    linkTab(tabId) {
        this.tabId = tabId;
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
    }

    shouldUpdate(newTab) {
        return this.url != newTab.url || this.favIconUrl != newTab.favIconUrl || this.title != newTab.title;
    }
}