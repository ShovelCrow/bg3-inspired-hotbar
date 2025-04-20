import { fromUuid } from "../../utils/foundryUtils.js";
import { BG3Component } from "../component.js";


export class FilterButton extends BG3Component {
    constructor(data, parent) {
        super(data, parent);
        this.state = false;
        this.used = false;
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

    setState(force) {
        this.state = force ? false : !this.state;
        this.element.style.borderColor = this.state ? this.data.color : 'transparent';
    }

    get dataTooltip() {
        let desc = '';
        switch (this.data.id) {
            case 'action':
            case 'bonus':
            case 'reaction':
                desc = `<div class="custom-tooltip"><h4 style="--data-color:${this.data.color}"><i class="fas ${this.data.symbol}"></i>${this.data.label}<i class="fas ${this.data.symbol}"></i></h4><p class="notes"><i>Left Click to highlight items using this resource.</i></p><p class="notes"><i>Right Click to grey out.</i></p></div>`; 
                break;
            case 'feature':
                desc = `<div class="custom-tooltip"><h4 style="--data-color:${this.data.color}"><i class="fas ${this.data.symbol}"></i>Feature<i class="fas ${this.data.symbol}"></i></h4><p class="notes"><i>Left Click to highlight items of type feature.</i></p><p class="notes"><i>Right Click to grey out.</i></p></div>`; 
                break;
            case 'spell':
                const label = !this.data.isPact && !this.data.isApothecary && this.data.level > 0 ? `${this.data.label} ${this.data.level}` : this.data.label;
                desc = `<div class="custom-tooltip"><h4 style="--data-color:${this.data.color}">${label}</h4><p class="notes"><i>Left Click to highlight items using this slot.</i></p><p class="notes"><i>Right Click to grey out.</i></p></div>`; 
                break;
            default:
                break;
        }
        return {type: 'simple', content: desc};
    }

    getDataToCompare(cell) {
        switch (this.data.id) {
            case 'spell':
                if(this.data.isPact) return cell.dataset.preparationMode === 'pact';
                else if(this.data.isApothecary) return cell.dataset.preparationMode === 'apothecary';
                else return parseInt(cell.dataset.level) === this.data.level;
            case 'feature':
                return cell.dataset.itemType === 'feat';
            default:
                return this.data.id === cell.dataset.actionType;
        }
    }

    async updateHighlight() {
        this.setState();
        $('.bg3-hotbar-container .bg3-hotbar-subcontainer .has-item').each(async (index, cell) => {
            try {
                const activation = this.getDataToCompare(cell);
                cell.setAttribute('data-highlight', this.state ? (activation ? 'highlight' : 'excluded') : false);
            } catch (error) {
                console.error("Error updating highlights:", error);
            }
        })
    }

    async _registerEvents() {
        this.element.addEventListener("click", async (e) => {
            e.preventDefault();
            if(this.used) return;
            await this._parent.clearFilters(this);
            this.updateHighlight();
        });

        this.element.addEventListener("contextmenu", async (e) => {
            e.preventDefault();
            if(this.state) this.updateHighlight();
            this.used = !this.used;
            this.element.classList.toggle('used', this.used);
            $('.bg3-hotbar-container .bg3-hotbar-subcontainer .has-item').each(async (index, cell) => {
                try {
                    const activation = this.getDataToCompare(cell);
                    if(activation) cell.classList.toggle('used', this.used);
                } catch (error) {
                    console.error("Error updating used:", error);
                }
            })
        });
    }

    async render() {
        await super.render();
        this.element.style.color = this.data.color;
        return this.element;
    }
}