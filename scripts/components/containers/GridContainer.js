import { BG3Component } from "../component.js";
import { GridCell } from "./GridCell.js";

export class GridContainer extends BG3Component {
    constructor(data) {
        super(data);
        this.element.style.setProperty('--cols', data.cols);
        this.element.style.setProperty('--rows', data.rows);
    }

    get classes() {
        return [...['bg3-hotbar-subcontainer'], ...(this.data?.class ?? [])];
    }

    async render() {
        const html = await super.render();
        for(let r = 0; r < this.data.rows; r++) {
            for(let c = 0; c < this.data.cols; c++) {
                const cell = new GridCell({row: r, col: c});
                cell.render();
                this.element.appendChild(cell.element);
                this.addComponent(cell);
            }
        }
        return this.element;
    }
}