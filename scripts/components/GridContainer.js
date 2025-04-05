import { BG3Component } from "./component.js";
import { GridCell } from "./GridCell.js";

export class GridContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ['bg3-hotbar-subcontainer'];
    }

    async render() {
        const html = await super.render();
        console.log('GridCell', this.data);
        for(let r = 0; r < this.data.rows; r++) {
            for(let c = 0; c < this.data.cols; c++) {
                const cell = new GridCell({row: r, col: c});
                cell.render();
                this.element.appendChild(cell.element);
            }
        }
        return this.element;
    }
}