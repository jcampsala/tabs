function chromeStorageSyncGet(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([key], (result) => {
            resolve(result[key]);
        });
    });
}

function chromeStorageSyncSet(data) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set(data, () => {
            resolve(true);
        });
    });
}
