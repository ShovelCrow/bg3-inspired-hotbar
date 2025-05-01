import { BG3Component } from "../component.js";

export class BaseButton extends BG3Component {
    constructor(data, parent) {
        super(data, parent);
    }

    get classes() {
        return this.data.class ?? []
    }

    get visible() {
        if(this.data['visible']) return this.data['visible']();
        else return true;
    }

    get dataTooltip() {
        if(!this.data.title || this.data.hasChildren) return null;
        else return {type: 'simple', content: this.data.title};
    }

    async render() {
        await super.render();
        if(!this.visible) this.element.classList.add('hidden');
        if(this.data.attr) Object.entries(this.data.attr).forEach(([value, index]) => this.element.setAttribute(value, index));
        if(this.data.key) this.element.setAttribute('data-key', this.data.key);
        if(this.data.label) {
            const btnLabel = document.createElement("span");
            btnLabel.classList.add("rest-turn-label");
            btnLabel.innerText = this.data.label;
            this.element.appendChild(btnLabel);
        }
        if(this.data.icon) {
            const btnIcon = document.createElement("i");
            if(this.data.hasChildren) {
                btnIcon.dataset.tooltip = this.data.title;
                btnIcon.dataset.tooltipDirection = 'UP';
            }
            btnIcon.classList.add("fas", this.data.icon);
            this.element.appendChild(btnIcon);
        }
        return this.element;
    }
}