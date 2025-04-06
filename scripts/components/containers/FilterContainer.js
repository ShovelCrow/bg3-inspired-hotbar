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
                symbol: 'fa-circle',
                class: ['action-type-button'],
                color: CONFIG.COLORS.ACTION
            },
            {
                id: 'bonus',
                label: 'Bonus Action',
                symbol: 'fa-triangle',
                class: ['action-type-button'],
                color: CONFIG.COLORS.BONUS
            },
            {
                id: 'reaction',
                label: 'Reaction',
                symbol: 'fa-sparkle',
                class: ['action-type-button'],
                color: CONFIG.COLORS.REACTION
            },
            {
                id: 'feature',
                label: 'Feature',
                symbol: 'fa-star',
                class: ['action-type-button'],
                color: CONFIG.COLORS.FEATURE_HIGHLIGHT
            }
        ]

        // Add pact magic first if it exists
        const pactMagic = ui.BG3HOTBAR.manager.actor.system.spells?.pact;
        if (pactMagic?.max > 0) {
            filterData.push({
                id: 'spell',
                isPact: true,
                label: 'Pact Magic',
                short: 'P',
                max: 1,
                value: 1,
                class: ['spell-level-button'],
                color: CONFIG.COLORS.PACT_MAGIC
            });
        }

        // Then add regular spell levels
        for (let level = 1; level <= 9; level++) {
            const spellLevelKey = `spell${level}`;
            const spellLevel = ui.BG3HOTBAR.manager.actor.system.spells?.[spellLevelKey];
            
            if (spellLevel?.max > 0) {
                filterData.push({
                    id: 'spell',
                    label: 'Spell Level',
                    level: level,
                    value: spellLevel.value,
                    max: spellLevel.max,
                    short: this._getRomanNumeral(level),
                    class: ['spell-level-button'],
                    color: CONFIG.COLORS.SPELL_SLOT
                });
            }
        }

        // Then add cantrip spell
        let cantrips = ui.BG3HOTBAR.manager.actor.items.filter(i => i.type==="spell" && i.system.level===0)
        if(cantrips.length) {
          filterData.push({
              id: 'spell',
              label: 'Cantrip',
              level: 0,
              max: 1,
              value: 1,
              class: ['spell-level-button'],
              color: CONFIG.COLORS.SPELL_SLOT
          });
        }
        return filterData;
    }

    _getRomanNumeral(num) {
        const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
        return romanNumerals[num - 1] || num.toString();
    }

    async render() {
        const html = await super.render();
        this.filterData.forEach(async b => {
            const filterBtn = new FilterButton(b);
            await filterBtn.render();
            this.element.appendChild(filterBtn.element);
        })

        
        return this.element;
    }
}