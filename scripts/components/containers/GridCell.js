import { BG3Component } from "../component.js";

export class GridCell extends BG3Component {
    constructor(data) {
        super(data);
        this.element.setAttribute('data-slot', `${data.col}-${data.row}`);
        this.element.setAttribute('draggable', false);
    }

    get classes() {
        return ['hotbar-cell', 'drag-cursor'];
    }

    async getData() {
        return {...super.getData(), ...this.data};
    }
}