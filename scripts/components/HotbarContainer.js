import { BG3Component } from "./component.js";
import { DragBar } from "./DragBar.js";
import { GridContainer } from "./GridContainer.js";

export class HotbarContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ["bg3-hotbar-container"]
    }

    async render() {
        const html = await super.render();
        for(let i = 0; i < this.data.length; i++) {
            const gridData = this.data[i],
                container = new GridContainer(gridData);
            container.render();
            this.element.appendChild(container.element);
            if(i < this.data.length - 1) {
                const dragBar = new DragBar();
                dragBar.render();
                this.element.appendChild(dragBar.element);
            }
        }

        return this.element;
    }
}