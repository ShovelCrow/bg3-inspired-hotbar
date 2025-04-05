import { BG3Component } from "../component.js";
import { CONFIG } from "../../utils/config.js";
import { FilterButton } from "../buttons/filterButton.js";

export class FilterContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ['bg3-filter-subcontainer'];
    }

    get filterData() {
        const filterData = [
            {
                id: 'action',
                label: 'Action',
                symbol: '<i class="fas fa-circle">',
                class: ['action-type-button'],
                color: CONFIG.COLORS.ACTION
            },
            {
                id: 'bonus',
                label: 'Bonus Action',
                symbol: '<i class="fas fa-triangle">',
                class: ['action-type-button'],
                color: CONFIG.COLORS.BONUS
            },
            {
                id: 'reaction',
                label: 'Reaction',
                symbol: '<i class="fas fa-sparkle">',
                class: ['action-type-button'],
                color: CONFIG.COLORS.REACTION
            },
            {
                id: 'feature',
                label: 'Feature',
                symbol: '<i class="fas fa-star">',
                class: ['action-type-button'],
                color: CONFIG.COLORS.FEATURE_HIGHLIGHT
            }
        ]
        return filterData;
    }

    async render() {
        const html = await super.render();
        this.filterData.forEach(async b => {
            const filterBtn = new FilterButton(b);
            await filterBtn.render();
            this.element.appendChild({btn: filterBtn});
        })

        
        return this.element;
    }
}