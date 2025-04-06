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
        return {...super.getData(), ...this.data};
    }

    get item() {
        if(!this.data.uuid) return;
        return fromUuid(this.data.uuid);
    }

    async render() {
        const html = await super.render();
        // console.log(this.data);
        // this.element.setAttribute('data-uuid', this.data.uuid);
        this.element.setAttribute('data-slot', `${this.data.col}-${this.data.row}`);
        this.element.setAttribute('draggable', !!this.data.item);
        this.element.classList.toggle('has-item', !!this.data.item);
        if(this.data.item) {
            const itemData = await fromUuid(this.data.item.uuid);
            if(itemData.system?.activation?.type) this.element.dataset.actionType = itemData.system.activation.type.toLowerCase();
            this.element.dataset.itemType = itemData.type;
            if(itemData.type === "spell") {
                this.element.dataset.isPact = itemData.system.preparation?.mode === "pact";
                this.element.dataset.level = itemData.system.level;
            }
            if(itemData.type === 'feat') this.element.dataset.featType = itemData.system.type?.value || 'default';
        }

        return this.element;
    }
}