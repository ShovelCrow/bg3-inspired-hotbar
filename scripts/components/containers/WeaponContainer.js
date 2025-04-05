import { CONFIG } from "../../utils/config.js";
import { BG3Component } from "../component.js";
import { GridContainer } from "./GridContainer.js";

export class WeaponContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ["bg3-weapon-container"]
    }

    async render() {
        const html = await super.render(),
            combatContainer = new GridContainer(this.data.combat[0]);
        combatContainer.render();
        for(let i = 0; i < this.data.weapon.length; i++) {
            const input = document.createElement('input');
            input.setAttribute('type', 'radio');
            input.setAttribute('name', 'weapon-choice');
            input.setAttribute('id', `weapon-set-${i}`);
            if(i === 0) input.checked = true;
            this.element.appendChild(input);
        }
        for(let i = 0; i < this.data.weapon.length; i++) {
            const gridData = this.data.weapon[i],
                container = new GridContainer(gridData);
            container.element.setAttribute('data-container-index', i);
            container.element.setAttribute('for', `weapon-set-${i}`);
            container.render();
            this.element.appendChild(container.element);
            this.addComponent(container);
        }
        this.element.appendChild(combatContainer.element);
        this.addComponent(combatContainer);
        return this.element;
    }
}