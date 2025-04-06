import { BG3Component } from "../component.js";

export class PortraitContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ["bg3-portrait-container"]
    }

    get actor() {
        return ui.BG3HOTBAR.manager.actor;
    }

    get img() {
        return this.actor.img;
    }

    get health() {
        const hpValue = this.actor.system.attributes?.hp?.value || 0;
        const hpMax = this.actor.system.attributes?.hp?.max || 1;
        const hpPercent = Math.max(0, Math.min(100, (hpValue / hpMax) * 100));
        const damagePercent = 100 - hpPercent;
        const tempHp = this.actor.system.attributes?.hp?.temp || 0;
        return {
            current: hpValue,
            max: hpMax,
            percent: hpPercent,
            damage: damagePercent,
            temp: tempHp
        }
    }

    async getData() {
        return {
            img: this.img,
            health: this.health,
            opacity: 1
        };
    }
}