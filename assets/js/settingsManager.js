class SettingsManager {
    constructor() {
        this.languageOptions = [ 'en', 'es' ];
        this.language = 'en';
        this.themeOptions = [ 0, 1, 2];
        this.theme = 0;
        this.translationsPath = 'assets/translations/strings.json';
        this.dictionary = {};
    }

    async init() {
        let settings = await chromeStorageSyncGet('settings');
        this.languageOptions = settings.languageOptions;
        this.language = settings.language;
        this.themeOptions = settings.themeOptions;
        this.theme = settings.theme;
        this.dictionary = JSON.parse(await this.loadTranslations());
    }

    toJSON() {
        return {
            languageOptions: this.languageOptions,
            language: this.language,
            themeOptions: this.themeOptions,
            theme: this.theme
        };
    }

    async saveChanges() {
        await chromeStorageSyncSet({ settings: this.toJSON() });
    }

    updateLanguage(lang) {
        if(this.languageOptions.includes(lang)) {
            this.language = lang;
            this.saveChanges();
            this.translateAll();
        } else {
            console.error(`Language ${lang} is not available!`);
        }
    }

    updateTheme(theme) {
        if(this.themeOptions.includes(theme)) {
            this.theme = theme;
            this.saveChanges();
        } else {
            console.error(`Theme ${theme} is not available!`);
        }
    }

    gettext(key) {
        if(this.dictionary[key]) {
            return this.dictionary[key][this.language];
        } else {
            console.error(`No translation found for key <${key}>!`);
            console.error(this.getPendingTranslations([key]));
            return key;
        }
    }

    translateElements(elements) {
        let notFound = [];
        for(let element of elements) {
            let key = element.dataset.key;
            if(this.dictionary[key] && this.dictionary[key][this.language]) {
                element.innerHTML = this.dictionary[key][this.language];
            } else {
                console.error(`No translation found for key <${key}>!`);
                notFound.push(key);
            }
        }
        if(notFound.length > 0) {
            console.log('Add and translate the following JSON to the strings.json file:');
            console.log(this.getPendingTranslations(notFound));
        }
    }

    async loadTranslations() {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.overrideMimeType("application/json");
            xhr.open('GET', this.translationsPath, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == "200") {
                    resolve(xhr.responseText);
                }
            };
            xhr.send(null);
        });
    }

    translateAll() {
        let translatables = document.getElementsByClassName('translatable');
        this.translateElements(translatables);
    }

    getPendingTranslations(keys) {
        let translationJson =  {};
        for(let key of keys) {
            translationJson[key] = {};
            for(let lang of this.languageOptions) {
                translationJson[key][lang] = 'PENDING';
            }
        }
        return JSON.stringify(translationJson);
    }
}