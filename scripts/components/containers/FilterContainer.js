import { BG3Component } from "../component.js";
import { BG3CONFIG } from "../../utils/config.js";
import { FilterButton } from "../buttons/filterButton.js";

export class FilterContainer extends BG3Component {
    constructor(data) {
        super(data);
        this.components = [];
    }

    get classes() {
        return [...['bg3-filter-subcontainer'], ...(this.checkSpellPoint() ? ["filter-spell-point"] : [])];
    }

    get filterData() {
        const filterData = [
            {
                id: 'action',
                label: 'Action',
                symbol: 'fa-circle',
                class: ['action-type-button'],
                color: BG3CONFIG.COLORS.ACTION
            },
            {
                id: 'bonus',
                label: 'Bonus Action',
                symbol: 'fa-triangle',
                class: ['action-type-button'],
                color: BG3CONFIG.COLORS.BONUS
            },
            {
                id: 'reaction',
                label: 'Reaction',
                symbol: 'fa-sparkle',
                class: ['action-type-button'],
                color: BG3CONFIG.COLORS.REACTION
            },
            {
                id: 'feature',
                label: 'Feature',
                symbol: 'fa-star',
                class: ['action-type-button'],
                color: BG3CONFIG.COLORS.FEATURE_HIGHLIGHT
            }
        ]

        // Add pact magic first if it exists
        const pactMagic = this.actor.system.spells?.pact;
        if (pactMagic?.max > 0) {
            filterData.push({
                id: 'spell',
                isPact: true,
                label: 'Pact Magic',
                short: 'P',
                max: 1,
                value: 1,
                class: ['spell-level-button'],
                color: BG3CONFIG.COLORS.PACT_MAGIC
            });
        }

        // Then add regular spell levels
        for (let level = 1; level <= 9; level++) {
            const spellLevelKey = `spell${level}`;
            const spellLevel = this.actor.system.spells?.[spellLevelKey];
            
            if (spellLevel?.max > 0) {
                filterData.push({
                    id: 'spell',
                    label: 'Spell Level',
                    level: level,
                    value: spellLevel.value,
                    max: spellLevel.max,
                    short: this._getRomanNumeral(level),
                    class: ['spell-level-button'],
                    color: BG3CONFIG.COLORS.SPELL_SLOT
                });
            }
        }

        // Then add cantrip spell
        let cantrips = this.actor.items.filter(i => i.type==="spell" && i.system.level===0)
        if(cantrips.length) {
          filterData.push({
              id: 'spell',
              label: 'Cantrip',
              level: 0,
              max: 1,
              value: 1,
              class: ['spell-level-button'],
              color: BG3CONFIG.COLORS.SPELL_SLOT
          });
        }
        return filterData;
    }

    _getRomanNumeral(num) {
        const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
        return romanNumerals[num - 1] || num.toString();
    }

    resetUsedActions() {
        ui.BG3HOTBAR.element[0].querySelectorAll('.used').forEach(c => {
            c.classList.remove('used');
        });
    }
    checkSpellPoint() {
        return game.modules.get("dnd5e-spellpoints")?.active && this.actor.items.find(i => i.system.identifier == "spell-points");
    }

    async clearFilters(current) {
        for(let i=0; i<this.components.length; i++) if(this.components[i] !== current) this.components[i].setState(true);
    }

    async render() {
        await super.render();
        
        this.components = this.filterData.map((filter) => new FilterButton(filter, this));
        for(const filter of this.components) this.element.appendChild(filter.element);
        await Promise.all(this.components.map((filter) => filter.render()));

        return this.element;
    }
}