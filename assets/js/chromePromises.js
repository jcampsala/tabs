function chromeStorageSyncGet(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(key, (result) => {
            if(Array.isArray(key) && key.length > 1) {
                resolve(result);
            } else if(Array.isArray(key) && key.length == 1) {
                resolve(result[key[0]]);
            } else {
                resolve(result[key]);
            }
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
