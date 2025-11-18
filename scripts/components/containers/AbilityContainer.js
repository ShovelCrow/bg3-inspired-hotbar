import { BG3Component } from "../component.js";
import { MenuContainer } from "./MenuContainer.js";

export class AbilityContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ["ability-button"]
    }

    async _registerEvents() {    
        this.element.addEventListener('click', (event) => MenuContainer.toggle(this.getMenuData(), this, event));
        this.element.addEventListener('contextmenu', async (e) => MenuContainer.toggle(this.getMenuData(), this, e));
        this.element.querySelector('.fa-dice-d20').addEventListener('contextmenu', async (event) => {
            this.actor.rollInitiativeDialog({ rerollInitiative: true, createCombatants: true, event });
        });
    }

    get abilities() {
        return CONFIG.DND5E.abilities;
    }

    get skills() {
        return CONFIG.DND5E.skills;
    }

    getAbilityMod(key) {
        const abilityScore = this.actor.system.abilities?.[key] || { mod: 10, proficient: false },
            mod = abilityScore.mod ?? 0,
            modString = mod >= 0 ? `+${mod}` : mod.toString();
        return {
            value: modString,
            style: '' //style: abilityScore.proficient === 1 ?  'color: #3498db' : ''  };
        };
    }

    getSaveMod(key) {
        const abilityScore = this.actor.system.abilities?.[key] || { mod: 10, proficient: false, save: {value: 0} },
            mod = abilityScore.save?.value ?? abilityScore.save ?? 0,
            modString = mod >= 0 ? `+${mod}` : mod.toString();
        const prof = this._proficiencyStyle(abilityScore.proficient);
        return {
            value: modString,
            style: abilityScore.proficient > 0 ?  prof.color : ''
        };
    }
    
    skillRoll(event) {
        event.stopPropagation();
        const parent = event.target.closest('[data-key]');
        try {
            const rollData = {
                event: event,
                ...event.ctrlKey && { disadvantage: event.ctrlKey },
                ...event.advantage && { advantage: event.ctrlKey },
                ...event.shiftKey && { fastForward: event.ctrlKey }
            };
            if(ui.BG3HOTBAR.isDnDPrev4()) {
                this.actor.rollSkill(parent.dataset.key, rollData);
            } else {
                this.actor.rollSkill({
                    skill: parent.dataset.key,
                    ...rollData
                });
            }
        } catch (error) {
            ui.notifications.error(`Error rolling ${parent.dataset.key.toUpperCase()} save. See console for details.`);
        }
    };

    getSkillMod(key) {
        const skills = {};
        let count = 0;
        Object.entries(this.skills).forEach(([k, v]) => {
            if(v.ability !== key) return;
            count++;
            const skill = this.actor.system.skills?.[k] || { proficient: false },
                mod = skill.total ?? 0,
                modStr = mod >= 0 ? `+${mod}` : mod.toString();
            const prof = this._proficiencyStyle(skill.proficient);
            skills[k] = {
                label:  `${v.label}`,
                icon: prof.icon,
                value: modStr,
                style: skill.proficient > 0 ?  prof.color : '',
                click: this.skillRoll.bind(this)
            }
        });
        return count > 0 ? skills : null;
    };

    _proficiencyStyle(prof) {
        let style = '';
        let icon = 'fas fa-dice-d20';
        switch (prof) {
            case 0.5:
                icon = 'fas fa-circle-half-stroke fa-xs';
                break;
            case 1:
                style = 'color: #3498db';
                icon = 'fas fa-circle fa-xs';
                break;
            case 2: 
                style = 'color: #3498db';
                icon = 'fas fa-bullseye fa-xs';
                break;
            default: 
                icon = 'fa-regular fa-circle fa-xs';
                break;
        }
        return { color: style, icon };
    }

    getMenuData() {
        const saveRoll = (event) => {
            event.stopPropagation();
            const parent = event.target.closest('.ability-container');
            try {
                const rollData = {
                    event: event,
                    advantage: event.altKey,
                    disadvantage: event.ctrlKey,
                    fastForward: event.shiftKey
                };
                if(ui.BG3HOTBAR.isDnDPrev4()) {
                    this.actor.rollAbilitySave(
                        parent.dataset.key, rollData
                    )
                } else {
                    this.actor.rollSavingThrow({
                        ability: parent.dataset.key,
                        ...rollData
                    });
                };
                // this.element.querySelectorAll('.bg3-menu-container').forEach(e => e.classList.add('hidden'));
            } catch (error) {
                ui.notifications.error(`Error rolling ${parent.dataset.key.toUpperCase()} save. See console for details.`);
            }
        };

        const checkRoll = (event) => {
            event.stopPropagation();
            const parent = event.target.closest('.ability-container');
            try {
                const rollData = {
                    event: event,
                    advantage: event.altKey,
                    disadvantage: event.ctrlKey,
                    fastForward: event.shiftKey
                };
                if(ui.BG3HOTBAR.isDnDPrev4()) {
                    this.actor.rollAbilityTest(
                        parent.dataset.key, rollData
                    )
                } else {
                    this.actor.rollAbilityCheck({
                        ability: parent.dataset.key,
                        ...rollData
                    });
                };
                // this.element.querySelectorAll('.bg3-menu-container').forEach(e => e.classList.add('hidden'));
            } catch (error) {
                ui.notifications.error(`Error rolling ${parent.dataset.key.toUpperCase()} save. See console for details.`);
            }
        };

        const tooltip = "BG3.Hotbar.Ability.Tooltip";

        return {
            position: 'top',
            event: 'click',
            name: 'baseMenu',
            keepOpen: true,
            closeParent: true,
            buttons: (() => {
                const btns = {};
                for(const abl in this.abilities) {
                    const abilityMod = this.getAbilityMod(abl);
                    btns[abl] = {
                        ...{
                            label: this.abilities[abl].label,
                            class: 'ability-container'
                        },
                        ...abilityMod,
                        subMenu: [
                            {
                                position: 'topright', name: 'saveMenu', event: 'click', 
                                buttons: {
                                    [`check${abl.toUpperCase()}`]: {...{label: 'Check', icon: 'fas fa-dice-d20', click: checkRoll}, ...abilityMod},
                                    [`save${abl.toUpperCase()}`]: {...{label: 'Save', icon: 'fas fa-dice-d20', click: saveRoll}, ...this.getSaveMod(abl)}
                                }
                            },
                            {
                                position: 'topleft', name: 'skillMenu', event: 'click',
                                buttons: this.getSkillMod(abl)
                            }
                        ]
                    }
                };
                return btns;
            })()
        };
    };

    getData() {
        const initMod = this.actor.system.attributes.init.total || 0;
        const initModString = initMod >= 0 ? `+${initMod}` : initMod.toString();
        const binds = {
            adv: game.keybindings.get("dnd5e", "skipDialogAdvantage")[0].key,
            dis: game.keybindings.get("dnd5e", "skipDialogDisadvantage")[0].key
        };
        return { binds: binds, initMod: initModString};
    }
}