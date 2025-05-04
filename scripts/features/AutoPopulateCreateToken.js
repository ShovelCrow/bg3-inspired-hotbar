// Auto Populate Create Token Feature
// Handles populating hotbar when creating unlinked tokens

import { BG3CONFIG, shouldEnforceSpellPreparation } from '../utils/config.js';
import { HotbarManager } from '../managers/HotbarManager.js';
import { AutoSort } from './AutoSort.js';

export class AutoPopulateDefaults extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "bg3-hotbar-auto-populate-defaults",
            title: game.i18n.localize("BG3.Settings.ContainerAutoPopulate.DefaultsTitle"),
            template: `modules/${BG3CONFIG.MODULE_NAME}/templates/dialog/auto-populate-defaults.html`,
            width: 800,
            height: "auto",
            closeOnSubmit: true,
            submitOnClose: false
        });
    }

    getData() {
        // Get current settings for each container
        const containerSettings = {
            container1: game.settings.get(BG3CONFIG.MODULE_NAME, 'container1AutoPopulate'),
            container2: game.settings.get(BG3CONFIG.MODULE_NAME, 'container2AutoPopulate'),
            container3: game.settings.get(BG3CONFIG.MODULE_NAME, 'container3AutoPopulate'),
            allowPassive: game.settings.get(BG3CONFIG.MODULE_NAME, 'noActivityAutoPopulate')
        };

        // Define available choices
        const choices = {
            weapon: game.i18n.localize("BG3.Settings.ContainerAutoPopulate.Weapons"),
            feat: game.i18n.localize("BG3.Settings.ContainerAutoPopulate.Features"),
            spell: game.i18n.localize("BG3.Settings.ContainerAutoPopulate.Spells"),
            consumable: game.i18n.localize("BG3.Settings.ContainerAutoPopulate.Consumables"),
            equipment: game.i18n.localize("BG3.Settings.ContainerAutoPopulate.Equipment"),
            tool: game.i18n.localize("BG3.Settings.ContainerAutoPopulate.Tools"),
            loot: game.i18n.localize("BG3.Settings.ContainerAutoPopulate.Loot")
        };

        // Register the includes helper if it doesn't exist
        if (!Handlebars.helpers.includes) {
            Handlebars.registerHelper('includes', function(array, value) {
                return array?.includes(value) ?? false;
            });
        }

        return {
            containerSettings,
            choices
        };
    }

    async _updateObject(event, formData) {
        try {
            // Update all container settings
            const containers = ['container1', 'container2', 'container3'];
            for (const container of containers) {
                const selectedTypes = Array.from(this.element[0].querySelectorAll(`.container-chips[data-container="${container}"] .chip.active`))
                    .map(chip => chip.dataset.value);
                
                await game.settings.set(BG3CONFIG.MODULE_NAME, `${container}AutoPopulate`, selectedTypes);
            }
            await game.settings.set(BG3CONFIG.MODULE_NAME, `noActivityAutoPopulate`, this.element[0].querySelector("#passive-populate-checkbox").checked);
            ui.notifications.info(game.i18n.localize("BG3.Settings.ContainerAutoPopulate.SaveSuccess"));
        } catch (error) {
            console.error("Error saving container settings:", error);
            ui.notifications.error("Error saving container settings");
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Handle chip clicks
        html.find('.chip').on('click', event => {
            event.preventDefault();
            const chip = event.currentTarget;
            chip.classList.toggle('active');
        });
    }
}

export class AutoPopulateCreateToken {
    static async populateUnlinkedToken(token) {
        if (!token?.actor) return;

        try {
            // Check if user has permission to modify this token
            if (!token.actor.canUserModify(game.user, "update")) {
                console.debug("BG3 Inspired Hotbar | User lacks permission to modify token actor");
                return;
            }

            // Create a temporary hotbar manager for this token
            const tempManager = new HotbarManager();
            tempManager.currentTokenId = token.id;
            await tempManager._loadTokenData();
            
            // Auto-populate combat container if setting on true
            if(!(!tempManager.containers.combat[0]?.items || Object.values(tempManager.containers.combat[0].items).length > 0)) {
                if(game.settings.get(BG3CONFIG.MODULE_NAME, 'autoPopulateCombatContainer') && token.actor.type !== 'vehicle') await this._populateCommonActions(token.actor, tempManager);
            }

            if(token.actor.type !== 'character' && ((!token.actorLink && game.settings.get(BG3CONFIG.MODULE_NAME, 'autoPopulateUnlinkedTokens')) || (token.actorLink && game.settings.get(BG3CONFIG.MODULE_NAME, 'autoPopulateLinkedTokens')))) {
                // Get settings for each container
                const container1Setting = game.settings.get(BG3CONFIG.MODULE_NAME, 'container1AutoPopulate');
                const container2Setting = game.settings.get(BG3CONFIG.MODULE_NAME, 'container2AutoPopulate');
                const container3Setting = game.settings.get(BG3CONFIG.MODULE_NAME, 'container3AutoPopulate');
      
                // Process each weapon & combat containers
                await this._populateWeaponsToken(token.actor, tempManager);
    
                // Process each container
                await this._populateContainerWithSettings(token.actor, tempManager, 0, container1Setting);
                await this._populateContainerWithSettings(token.actor, tempManager, 1, container2Setting);
                await this._populateContainerWithSettings(token.actor, tempManager, 2, container3Setting);
            }

            // Save the changes only if we still have permission
            if (token.actor.canUserModify(game.user, "update")) await tempManager.persist();

        } catch (error) {
            console.error("BG3 Inspired Hotbar | Error auto-populating unlinked token hotbar:", error);
        }
    }

