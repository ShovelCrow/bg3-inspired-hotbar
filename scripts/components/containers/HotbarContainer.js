import { BG3Component } from "../component.js";
import { ActiveContainer } from "./ActiveContainer.js";
import { ControlContainer } from "./ControlContainer.js";
import { DragBar } from "./DragBar.js";
import { FilterContainer } from "./FilterContainer.js";
import { GridContainer } from "./GridContainer.js";
import { PassiveContainer } from "./PassiveContainer.js";

export class HotbarContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ["bg3-hotbar-container"]
    }

    async _updateCellState(action, type, state) {
        for(let i = 0; i < this.data.length; i++) {
            console.log(this.data[i]);
            const cell = this.data[i];
            switch (action) {
                case 'hightlight':
                    cell.element.toggle()
                    break;            
                default:
                    break;
            }

        }
    }

    async render() {
        const html = await super.render();
        const passiveContainer = new PassiveContainer();
        passiveContainer.render();
        this.element.appendChild(passiveContainer.element);
        const activeContainer = new ActiveContainer();
        activeContainer.render();
        this.element.appendChild(activeContainer.element);
        const filterContainer = new FilterContainer();
        filterContainer._parent = this;
        filterContainer.render();
        this.element.appendChild(filterContainer.element);
        for(let i = 0; i < this.data.length; i++) {
            const gridData = this.data[i],
                container = new GridContainer(gridData);
            this._parent.components.hotbar.push(container);
            container.render();
            this.element.appendChild(container.element);
            this.addComponent(container);
            if(i < this.data.length - 1) {
                const dragBar = new DragBar({index: i});
                dragBar._parent = this;
                dragBar.render();
                this.element.appendChild(dragBar.element);
            }
        }
        const controls = new ControlContainer();
        controls.render();
        this.element.appendChild(controls.element);

        return this.element;
    }
}