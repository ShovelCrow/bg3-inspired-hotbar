import { BG3Component } from "../component.js";

export class FilterContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ['bg3-filter-subcontainer'];
    }

    get filterDate() {
        return [
            {
                type: 'div',
                class: ['action-type-button'],
                title: `<div class="custom-tooltip"><h4 style="--data-color:#2ecc71"><i class="fas fa-circle" style="border-radius: 0;"></i>Action<i class="fas fa-circle" style="border-radius: 0;"></i></h4><p class="notes"><i>Left Click to highlight items using this resource.</i></p><p class="notes"><i>Right Click to grey out.</i></p></div>`,
                
            }
        ]
    }

    async render() {
        const html = await super.render();
        
        return this.element;
    }
}