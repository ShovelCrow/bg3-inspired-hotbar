import { CONFIG } from "../utils/config.js";

export class PortraitSettingDialog extends FormApplication {
    constructor () {
        super();
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            title: 'Portrait settings',
            id: "bg3-inspired-hotbar-portrait-settings",
            template: `modules/bg3-inspired-hotbar/templates/portrait-dialog.hbs`,
            height: "auto",
            submitOnClose: false
        };
    }

    getData() {
        const configData = {
            hidePortraitImage: game.settings.get(CONFIG.MODULE_NAME, 'hidePortraitImage'),
            showExtraInfo: game.settings.get(CONFIG.MODULE_NAME, 'showExtraInfo'),
            defaultPortraitPreferences: game.settings.get(CONFIG.MODULE_NAME, 'defaultPortraitPreferences'),
            shapePortraitPreferences: game.settings.get(CONFIG.MODULE_NAME, 'shapePortraitPreferences'),
            borderPortraitPreferences: game.settings.get(CONFIG.MODULE_NAME, 'borderPortraitPreferences'),
            showSheetSimpleClick: game.settings.get(CONFIG.MODULE_NAME, 'showSheetSimpleClick'),
            backgroundPortraitPreferences: game.settings.get(CONFIG.MODULE_NAME, 'backgroundPortraitPreferences'),
            showHealthOverlay: game.settings.get(CONFIG.MODULE_NAME, 'showHealthOverlay'),
            showHPText: game.settings.get(CONFIG.MODULE_NAME, 'showHPText'),
            overlayModePortrait: game.settings.get(CONFIG.MODULE_NAME, 'overlayModePortrait')
        };
        return {configData};
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _onSubmit(event) {
        event.preventDefault();
        let data = [];
        const form = this.element[0].querySelectorAll('div.form-fields:not([data-exclude="true"])');
        for (let i = 0; i < form.length; i++) {
            const input = form[i].querySelector("input") ?? form[i].querySelector("select"),
                value = input.type == 'checkbox' ? input.checked : input.value;
            game.settings.set(CONFIG.MODULE_NAME, input.name.split('.')[1], value);
        }
        console.log(game.settings.get(CONFIG.MODULE_NAME, 'defaultPortraitPreferences'));
        this.close();
    }
}
export class ExtraInfosDialog extends FormApplication {
    constructor () {
        super();
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            title: 'Portrait extra datas settings',
            id: "bg3-inspired-hotbar-extradatas-settings",
            template: `modules/bg3-inspired-hotbar/templates/extra-infos-dialog.hbs`,
            height: "auto",
            submitOnClose: false
        };
    }

    getData() {
        let listAttr = TokenDocument.implementation.getTrackedAttributes();
        listAttr.bar.forEach(a => a.push("value"));
        const listAttrChoices = TokenDocument.implementation.getTrackedAttributeChoices(listAttr);
        return {extraInfos: game.settings.get(CONFIG.MODULE_NAME, "dataExtraInfo"), listAttrChoices};
    }

    activateListeners(html) {
        super.activateListeners(html);
        html[0].querySelectorAll(".list-attr").forEach((select) => {
            select.addEventListener("change", (event) => {
                const value = event.target.value;
                const inputAttr = event.target.closest(".form-group").querySelector(".attr");
                inputAttr.value = value;
            });
        });
    }

    async _onSubmit(event) {
        event.preventDefault();
        let data = [];
        const form = this.element[0].querySelectorAll('div.container-section');
        for (let i = 0; i < form.length; i++) {
            const attr = form[i].querySelector(".attr").value;
            const icon = form[i].querySelector(".icon").value;
            const color = form[i].querySelector(".color").value;
            const pos = form[i].querySelector(".notes").innerHTML;
            data.push({attr, icon, color, pos})
        }
        await game.settings.set(CONFIG.MODULE_NAME, "dataExtraInfo", data);
        this.close();
    }
}