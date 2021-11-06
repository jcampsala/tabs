class DbManager {
    constructor() {
        this.db;
        this.defaultObjectStore;
    }

    init() {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open('tab_groups_db', 1);
            this.defaultObjectStore = 'tab_groups';

            request.onerror = (e) => {
                reject('IndexedDB not allowed');
            };

            request.onupgradeneeded = (e) => {
                this.db = e.target.result;

                if(e.oldVersion < 1) {
                    console.log('Upgrading DB to version 1');
                    let objStore = this.db.createObjectStore('tab_groups', { keyPath: 'id', autoIncrement : true });
                    objStore.createIndex('name', 'name', { unique: false });
                } else if(e.oldVersion < 2) {
                    console.log('Upgrading DB to version 2');
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                this.db.onerror = (e) => {
                    console.error('Database generic error', e);
                }
                resolve(this.db);
            };
        });
    }

    get(id, transaction = this.defaultObjectStore, objStore = this.defaultObjectStore) {
        return new Promise((resolve, reject) => {
            let request;
            if(!id || id.length === 0) {
                request = this.db.transaction(transaction)
                            .objectStore(objStore)
                            .getAll();
            } else {
                request = this.db.transaction(transaction)
                            .objectStore(objStore)
                            .get(id);
            }
            
            request.onerror = (e) => {
                console.error('get request error', e);
                reject(e);
            };
            
            request.onsuccess = (e) => {
                console.log('get request success', request.result);
                resolve(request.result);
            };
        });
    }

    getByIndex(attr, value, transaction = this.defaultObjectStore, objStore = this.defaultObjectStore) {
        return new Promise((resolve, reject) => {
            let index = this.db.transaction(transaction)
                        .objectStore(objStore)
                        .index(attr);

            index.get(value).onsuccess = (e) => {
                console.log(e);
                resolve(e.target.result);
            };

            index.get(value).onerror = (e) => {
                console.log('get by index error', e);
                reject(e);
            };
        });
    }

    insert(data, transaction = this.defaultObjectStore, objStore = this.defaultObjectStore) {
        return new Promise((resolve, reject) => {
            let request = this.db.transaction(transaction, 'readwrite')
                            .objectStore(objStore)
                            .add(data);
            
            request.onerror = (e) => {
                console.error('insert error', e);
                reject(e);
            };

            request.onsuccess = (e) => {
                console.log(e);
                resolve(true);
            }
        });
    }

    update(id, data, transaction = this.defaultObjectStore, objStore = this.defaultObjectStore) {
        return new Promise(async (resolve, reject) => {
            try {
                let toUpdate = await this.get(id, transaction, objStore);

                for(let key of Object.keys(data)) {
                    toUpdate[key] = data[key];
                }

                let request = this.db.transaction(transaction, 'readwrite')
                                .objectStore(objStore)
                                .put(toUpdate);

                request.onerror = (e) => {
                    console.error('update error', e);
                    reject(e);
                };

                request.onsuccess = (e) => {
                    resolve(true);
                };
            } catch(e)  {
                reject(e);
            }
        });
    }

    delete(id, transaction = this.defaultObjectStore, objStore = this.defaultObjectStore) {
        return new Promise((resolve, reject) => {
            let request = this.db.transaction(transaction, 'readwrite')
                            .objectStore(objStore)
                            .delete(id);

            request.onsuccess = (e) => {
                resolve(true);
            };

            request.onerror = (e) => {
                console.error('delete by index error', e);
                reject(e);
            }
        });
    }

    clear(transaction = this.defaultObjectStore, objStore = this.defaultObjectStore) {
        return new Promise((resolve, reject) => {
            let request = this.db.transaction(transaction, 'readwrite')
                            .objectStore(objStore)
                            .clear();
            
            request.onsuccess = (e) => {
                resolve(true);
            };

            request.onerror = (e) => {
                console.error('clear error', e);
                reject(e);
            }
        });
    }

    import(importData, transaction = this.defaultObjectStore, objStore = this.defaultObjectStore) {
        return new Promise((resolve, reject) => {
            let trans = this.db.transaction(transaction, 'readwrite');

            trans.oncomplete = (e) => {
                console.log('Import completed', e);
                resolve(e);
            }

            trans.onerror = (e) => {
                console.error('import failed', e);
                // TODO: might need to rollback imported elements
                reject(e);
            }

            let objectStore = trans.objectStore(objStore);
            let totalImport = importData.length;
            let currentImport = 0;
            importData.forEach((elem) => {
                let request = objectStore.add(elem);
                
                request.onsuccess = (e) => {
                    currentImport += 1;
                    console.log(`Imported ${currentImport} of ${totalImport}`);
                }

                request.onerror = (e) => {
                    console.error(`Error importing elem ${currentImport + 1} of ${totalImport}`);
                    reject(e);
                }
            })
        });
    }
}