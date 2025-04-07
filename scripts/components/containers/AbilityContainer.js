import { BG3Component } from "../component.js";

export class AbilityContainer extends BG3Component {
    constructor(data) {
        super(data);
        this.isVisible = false;
        this._setupClickOutside();
    }

    get classes() {
        return ["bg3-ability-container"]
    }

    get actor() {
        return ui.BG3HOTBAR.manager.actor;
    }

    getSkillLabel(key) {
        return {
            "ath": "Athletics",
            "acr": "Acrobatics",
            "slt": "Sleight of Hand",
            "ste": "Stealth",
            "arc": "Arcana",
            "his": "History",
            "inv": "Investigation",
            "nat": "Nature",
            "rel": "Religion",
            "ani": "Animal Handling",
            "ins": "Insight",
            "med": "Medicine",
            "prc": "Perception",
            "sur": "Survival",
            "dec": "Deception",
            "itm": "Intimidation",
            "prf": "Performance",
            "per": "Persuasion"
        }[key];
    }

    get abilities() {
        return {
            str: { label: "Strength", mod: this.getAbilityMod('str'), skills: this.getSkillMod(["ath"]) },
            dex: { label: "Dexterity", mod: this.getAbilityMod('dex'), skills: this.getSkillMod(["acr", "slt", "ste"]) },
            con: { label: "Constitution", mod: this.getAbilityMod('con'), skills: [] },
            int: { label: "Intelligence", mod: this.getAbilityMod('int'), skills: this.getSkillMod(["arc", "his", "inv", "nat", "rel"]) },
            wis: { label: "Wisdom", mod: this.getAbilityMod('wis'), skills: this.getSkillMod(["ani", "ins", "med", "prc", "sur"]) },
            cha: { label: "Charisma", mod: this.getAbilityMod('cha'), skills: this.getSkillMod(["dec", "itm", "prf", "per"]) }
        };
    }

    getAbilityMod(key) {
        const abilityScore = this.actor.system.abilities?.[key] || { value: 10, proficient: false },
            mod = abilityScore.save.value,
            modString = mod >= 0 ? `+${mod}` : mod.toString();
        return {value: modString, prof: abilityScore.proficient === 1   };
    }

    getSkillMod(keys) {
        const skills = keys.map(k => {
            const skill = this.actor.system.skills?.[k] || { proficient: false },
                mod = skill.total,
                modStr = mod >= 0 ? `+${mod}` : mod.toString();
            return {key: k, label: this.getSkillLabel(k), value: modStr, prof: skill.proficient === 1   };
        });
        return skills;
    }

    _setupClickOutside() {
        document.addEventListener('click', (e) => {
            if (!this.isVisible) return;
            
            // Check if the click is outside both the ability card and the ability button
            const isClickInsideCard = this.element.contains(e.target);
            const isClickOnButton = this.abilityCard?.contains(e.target);
            
            if (!isClickInsideCard && !isClickOnButton) this._closeAbilityContainer();
        });
    }

    get abilityCard() {
        return this.element.querySelector('.ability-card');
    }

    async getData() {
        return {abilities: this.abilities};
    }

    _toggleAbilityCard() {
        // Toggle the ability card
        this.abilityCard.toggle();
        
        // Update button state
        this.updateButtonState(this.abilityCard.isVisible);

        // If we're hiding the card, ensure all popups are properly closed
        if (!this.abilityCard.isVisible) {
            // Close any open popups
            this.abilityCard.element.querySelectorAll(".popup-container").forEach(popup => {
                popup.classList.remove("visible");
                // Also ensure the popup panels themselves are hidden
                popup.querySelectorAll(".popup-panel").forEach(panel => {
                    panel.classList.remove("visible");
                });
            });
            
            // Reset any expanded abilities
            this.abilityCard.expandedAbility = null;
            
            // Reset any highlighted ability rows
            this.abilityCard.element.querySelectorAll(".ability-row").forEach(row => {
                row.classList.remove("expanded");
            });
        }
    }

    _closeAbilityContainer() {
        this.isVisible = !this.isVisible;
        this.abilityCard.classList.toggle('visible', this.isVisible);
        if(!this.isVisible) {
            this.element.querySelectorAll('.ability-row').forEach(a => a.classList.remove('expanded'));
        }
    }

    async _registerEvents() {
        this.element.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this._closeAbilityContainer();
        });
        $('.ability-row').each((index, abl) => abl.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.element.querySelectorAll('.ability-row').forEach(a => abl !== a && a.classList.remove('expanded'));
            abl.classList.toggle('expanded');
        }));
        $('.save-row').each((index, btn) => btn.addEventListener('click', (event) => {
            event.stopPropagation();
            const parent = btn.closest('[data-ability]');
            try {
                this.actor.rollAbilitySave({
                    ability: parent.dataset.ability,
                    event: event,  // Pass the original event
                    advantage: event.altKey,
                    disadvantage: event.ctrlKey,
                    fastForward: event.shiftKey
                });
            } catch (error) {
                ui.notifications.error(`Error rolling ${parent.dataset.ability.toUpperCase()} save. See console for details.`);
            }
        }));
        $('.check-row').each((index, btn) => btn.addEventListener('click', (event) => {
            event.stopPropagation();
            const parent = btn.closest('[data-ability]');
            try {
                this.actor.rollAbilityCheck({
                    ability: parent.dataset.ability,
                    event: event,  // Pass the original event
                    advantage: event.altKey,
                    disadvantage: event.ctrlKey,
                    fastForward: event.shiftKey
                });
            } catch (error) {
                ui.notifications.error(`Error rolling ${parent.dataset.ability.toUpperCase()} check. See console for details.`);
            }
        }));
    }
}