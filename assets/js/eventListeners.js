function setMainPageListeners() {
    let scrollContainers = [...document.getElementsByClassName('outer-tabs-container')];
    scrollContainers.map((container) => {
        container.autoFadeFunction = function (hide) {
            hide ? container.classList.add('scroll-hidden') : container.classList.remove('scroll-hidden');
        };
        container.onscroll = function () {
            this.autoFadeFunction(false);
            clearInterval(this.autoFadeTimeout);
            this.autoFadeTimeout = setTimeout(() => this.autoFadeFunction(true), 1000);
        };
    })

    document.getElementById('create-group-btn').onclick = () => {
        slidePage();
    };
}

function setCreationPageListeners(tabsManager) {
    document.getElementById('create-group-back-btn').onclick = () => {
        slidePage(false);
    };

    document.getElementById('create-empty-group-btn').onclick = () => {
        validateGroupCreation(tabsManager);
    }

    document.getElementById('create-current-tab-group-btn').onclick = () => {
        validateGroupCreation(tabsManager, true);
    }

    document.getElementById('creation-group-name').onkeyup = (event) => {
        if(event.key == 'Enter') {
            validateGroupCreation(tabsManager, true);
        }
    }
}

function setDeleteDialogListeners() {
    let dialog = document.getElementById('delete-dialog-page');
    dialog.togglePage = (show) => 
        show ? dialog.classList.add('fade-in-from-behind') : dialog.classList.remove('fade-in-from-behind');
    dialog.updateTargetName = (name) =>
        document.getElementById('delete-group-name').innerHTML = name;

    let confirmButton = document.getElementById('delete-dialog-confirm');
    confirmButton.onclick = () => {
        confirmButton.dialogAction();
        clearDialogPage();
        dialog.togglePage(false);
    }
    let cancelButton = document.getElementById('delete-dialog-cancel');
    cancelButton.onclick = () => {
        clearDialogPage();
        dialog.togglePage(false);
    }

    let dialogOut = document.getElementById('delete-dialog-out');
    dialogOut.onclick = () => {
        clearDialogPage();
        dialog.togglePage(false);
    }
}

function setSettingsListeners(tabsManager, settingsManager) {
    let settings = document.getElementById('settings-page');
    settings.togglePage = (show) => 
        show ? settings.classList.add('slide-from-above') : settings.classList.remove('slide-from-above');
    
    let settingsButton = document.getElementById('settings-btn');
    settingsButton.onclick = () => {
        settings.togglePage(true);
    }

    let backButton = document.getElementById('settings-back-btn');
    backButton.onclick = () => {
        settings.togglePage(false);
    }

    let fileUpload = document.getElementById('file-upload');
    // TODO: onchange does not trigger if import is canceled and retried with same file
    fileUpload.onchange = (event) => {
        if(fileUpload.files.length > 0) {
            let importFile = fileUpload.files[0];
            if(importFile.type === 'application/json') {
                let reader = new FileReader();
                reader.readAsText(importFile);
                reader.onload = (event) => {
                    let importSize = parseImportFile(tabsManager, event.target.result);
                    if(importSize > 0) {
                        let importDialog = document.getElementById('import-dialog-page')
                        importDialog.updateImportNumber(importSize);
                        importDialog.setImportContent(JSON.parse(event.target.result));
                        importDialog.togglePage(true);
                    }
                }
            } else {
                showSnackbar(settingsManager.gettext('Not a JSON file!'));
            }
        }
        fileUpload.value = null;
    }

    let dropZone = document.getElementById('drop-zone');
    dropZone.onclick = () => {
        fileUpload.click();
    }

    let exportBtn = document.getElementById('export-btn');
    exportBtn.onclick = () => {
        tabsManager.exportJSON();
        showSnackbar(settingsManager.gettext('Export file generated!'), null, true);
    }

    let themeSelect = document.getElementById('theme-select');
    themeSelect.value = settingsManager.theme;
    themeSelect.onchange = () => {
        settingsManager.updateTheme(parseInt(themeSelect.value));
    }

    let languageSelect = document.getElementById('lang-select');
    languageSelect.value = settingsManager.language;
    languageSelect.onchange = () => {
        settingsManager.updateLanguage(languageSelect.value);
    }
}

