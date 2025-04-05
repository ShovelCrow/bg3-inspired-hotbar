import { BG3Component } from "../component.js";


export class PassiveButton extends BG3Component {
    constructor(data) {
        super(data);
        this.element.dataset.uuid = this.data.item.uuid;
    }

    get classes() {
        return ['passive-feature-icon'];
    } 

    async getData() {
        return this.data.item;
    }

    _registerEvents() {
        this.element.addEventListener("click", async () => {
            if(this.data.item.use) await this.data.item.use();
        });
    }
}