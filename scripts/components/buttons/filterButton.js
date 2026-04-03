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
        let tooltip = '';
        let desc = {
            title: '',
            color: this.data.color,
            symbol: this.data.symbol,
            resource: game.i18n.localize("BG3.Hotbar.Filter.resource")
        };
        switch (this.data.id) {
            case 'action':
            case 'bonus':
            case 'reaction':
                desc.title = this.data.label;
                break;
            case 'feature':
                desc.title = game.i18n.localize("TYPES.Item.feat");
                desc.resource = '';
                break;
            case 'spell':
                const plurals = new Intl.PluralRules(game.i18n.lang, { type: "ordinal" });
                const slotLabel = game.i18n.format(`DND5E.SpellSlotsN.${plurals.select(this.data.level)}`, { n: this.data.level });
                desc.title = (!this.data.isPact && !this.data.isApothecary && this.data.level > 0) ? slotLabel : this.data.label;
                desc.symbolCustom = this.data.symbolCustom;
                desc.resource = game.i18n.localize("BG3.Hotbar.Filter.slot").toLowerCase();
                break;
            default:
                if (this.data.custom?.tooltip) {
                    desc.title = this.data.custom.tooltip.label;
                    desc.subtitle = this.data.custom.tooltip.recharge;
                    if (this.data.custom.subtypeId) desc.resource = '';
                }
                // desc = this.data.custom?.tooltip ? `<div class="custom-tooltip dnd5e2">h4 style="--data-color:${this.data.color}">${this.data.custom?.tooltip?.label}</h4>${this.data.custom?.tooltip?.pills ? `<ul class="pills">${this.data.custom.tooltip.pills.map(p => `<li class="pill"><span class="label" style="color: #4e4e4e;">${p}</label></li>`).join('')}</ul>` : ''}</div>` : false;
                break;
        }
        if (desc.title) {
            tooltip = this._customToolTip(desc);
        }
        return {type: 'simple', content: tooltip};
    }

    _customToolTip(data) {
        let { title, subtitle, symbol, color, symbolCustom, resource } = data;

        let symbolSpan = symbolCustom ?? (symbol ? `<i class="fas ${symbol}"></i>` : '');
        let subtitleSpan = subtitle ? `<p class="subtitle notes"><i class="fa-solid fa-arrows-rotate"></i> <span>${subtitle}</span></p>` : '';
        let resourceSpan = resource ? game.i18n.format("BG3.Hotbar.Filter.LeftClick", {resource}) : game.i18n.localize("BG3.Hotbar.Filter.LeftClickType");

        let template = `
        <section class="custom-tooltip dnd5e2">
            <section class="header">
                <span class="title" style="--data-color:${color}">${symbolSpan}${title}${symbolSpan}</span>
                ${subtitleSpan}
            </section>
            <div>
                <p class="notes"><em>${resourceSpan}</em></p>
                <p class="notes"><em>${game.i18n.localize("BG3.Hotbar.Filter.RightClick")}</em></p>
            </div>
        </section>
        `
        return template;
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