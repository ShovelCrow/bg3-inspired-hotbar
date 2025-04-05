import { CONFIG } from "../../utils/config.js";
import { BG3Component } from "../component.js";
import { GridContainer } from "./GridContainer.js";

export class WeaponContainer extends BG3Component {
    constructor(data) {
        super(data);
        this.element.setAttribute('data-active-set', this.activeSet);
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
        combatContainer.render();
        for(let i = 0; i < this.data.weapon.length; i++) {
            const gridData = this.data.weapon[i],
                container = new GridContainer(gridData);
            container.element.setAttribute('data-container-index', i);
            container._parent = this;
            container.render();
            this.element.appendChild(container.element);
            this.addComponent(container);
        }
        this.element.appendChild(combatContainer.element);
        this.addComponent(combatContainer);
        return this.element;
    }
}