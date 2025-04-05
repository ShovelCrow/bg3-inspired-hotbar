import { ActiveButton } from '../buttons/activeButton.js';
import { BG3Component } from "../component.js";

export class ActiveContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ['bg3-actives-container'];
    }

    get activesList() {
        if(!ui.BG3HOTBAR.manager.token && !ui.BG3HOTBAR.manager.actor) return null;
        const actor = ui.BG3HOTBAR.manager.actor;

        // Get active effects from the actor's sheet.
       return actor.effects?.contents || [];
    }

    async render() {
        const html = await super.render();
        const activesList = this.activesList;
        if(activesList.length === 0) this.element.style.visibility = 'hidden';
        for(let i = 0; i < activesList.length; i++) {
            const btn = new ActiveButton({item: activesList[i]});
            btn._parent = this;
            btn.render();
            this.element.appendChild(btn.element);
        }
        return this.element;
    }
}