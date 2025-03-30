import { CONFIG } from "../utils/config.js";

export class ThemeSettingDialog extends FormApplication {
    constructor () {
        super();
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            title: 'Theme settings',
            id: "bg3-inspired-hotbar-theme-settings",
            template: `modules/bg3-inspired-hotbar/templates/theme-dialog.hbs`,
            height: "auto",
            submitOnClose: false
        };
    }

    getData() {
        const dataKeys = ['themeOption'],
            configData = {};
        for(let i = 0; i < dataKeys.length; i++) {
            const setting = game.settings.settings.get(`${CONFIG.MODULE_NAME}.${dataKeys[i]}`);
            if(setting.scope === 'client' || game.user.isGM) configData[dataKeys[i]] = game.settings.get(CONFIG.MODULE_NAME, dataKeys[i]);
        }
        return {configData};
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _onSubmit(event) {
        event.preventDefault();
        this.close();
    }
}