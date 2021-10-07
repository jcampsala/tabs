class SettingsManager {
    constructor() {
        this.languageOptions = [ 'en', 'es' ];
        this.language = 'en';
        this.themeOptions = [ 0, 1, 2];
        this.theme = 0;
        this.translationsPath = 'assets/translations/strings.json';
    }

    async init() {
        let settings = await chromeStorageSyncGet('settings');
        this.languageOptions = settings.languageOptions;
        this.language = settings.language;
        this.themeOptions = settings.themeOptions;
        this.theme = settings.theme;
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

    async gettext(key) {
        let dictionary = await this.loadTranslations();
        if(Array.isArray(key)) {
            let translations = {};
            for(let str of key) {
                translations[str] = dictionary[str][this.language];
            }
            return translations;
        } else {
            dictionary[str][this.language];
        }
    }

    async translateElements(elements) {
        let dictionary = JSON.parse(await this.loadTranslations());
        let notFound = [];
        for(let element of elements) {
            let key = element.dataset.key;
            if(dictionary[key] && dictionary[key][this.language]) {
                element.innerHTML = dictionary[key][this.language];
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