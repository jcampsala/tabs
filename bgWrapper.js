try {
    importScripts("/assets/js/tab.js");
    importScripts("/assets/js/tabGroup.js");
    importScripts("/assets/js/chromePromises.js");
    importScripts("/assets/js/bgStateManager.js");
    importScripts("/assets/js/background.js");
} catch(e) {
    console.error('Error importing script files!');
    console.error(e);
}