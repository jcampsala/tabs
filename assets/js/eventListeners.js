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

function setCreationPageListeners(manager) {
    document.getElementById('create-group-back-btn').onclick = () => {
        slidePage(false);
    };

    document.getElementById('create-empty-group-btn').onclick = () => {
        validateGroupCreation(manager);
    }

    document.getElementById('create-current-tab-group-btn').onclick = () => {
        validateGroupCreation(manager, true);
    }

    document.getElementById('creation-group-name').onkeyup = (event) => {
        if(event.key == 'Enter') {
            validateGroupCreation(manager, true);
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

function setNotificationListeners() {
    let snackbar = document.getElementById('warning-snackbar');
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

function validateGroupCreation(manager, withTabs = false) {
    let groupNameInput = document.getElementById('creation-group-name');
    let groupName = groupNameInput.value;
    if(groupName.length > 0) {
        groupName = groupName.length > 50 ? groupName.substring(0, 50) : groupName;
        manager.createNewGroup(groupName, withTabs);
        slidePage(false);
    } else {
        let inputFocus = () => {
            groupNameInput.focus();
        };
        showSnackbar('Group name cannot be empty!', inputFocus);
    }
}

function showSnackbar(text, action) {
    let snackbar = document.getElementById('warning-snackbar');
    snackbar.fadeIn(text);
    action();
}

function hideSnackbar() {
    let snackbar = document.getElementById('warning-snackbar');
    snackbar.fadeOut();
}

function clearDialogPage() {
    document.getElementById('delete-dialog-confirm').dialogAction = () => {};
    document.getElementById('delete-group-name').innerHTML = '';
}

function initAllListeners(manager) {
    setMainPageListeners();
    setCreationPageListeners(manager);
    setDeleteDialogListeners();
    setNotificationListeners();
}