import { CONFIG } from "../../utils/config.js";
import { BG3Component } from "../component.js";
import { GridContainer } from "./GridContainer.js";

export class WeaponContainer extends BG3Component {
    constructor(data) {
        super(data);
        this.components = {
            combat: [],
            weapon: []
        }
    }

    get classes() {
        return ["bg3-weapon-container"]
    }

    get activeSet() {
        return ui.BG3HOTBAR.manager.actor.getFlag(CONFIG.MODULE_NAME, 'activeSet') ?? 0;
    }

    set activeSet(index) {
        // this.activeSet = index;
        ui.BG3HOTBAR.manager.actor.setFlag(CONFIG.MODULE_NAME, 'activeSet', index);
        this.element.setAttribute('data-active-set', index);
    }

    async switchSet(c) {
        if(c.index === this.activeSet && c.oldWeapons === c.data.items) return;

        const actor = ui.BG3HOTBAR.manager.actor,
            weaponsList = actor.items.filter(w => w.type == 'weapon'),
            toUpdate = [];
        if(this.activeSet !== c.index) {
            // Add previous set to unequip
            Object.values(this.components.weapon[this.activeSet].data.items).forEach(w => {
              toUpdate.push({_id: w.uuid.split('.').pop(), "system.equipped": 0});
            });
      
            // Save new active set
            this.activeSet = c.index;
            await ui.BG3HOTBAR.manager.persist();
        } else if(c.oldWeapons && c.oldWeapons !== c.data.items) {
            Object.values(c.oldWeapons).forEach(w => {
              toUpdate.push({_id: w.uuid.split('.').pop(), "system.equipped": 0});
            });
        }
        c.oldWeapons = foundry.utils.deepClone(c.data.items);
        if(Object.values(c.data.items).length) {
          Object.values(c.data.items).forEach(w => {
            const itemId =  w.uuid.split('.').pop(),
              commonItem = toUpdate.findIndex(wu => wu._id == itemId);
            if(commonItem > -1) toUpdate[commonItem]["system.equipped"] = 1;
            else toUpdate.push({_id: itemId, "system.equipped": 1})
          })
        }
        weaponsList.forEach(w => {
            if(w.system.equipped) {
                const itemIndex = toUpdate.findIndex(wu => wu._id == w.id);
                if(itemIndex === -1) toUpdate.push({_id: w.id, "system.equipped": 0});
                else toUpdate.splice(itemIndex, 1);
            }
            // if(w.system.equipped && !toUpdate.find(wu => wu._id == w.id)) toUpdate.push({_id: w.id, "system.equipped": 0})
        })
        if(toUpdate.length) await actor.updateEmbeddedDocuments("Item", toUpdate);
    }

    async render() {
        await super.render();
        this.components.weapon.forEach(c => {
            c.element.addEventListener('click', async (e) => this.switchSet(c));
        });
        this.switchSet(this.components.weapon[this.activeSet]);
        return this.element;
    }

    async _renderInner() {
        await super._renderInner();
        // Combat Container
        const combatContainer = new GridContainer(this.data.combat[0]);
        combatContainer.locked = game.settings.get(CONFIG.MODULE_NAME, 'lockCombatContainer');
        this.components = {
            combat: [],
            weapon: []
        };
        combatContainer.id = 'combat';
        this.element.setAttribute('data-active-set', this.activeSet);
        await combatContainer.render();
        combatContainer.element.classList.toggle('hidden', !game.settings.get(CONFIG.MODULE_NAME, 'showCombatContainer'));
        this.components.combat.push(combatContainer);
        // Weapons Containers
        for(let i = 0; i < this.data.weapon.length; i++) {
            const gridData = this.data.weapon[i],
                container = new GridContainer(gridData);
            container.index = i;
            container.id = 'weapon';
            container.element.setAttribute('data-container-index', i);
            container._parent = this;
            container.render();
            this.element.appendChild(container.element);
            this.components.weapon.push(container);
        }
        this.element.appendChild(combatContainer.element);
    }
}