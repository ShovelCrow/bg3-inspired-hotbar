import { BG3Component } from "../component.js";
import { GridCell } from "./GridCell.js";

export class GridContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return [...['bg3-hotbar-subcontainer'], ...(this.data?.class ?? [])];
    }

    async render() {
        const html = await super.render();
        this.element.style.setProperty('--cols', this.data.cols);
        this.element.style.setProperty('--rows', this.data.rows);
        for(let r = 0; r < this.data.rows; r++) {
            for(let c = 0; c < this.data.cols; c++) {
                const item = this.data?.items?.[`${c}-${r}`] ?? null,
                    cell = new GridCell({row: r, col: c, item: item});
                cell._parent = this;
                cell.render();
                this.element.appendChild(cell.element);
                this.addComponent(cell);
            }
        }
        return this.element;
    }
}