function parseImportFile(tabsManager, fileContents) {
    try {
        let importedJSON = JSON.parse(fileContents);
        let importSize = tabsManager.checkImportData(importedJSON);
        if(importSize < 1) {
            showSnackbar(settingsManager.gettext('JSON file contains invalid data'));
            return -1;
        } else {
            return importSize;
        }
    } catch(e) {
        showSnackbar(settingsManager.gettext('JSON file is not valid!'));
        return -1;
    }
}

function setImportDialogListeners(tabsManager) {
    let dialog = document.getElementById('import-dialog-page');
    dialog.togglePage = (show) => 
        show ? dialog.classList.add('fade-in-from-behind') : dialog.classList.remove('fade-in-from-behind');
    dialog.updateImportNumber = (number) =>
        document.getElementById('import-group-number').innerHTML = number;
    dialog.setImportContent = (content) => {
        dialog.importContent = content;
    }

    let overwriteButton = document.getElementById('import-dialog-overwrite');
    overwriteButton.onclick = () => {
        let importResult = tabsManager.importJSON(dialog.importContent);
        if(importResult > 0) {
            showSnackbar(`${importResult} ${settingsManager.gettext('groups imported')}`, null, true);
        } else {
            showSnackbar(settingsManager.gettext('Import failed!'));
        }
        dialog.togglePage(false);
    }

    let mergeButton = document.getElementById('import-dialog-merge');
    mergeButton.onclick = () => {
        let importResult = tabsManager.importJSON(dialog.importContent, true);
        if(importResult > 0) {
            showSnackbar(`${importResult} ${settingsManager.gettext('groups imported')}`, null, true);
        } else {
            showSnackbar(settingsManager.gettext('Import failed!'));
        }
        dialog.togglePage(false);
    }

    let cancelButton = document.getElementById('import-dialog-cancel');
    cancelButton.onclick = () => {
        dialog.togglePage(false);
    }

    let dialogOut = document.getElementById('import-dialog-out');
    dialogOut.onclick = () => {
        dialog.togglePage(false);
    }
}

function setNotificationListeners() {
    let snackbar = document.getElementById('snackbar');
    snackbar.fadeIn = function(text) {
        clearInterval(this.fadeOutTimeout);
        clearInterval(this.hideTimeout);
        this.innerHTML = text;
        this.classList.remove('hidden');
        this.classList.remove('fadingOut');
        this.classList.add('fadingIn');
        this.fadeOutTimeout = setTimeout(this.fadeOut, 3000);
    };
    snackbar.fadeOut = function() {
        snackbar.classList.add('fadingOut');
        snackbar.classList.remove('fadingIn');
        snackbar.hideTimeout = setTimeout(function() {
            snackbar.classList.add('hidden');
            snackbar.classList.remove('fadingOut');
        }, 3000);
    };
}

function slidePage(slideIn = true) {
    let creationPage = document.getElementById('create-group-page');
    if(slideIn) {
        creationPage.classList.add('slide-from-right');
        document.getElementById('creation-group-name').focus();
    } else {
        creationPage.classList.remove('slide-from-right');
        document.getElementById('creation-group-name').value = '';
    }
}

function validateGroupCreation(tabsManager, withTabs = false) {
    let groupNameInput = document.getElementById('creation-group-name');
    let groupName = groupNameInput.value;
    if(groupName.length > 0) {
        groupName = groupName.length > 50 ? groupName.substring(0, 50) : groupName;
        tabsManager.createNewGroup(groupName, withTabs);
        slidePage(false);
    } else {
        let inputFocus = () => {
            groupNameInput.focus();
        };
        showSnackbar(settingsManager.gettext('Group name cannot be empty!'), inputFocus);
    }
}

function showSnackbar(text, action, success = false) {
    let snackbar = document.getElementById('snackbar');
    success ? snackbar.classList.remove('snackbar-warning') : snackbar.classList.add('snackbar-warning');
    success ? snackbar.classList.add('snackbar-success') : snackbar.classList.remove('snackbar-success');
    snackbar.fadeIn(text);
    if(action) action();
}

function hideSnackbar() {
    let snackbar = document.getElementById('snackbar');
    snackbar.fadeOut();
}

function clearDialogPage() {
    document.getElementById('delete-dialog-confirm').dialogAction = () => {};
    document.getElementById('delete-group-name').innerHTML = '';
}

function initAllListeners(tabsManager, settingsManager) {
    setMainPageListeners();
    setCreationPageListeners(tabsManager);
    setDeleteDialogListeners();
    setSettingsListeners(tabsManager, settingsManager);
    setImportDialogListeners(tabsManager);
    setNotificationListeners();
}