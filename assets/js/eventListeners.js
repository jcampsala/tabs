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

function validateGroupCreation(manager, withTabs = false) {
    let groupNameInput = document.getElementById('creation-group-name');
    let groupName = groupNameInput.value;
    console.log(groupName);
    if(groupName.length > 0) {
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

function initAllListeners(manager) {
    setMainPageListeners();
    setCreationPageListeners(manager);
    setNotificationListeners();
}