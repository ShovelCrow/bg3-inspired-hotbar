import { BG3Component } from "../component.js";
import { fromUuid } from "../../utils/foundryUtils.js";

export class GridCell extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ['hotbar-cell', 'drag-cursor'];
    }

    get slotKey() {
        return this.element.dataset.slot;
    }

    get _dragData() {
        return this.data.item ? { containerIndex: this._parent.index, slotKey: this.slotKey } : null;
    }

    async getData() {
        return {...super.getData(), ...this.data, ...await this.getItemUses()};
    }

    get item() {
        return (async () => {
            if(!this.data.uuid) return;
            return await fromUuid(this.data.uuid);
        })();
    }

    async getItemUses() {
        const itemData = await this.item;
        if (itemData?.system?.uses) {
            const uses = itemData.system.uses;
            const value = uses.value ?? 0;
            const max = uses.max ?? 0;

            // Only show uses if max > 0.
            if (max > 0) return {uses: {value: value, max: max}};
            else return null;
        } else return null;
    }

    async render() {
        const html = await super.render();
        this.element.setAttribute('data-slot', `${this.data.col}-${this.data.row}`);
        this.element.setAttribute('draggable', !!this.data.item);
        this.element.classList.toggle('has-item', !!this.data.item);
        if(this.data.item) {
            const itemData = await this.item;
            if(itemData) {
                if(itemData.system?.activation?.type) this.element.dataset.actionType = itemData.system.activation.type.toLowerCase();
                this.element.dataset.itemType = itemData.type;
                if(itemData.type === "spell") {
                    this.element.dataset.isPact = itemData.system.preparation?.mode === "pact";
                    this.element.dataset.level = itemData.system.level;
                }
                if(itemData.type === 'feat') this.element.dataset.featType = itemData.system.type?.value || 'default';
            }
        }

        return this.element;
    }
}