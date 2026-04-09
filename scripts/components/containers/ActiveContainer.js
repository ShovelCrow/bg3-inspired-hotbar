import { ActiveButton } from "../buttons/activeButton.js";
import { BG3Component } from "../component.js";
import { BG3CONFIG } from "../../utils/config.js";

export class ActiveContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ['bg3-actives-container'];
    }

    get activesList() {
        if(!this.token && !this.actor) return null;

        // // Get active effects from the actor's sheet.
        // return this.actor.effects?.contents || [];

        // SHOVEL
        let effects = Array.from(this.actor?.allApplicableEffects()) || [];
        const isTemp = (ae) => {
            return ((ae?.isTemporary && (!ae?.transfer || !ae?.flags?.dae?.showIcon))
                || (!ae?.isTemporary && !ae?.transfer)) ? 1 : 0;
        }
        effects.sort((a, b) => isTemp(a) - isTemp(b))
        effects.sort((a, b) => { if(!isTemp(a) && !isTemp(b)) return a?.name.localeCompare(b?.name); });

        const hideActives = game.settings.get(BG3CONFIG.MODULE_NAME, "hideUnavailable"); //this.actor.getFlag(BG3CONFIG.MODULE_NAME, "hideActives");
        if (hideActives) effects = effects.filter(ae => !ae.isSuppressed);

        return effects;
    }

    async render() {
        await super.render();

        const activesList = this.activesList;
        console.log(activesList.length);
        if(activesList?.length > 0) {
            this.element.style.removeProperty('visibility');
            const actives = activesList.map((active) => new ActiveButton({item: active}, this));
            for(const active of actives) this.element.appendChild(active.element);
            await Promise.all(actives.map((active) => active.render()));
        }
        else {
            this.element.style.visibility = 'hidden';
        }
        
        return this.element;
    }
}