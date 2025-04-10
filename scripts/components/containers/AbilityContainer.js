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
        return {value: modString, style: abilityScore.proficient === 1 ?  'color: #3498db' : ''  };
    }
    
    skillRoll(event) {
        event.stopPropagation();
        const parent = event.target.closest('[data-key]');
        try {
            this.actor.rollSkill({
                skill: parent.dataset.key,
                event: event,
                advantage: event.altKey,
                disadvantage: event.ctrlKey,
                fastForward: event.shiftKey
            });
            // this.element.querySelectorAll('.bg3-menu-container').forEach(e => e.classList.add('hidden'));
        } catch (error) {
            ui.notifications.error(`Error rolling ${parent.dataset.key.toUpperCase()} save. See console for details.`);
        }
    };

    getSkillMod(keys) {
        const skills = {};
        keys.forEach(k => {
            const skill = this.actor.system.skills?.[k] || { proficient: false },
                mod = skill.total,
                modStr = mod >= 0 ? `+${mod}` : mod.toString();
            skills[k] = {label:  this.getSkillLabel(k), icon: 'fas fa-dice-d20', value: modStr, style: skill.proficient === 1 ?  'color: #3498db' : '', click: this.skillRoll.bind(this)}
        })
        return skills;
    };

    getMenuData() {
        const saveRoll = (event) => {
            event.stopPropagation();
            const parent = event.target.closest('[data-key]');
            try {
                this.actor.rollAbilitySave({
                    ability: parent.dataset.key,
                    event: event,
                    advantage: event.altKey,
                    disadvantage: event.ctrlKey,
                    fastForward: event.shiftKey
                });
                // this.element.querySelectorAll('.bg3-menu-container').forEach(e => e.classList.add('hidden'));
            } catch (error) {
                ui.notifications.error(`Error rolling ${parent.dataset.key.toUpperCase()} save. See console for details.`);
            }
        };

        const checkRoll = (event) => {
            event.stopPropagation();
            const parent = event.target.closest('[data-key]');
            try {
                this.actor.rollAbilityCheck({
                    ability: parent.dataset.key,
                    event: event,
                    advantage: event.altKey,
                    disadvantage: event.ctrlKey,
                    fastForward: event.shiftKey
                });
                // this.element.querySelectorAll('.bg3-menu-container').forEach(e => e.classList.add('hidden'));
            } catch (error) {
                ui.notifications.error(`Error rolling ${parent.dataset.key.toUpperCase()} save. See console for details.`);
            }
        };

        return {
            position: 'top',
            event: 'click',
            name: 'baseMenu',
            keepOpen: true,
            closeParent: true,
            buttons: {
                str: { ...{label: "Strength", skills: this.getSkillMod(["ath"]), tooltip: "Click to show ability checks and saving throws"}, ...this.getAbilityMod('str'),
                subMenu: [
                    {position: 'topright', name: 'saveMenu', event: 'click', buttons: {checkSTR: {...{label: 'Check', icon: 'fas fa-dice-d20', click: checkRoll}, ...this.getAbilityMod('str')}, saveSTR: {...{label: 'Save', icon: 'fas fa-dice-d20', click: saveRoll}, ...this.getAbilityMod('str')}}},
                    {position: 'topleft', name: 'skillMenu', event: 'click', buttons: this.getSkillMod(["ath"])}
                ] },
                dex: { ...{label: "Dexterity", skills: this.getSkillMod(["acr", "slt", "ste"]), tooltip: "Click to show ability checks and saving throws"}, ...this.getAbilityMod('dex'),
                subMenu: [
                    {position: 'topright', name: 'saveMenu', event: 'click', buttons: {checkDEX: {...{label: 'Check', icon: 'fas fa-dice-d20', click: checkRoll}, ...this.getAbilityMod('dex')}, saveDEX: {...{label: 'Save', icon: 'fas fa-dice-d20', click: saveRoll}, ...this.getAbilityMod('dex')}}},
                    {position: 'topleft', name: 'skillMenu', event: 'click', buttons: this.getSkillMod(["acr", "slt", "ste"])}
                ] },
                con: { ...{label: "Constitution", skills: [], tooltip: "Click to show ability checks and saving throws"}, ...this.getAbilityMod('con'),
                subMenu: [
                    {position: 'topright', name: 'saveMenu', event: 'click', buttons: {checkCON: {...{label: 'Check', icon: 'fas fa-dice-d20', click: checkRoll}, ...this.getAbilityMod('con')}, saveCON: {...{label: 'Save', icon: 'fas fa-dice-d20', click: saveRoll}, ...this.getAbilityMod('con')}}},
                    {position: 'topleft', name: 'skillMenu', event: 'click', buttons: null}
                ] },
                int: { ...{label: "Intelligence", skills: this.getSkillMod(["arc", "his", "inv", "nat", "rel"]), tooltip: "Click to show ability checks and saving throws"}, ...this.getAbilityMod('int'),
                subMenu: [
                    {position: 'topright', name: 'saveMenu', event: 'click', buttons: {checkINT: {...{label: 'Check', icon: 'fas fa-dice-d20', click: checkRoll}, ...this.getAbilityMod('int')}, saveINT: {...{label: 'Save', icon: 'fas fa-dice-d20', click: saveRoll}, ...this.getAbilityMod('int')}}},
                    {position: 'topleft', name: 'skillMenu', event: 'click', buttons: this.getSkillMod(["arc", "his", "inv", "nat", "rel"])}
                ] },
                wis: { ...{label: "Wisdom", skills: this.getSkillMod(["ani", "ins", "med", "prc", "sur"]), tooltip: "Click to show ability checks and saving throws"}, ...this.getAbilityMod('wis'),
                subMenu: [
                    {position: 'topright', name: 'saveMenu', event: 'click', buttons: {checkWIS: {...{label: 'Check', icon: 'fas fa-dice-d20', click: checkRoll}, ...this.getAbilityMod('wis')}, saveWIS: {...{label: 'Save', icon: 'fas fa-dice-d20', click: saveRoll}, ...this.getAbilityMod('wis')}}},
                    {position: 'topleft', name: 'skillMenu', event: 'click', buttons: this.getSkillMod(["ani", "ins", "med", "prc", "sur"])}
                ] },
                cha: { ...{label: "Charisma", skills: this.getSkillMod(["dec", "itm", "prf", "per"]), tooltip: "Click to show ability checks and saving throws"}, ...this.getAbilityMod('cha'),
                subMenu: [
                    {position: 'topright', name: 'saveMenu', event: 'click', buttons: {checkCHA: {...{label: 'Check', icon: 'fas fa-dice-d20', click: checkRoll}, ...this.getAbilityMod('cha')}, saveCHA: {...{label: 'Save', icon: 'fas fa-dice-d20', click: saveRoll}, ...this.getAbilityMod('cha')}}},
                    {position: 'topleft', name: 'skillMenu', event: 'click', buttons: this.getSkillMod(["dec", "itm", "prf", "per"])}
                ] }
            }
        };
    };

    // async _renderInner() {
    //     await super._renderInner();
    // }
}