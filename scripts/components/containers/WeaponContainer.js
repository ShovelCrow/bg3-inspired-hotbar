import { CONFIG } from "../../utils/config.js";
import { BG3Component } from "../component.js";
import { GridContainer } from "./GridContainer.js";

export class WeaponContainer extends BG3Component {
    constructor(data) {
        super(data);
        this.components = {
            combat: [],
            weapon: []
        }
    }

    get classes() {
        return ["bg3-weapon-container"]
    }

    get activeSet() {
        return ui.BG3HOTBAR.manager.actor.getFlag(CONFIG.MODULE_NAME, 'activeSet') ?? 0;
    }

    set activeSet(index) {
        ui.BG3HOTBAR.manager.actor.setFlag(CONFIG.MODULE_NAME, 'activeSet', index);
        this.element.setAttribute('data-active-set', index);
    }

    async render() {
        const html = await super.render(),
            combatContainer = new GridContainer(this.data.combat[0]);
        this.components = {
            combat: [],
            weapon: []
        };
        combatContainer.id = 'combat';
        this.element.setAttribute('data-active-set', this.activeSet);
        await combatContainer.render();
        combatContainer.element.classList.toggle('hidden', !game.settings.get(CONFIG.MODULE_NAME, 'showCombatContainer'));
        this.components.combat.push(combatContainer);
        for(let i = 0; i < this.data.weapon.length; i++) {
            const gridData = this.data.weapon[i],
                container = new GridContainer(gridData);
            container.index = i;
            container.id = 'weapon';
            container.element.setAttribute('data-container-index', i);
            container._parent = this;
            container.render();
            this.element.appendChild(container.element);
            this.components.weapon.push(combatContainer);
            // this.addComponent(container);
        }
        this.element.appendChild(combatContainer.element);
        // this.addComponent(combatContainer);
        return this.element;
    }
}