import { BG3CONFIG } from "../../utils/config.js";

export class CPRActionsDialog extends FormApplication {
    constructor () {
        super();
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            id: "bg3-inspired-hotbar-setting-dialog",
            template: `modules/${BG3CONFIG.MODULE_NAME}/templates/dialog/cpr-actions-dialog.hbs`,
            title: "BG3.Settings.Menu.CPR.Label",
            height: "auto",
            submitOnClose: false
        };
    }

    async getData() {
        const cprs = game.packs.get("chris-premades.CPRActions");
        return {actions: cprs.index, selected: game.settings.get(BG3CONFIG.MODULE_NAME, 'choosenCPRActions')};
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _onSubmit(event) {
        event.preventDefault();
        const inputs = this.element[0].querySelectorAll('input.cpr-actions:checked');
        // game.settings.set(BG3CONFIG.MODULE_NAME, 'choosenCPRActions', inputs.map(i => i.id));
        console.log(inputs)
        console.log(inputs.map(i => i.id))
        /* for (let i = 0; i < form.length; i++) {
            const input = form[i].querySelector("input") ?? form[i].querySelector("select");
            if(!input) continue;
            const value = input.type == 'checkbox' ? input.checked : input.value;
            game.settings.set(BG3CONFIG.MODULE_NAME, input.name, value);
        }
        this.close(); */
    }
}