    static async _populateContainerWithSettings(actor, manager, containerIndex, itemTypes) {
        if (!actor?.items || !manager?.containers?.hotbar || !itemTypes?.length) return;
        
        const container = manager.containers.hotbar[containerIndex];
        if (!container) return;

        try {
            // Get all items from the actor that match the selected types
            const itemsWithActivities = [];

            // Process all items from the actor
            for (const item of actor.items) {
                // Skip if item type is not in the selected types
                if (!itemTypes.includes(item.type)
                    || Object.values(manager.containers.combat[0].items).find(d => d.uuid === item.uuid)
                    || manager.containers.weapon.reduce((acc, curr) => acc.concat(Object.values(curr.items)), []).find(i => i.uuid === item.uuid)
                ) continue;
                
                // For spells, check preparation state unless bypassed by setting
                if (item.type === "spell") {
                    const enforcePreparation = shouldEnforceSpellPreparation(actor, manager.currentTokenId);
                        
                    if (enforcePreparation) {
                        const prep = item.system?.preparation;
                        // Skip if it's an unprepared "prepared" spell
                        if (!prep?.prepared && prep?.mode === "prepared") continue;
                        // Include if it's prepared or has a valid casting mode
                        if (!prep?.prepared && !["pact", "apothecary", "atwill", "innate", "ritual", "always"].includes(prep?.mode)) continue;
                    }
                }
                
                // Check if the item has activities or is usable
                const hasActivities = item.system?.activities?.length > 0 ||
                                    (item.system?.activation?.type && item.system?.activation?.type !== "none");
                
                if (hasActivities || game.settings.get(BG3CONFIG.MODULE_NAME, 'noActivityAutoPopulate')) {
                    const itemData = {
                        uuid: item.uuid,
                        // name: item.name,
                        // icon: item.img,
                        // type: item.type,
                        // activation: item.system?.activation?.type || "action",
                        // sortData: {
                        //     spellLevel: item.type === "spell" ? item.system?.level ?? 99 : 99,
                        //     featureType: item.type === "feat" ? item.system?.type?.value ?? "" : "",
                        //     name: item.name
                        // }
                    };

                    itemsWithActivities.push(itemData);
                }
            }
            
            if (itemsWithActivities.length === 0) return;

            // Sort items
            AutoSort._sortItems(itemsWithActivities);

            // Place items in grid format (rows first: left to right, then down)
            let x = 0;
            let y = 0;

            for (const item of itemsWithActivities) {
                if (y >= container.rows) break; // Stop if we exceed container rows

                const gridKey = `${x}-${y}`;
                container.items[gridKey] = item;
                // container.data.items[gridKey] = item;

                // Move right first, then down (rows first)
                x++;
                if (x >= container.cols) {
                    x = 0;
                    y++;
                }
            }
            
        } catch (error) {
            console.error("BG3 Inspired Hotbar | Error auto-populating container:", error);
        }
    }

    static async _populateWeaponsToken(actor, manager) {
      if (!actor?.items || !manager?.containers?.weapon) return;

      try {
        // Process each container
        let weaponsList = actor.items.filter(w => w.type == 'weapon'),
          toUpdate = [];
        if(weaponsList.length) {
          for(let i = 0; i < weaponsList.length; i++) {
            const gridKey = `0-0`,
              item = weaponsList[i];
            if(i < 3) {
              manager.containers.weapon[i].items = {};
              const itemData = {uuid: item.uuid};
              manager.containers.weapon[i].items[gridKey] = itemData;
            }
            if((i === 0 && !item.system.equipped) || (i > 0 && item.system.equipped)) toUpdate.push({_id: item.uuid.split('.').pop(), "system.equipped": (i === 0 ? 1 : 0)})
          }
          actor.updateEmbeddedDocuments("Item", toUpdate);
        }     
      } catch (error) {
          console.error("BG3 Inspired Hotbar | Error auto-populating weapons token hotbar:", error);
      }
    }

    static async _getCombatActionsList(actor) {
        let ids = [];
        if(game.modules.get("chris-premades")?.active && game.packs.get("chris-premades.CPRActions")?.index?.size) {
            for(const id of game.settings.get(BG3CONFIG.MODULE_NAME, 'choosenCPRActions')) {
                // const item = actor.items.getName(game.packs.get("chris-premades.CPRActions").index.get(id).name);
                const item = actor.items.find(i => i.system.identifier === game.packs.get("chris-premades.CPRActions").index.get(id)?.system?.identifier);
                if(item) ids.push(item.uuid);
            }
            // ids = game.settings.get(BG3CONFIG.MODULE_NAME, 'choosenCPRActions').map(id => actor.items.getName(game.packs.get("chris-premades.CPRActions").index.get(id).name).uuid)
        } else ids = await game.packs.get("bg3-inspired-hotbar.bg3-inspired-hud").folders.find(f => f.name === 'Common Actions').contents.map(m => m.uuid);
        return ids;
    }

    static async _populateCommonActions(actor, manager) {
        if(actor.type == 'vehicule') return;
        try {
            const ids = await this._getCombatActionsList(actor);
            let count = 0;
            for(let i = 0; i < 3; i++) {
                for(let j = 0; j < 3; j++) {
                    if(ids[count]) manager.containers.combat[0].items[`${i}-${j}`] = {uuid: ids[count]};
                    count++;
                }
            }
        } catch (error) {
            console.error("BG3 Inspired Hotbar | Error auto-populating common actions token hotbar:", error);
        }
    }
}