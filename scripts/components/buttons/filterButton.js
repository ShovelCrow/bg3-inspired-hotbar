import { fromUuid } from "../../utils/foundryUtils.js";
import { BG3Component } from "../component.js";


export class FilterButton extends BG3Component {
    constructor(data, parent) {
        super(data, parent);
    }

    get classes() {
        return this.data.class;
    }

    get isPact() {
        return false;
    }

    get isApothecary() {
        return false;
    }

    get level() {
        return 1;
    }

    async getData() {
        return this.data;
    }

    get dataTooltip() {
        let title, subtitle;
        let desc = '';
        switch (this.data.id) {
            case 'action':
            case 'bonus':
            case 'reaction':
                title = this.data.label;
                break;
            case 'feature':
                title = game.i18n.localize("TYPES.Item.feat");
                break;
            case 'spell':
                title = !this.data.isPact && !this.data.isApothecary && this.data.level > 0 ? `${this.data.label} ${this.data.level}` : this.data.label;
                break;
            default:
                title = this.data.custom?.tooltip?.label;
                subtitle = `<i class="fa-solid fa-arrows-rotate" inert></i> <span>${this.data.custom?.tooltip?.recharge}</span>`;
                break;
        }
        if (title) {
            let color = this.data?.color;  
            let symbol = this.data?.symbol;
            desc = 
            `<span class="title" style="--data-color:${color}">
                ${symbol ? `<i class="fas ${symbol}"></i>` : ''}
                ${title}
                ${symbol ? `<i class="fas ${symbol}"></i>` : ''}
            </span>`;

            desc += subtitle ? `<p class="notes">${subtitle}</p>` : '';
            desc = `<div class="header">${desc}</div>`;

            const controlHints = true; //game.settings.get("dnd5e", "controlHints");
            desc += controlHints ? '<p class="notes"><i>Left-click to highlight items using this slot.</i></p><p class="notes"><i>Right-click to grey out.</i></p>' : '';
            desc = `<div class="custom-tooltip">${desc}</div>`;
        }
        return {type: 'simple', content: desc};
    }

    async _registerEvents() {
        this.element.addEventListener("click", (e) => {
            e.preventDefault();
            // if(this.data.custom || this._parent.used.includes(this)) return;
            if(this._parent.used.includes(this)) return;
            this._parent.highlighted = this;
        });

        this.element.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            // if(this.data.custom) return;
            this._parent.used = this;
        });
    }

    async render() {
        await super.render();
        this.element.style.color = this.data.color;
        if(this.data.background) this.element.style.backgroundImage = `url(${this.data.background})`;
        return this.element;
    }
}