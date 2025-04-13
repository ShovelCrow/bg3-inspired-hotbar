import { BG3CONFIG } from "../utils/config.js";

export class TooltipManager {
    constructor() {
        this.savedEnrichers = {};
        this._saveEnrichers();
        this._init();
        globalThis.dnd5e.dataModels.ItemDataModel.ITEM_TOOLTIP_TEMPLATE = `modules/${BG3CONFIG.MODULE_NAME}/templates/tooltips/item-tooltip.hbs`;
    }

    _init() {
        if(game.settings.get(BG3CONFIG.MODULE_NAME, 'showDamageRanges')) this._tooltipRangeDamage();
    }

    _saveEnrichers() {
        const stringNames = [
            "attack", "award", "check", "concentration", "damage", "heal", "healing", "item", "save", "skill", "tool"
        ],
        pattern = new RegExp(`\\[\\[/(?<type>${stringNames.join("|")})(?<config> .*?)?]](?!])(?:{(?<label>[^}]+)})?`, "gi");
        this.savedEnrichers.damage = CONFIG.TextEditor.enrichers.find(e => e.pattern.toString() == pattern.toString()).enricher;
    }
    
    _tooltipRangeDamage() {        
        const stringNames = [
            "attack", "award", "check", "concentration", "damage", "heal", "healing", "item", "save", "skill", "tool"
        ],
        pattern = new RegExp(`\\[\\[/(?<type>${stringNames.join("|")})(?<config> .*?)?]](?!])(?:{(?<label>[^}]+)})?`, "gi"),
        damageEnricher = CONFIG.TextEditor.enrichers.find(e => e.pattern.toString() == pattern.toString());
        if(damageEnricher) {
            const prevEnricher = damageEnricher.enricher;
            damageEnricher.id = 'damageEnricher';
            damageEnricher.enricher = async function(match, options) {
                const formatted = await prevEnricher(match, options);
                let { type, config, label } = match.groups;
                if(['damage', 'heal', 'healing'].includes(type)) {
                    const rollLink = formatted.querySelector('.roll-link');
                    if(rollLink) {
                        const dataFormulas = formatted.dataset.formulas;
                        if(dataFormulas) {
                            const minRoll = Roll.create(dataFormulas).evaluate({ minimize: true }),
                                maxRoll = Roll.create(dataFormulas).evaluate({ maximize: true }),
                                textContent = `${Math.floor((await minRoll).total)}-${Math.ceil((await maxRoll).total)}`;
                            rollLink.innerHTML = rollLink.innerHTML.replace(dataFormulas, textContent)
                        }
                    }
                }
                return formatted;
            }
        }
    }

    _resetEnrichers(enrichers) {
        for(const enricher of enrichers) {
            if(this.savedEnrichers[enricher]) {
                const enr = CONFIG.TextEditor.enrichers.find(e => e.id == `${enricher}Enricher`);
                if(enr) enr.enricher = this.savedEnrichers[enricher];
            }
        }
    }
}