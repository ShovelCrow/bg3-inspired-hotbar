// Auto Populate Create Token Feature
// Handles populating hotbar when creating unlinked tokens

import { CONFIG, isTokenLinked, shouldEnforceSpellPreparation } from '../utils/config.js';
import { HotbarManager } from '../managers/HotbarManager.js';
import { HotbarUI } from '../components/HotbarUI.js';
import { AutoPopulateContainer } from './AutoPopulateContainer.js';
import { AutoSort } from './AutoSort.js';
import { BG3Hotbar } from '../bg3-hotbar.js';

export class AutoPopulateDefaults extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "bg3-hotbar-auto-populate-defaults",
            title: game.i18n.localize("BG3.Settings.ContainerAutoPopulate.DefaultsTitle"),
            template: "modules/bg3-inspired-hotbar/templates/auto-populate-defaults.html",
            width: 800,
            height: "auto",
            closeOnSubmit: true,
            submitOnClose: false
        });
    }

    getData() {
        // Get current settings for each container
        const containerSettings = {
            container1: game.settings.get(CONFIG.MODULE_NAME, 'container1AutoPopulate'),
            container2: game.settings.get(CONFIG.MODULE_NAME, 'container2AutoPopulate'),
            container3: game.settings.get(CONFIG.MODULE_NAME, 'container3AutoPopulate'),
            allowPassive: game.settings.get(CONFIG.MODULE_NAME, 'noActivityAutoPopulate')
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
                
                await game.settings.set(CONFIG.MODULE_NAME, `${container}AutoPopulate`, selectedTypes);
            }
            await game.settings.set(CONFIG.MODULE_NAME, `noActivityAutoPopulate`, this.element[0].querySelector("#passive-populate-checkbox").checked);
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

            if(!tempManager.combatContainer[0]?.items || Object.values(tempManager.combatContainer[0].items).length > 0) return;
            
            // Auto-populate combat container if setting on true
            if(game.settings.get(CONFIG.MODULE_NAME, 'autoPopulateCombatContainer') && token.actor.type !== 'vehicle') await this._populateCommonActions(token.actor, tempManager);

            if(token.actor.type !== 'character' && ((!token.actorLink && game.settings.get(CONFIG.MODULE_NAME, 'autoPopulateUnlinkedTokens')) || (token.actorLink && game.settings.get(CONFIG.MODULE_NAME, 'autoPopulateLinkedTokens')))) {
                // Get settings for each container
                const container1Setting = game.settings.get(CONFIG.MODULE_NAME, 'container1AutoPopulate');
                const container2Setting = game.settings.get(CONFIG.MODULE_NAME, 'container2AutoPopulate');
                const container3Setting = game.settings.get(CONFIG.MODULE_NAME, 'container3AutoPopulate');
    
                // Initialize weapons containers with correct structure
                tempManager.weaponsContainers = [];
                for (let i = 0; i < 3; i++) {
                    tempManager.weaponsContainers[i] = {
                        id: 'weapon-container',
                        index: i,
                        cols: 2,
                        rows: 1,
                        items: {},
                        type: 'label',
                        for: 'weapon-set',
                        // size: 1.5,
                        delOnly: true,
                        allowDuplicate: true,
                        data: {
                            id: 'weapon-container',
                            index: i,
                            cols: 2,
                            rows: 1,
                            items: {},
                            type: 'label',
                            for: 'weapon-set',
                            // size: 1.5,
                            delOnly: true,
                            allowDuplicate: true
                        }
                    };
                }
      
                // Process each weapon & combat containers
                await this._populateWeaponsToken(token.actor, tempManager);
    
                // Initialize containers with correct structure
                tempManager.containers = [];
                for (let i = 0; i < 3; i++) {
                    tempManager.containers[i] = {
                        index: i,
                        cols: 5,
                        rows: 3,
                        items: {},
                        data: {
                            index: i,
                            cols: 5,
                            rows: 3,
                            items: {}
                        }
                    };
                }
    
                // Process each container
                await this._populateContainerWithSettings(token.actor, tempManager, 0, container1Setting);
                await this._populateContainerWithSettings(token.actor, tempManager, 1, container2Setting);
                await this._populateContainerWithSettings(token.actor, tempManager, 2, container3Setting);
            }

            // Save the changes only if we still have permission
            if (token.actor.canUserModify(game.user, "update")) {
                await tempManager.persist();
            }

        } catch (error) {
            console.error("BG3 Inspired Hotbar | Error auto-populating unlinked token hotbar:", error);
        }
    }

    static async _populateContainerWithSettings(actor, manager, containerIndex, itemTypes) {
        if (!actor?.items || !manager?.containers || !itemTypes?.length) return;

        const container = manager.containers[containerIndex];
        if (!container) return;

        try {
            // Get all items from the actor that match the selected types
            const itemsWithActivities = [];
            
            // Process all items from the actor
            for (const item of actor.items) {
                // Skip if item type is not in the selected types
                if (!itemTypes.includes(item.type) || Object.values(CONFIG.COMBATACTIONDATA).find(d => d.name === item.name)) continue;
                // Skip if item already in weapons containers
                let isInSet = false;
                for(let i = 0; i < manager.weaponsContainers.length; i++) {
                    if(Object.values(manager.weaponsContainers[i].items).find(w => w.uuid === item.uuid)) isInSet = true;
                }
                if(isInSet) continue;
                
                // For spells, check preparation state unless bypassed by setting
                if (item.type === "spell") {
                    const enforcePreparation = shouldEnforceSpellPreparation(actor, manager.currentTokenId);
                        
                    if (enforcePreparation) {
                        const prep = item.system?.preparation;
                        // Skip if it's an unprepared "prepared" spell
                        if (!prep?.prepared && prep?.mode === "prepared") continue;
                        // Include if it's prepared or has a valid casting mode
                        if (!prep?.prepared && !["pact", "atwill", "innate", "ritual", "always"].includes(prep?.mode)) continue;
                    }
                }
                
                // Check if the item has activities or is usable
                const hasActivities = item.system?.activities?.length > 0 ||
                                    (item.system?.activation?.type && item.system?.activation?.type !== "none");
                
                if (hasActivities || game.settings.get(CONFIG.MODULE_NAME, 'noActivityAutoPopulate')) {
                    const itemData = {
                        uuid: item.uuid,
                        name: item.name,
                        icon: item.img,
                        type: item.type,
                        activation: item.system?.activation?.type || "action",
                        sortData: {
                            spellLevel: item.type === "spell" ? item.system?.level ?? 99 : 99,
                            featureType: item.type === "feat" ? item.system?.type?.value ?? "" : "",
                            name: item.name
                        }
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

            container.items = {};
            container.data.items = {};

            for (const item of itemsWithActivities) {
                if (y >= container.rows) break; // Stop if we exceed container rows

                const gridKey = `${x}-${y}`;
                container.items[gridKey] = item;
                container.data.items[gridKey] = item;

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
      if (!actor?.items || !manager?.weaponsContainers) return;

      try {
        // Process each container
        let weaponsList = actor.items.filter(w => w.type == 'weapon'),
          toUpdate = [];
        if(weaponsList.length) {
          for(let i = 0; i < weaponsList.length; i++) {
            const gridKey = `0-0`,
              item = weaponsList[i];
            if(i < 3) {
              manager.weaponsContainers[i].items = {};
              manager.weaponsContainers[i].data.items = {};
              const itemData = {
                  uuid: item.uuid,
                  name: item.name,
                  icon: item.img,
                  type: item.type,
                  activation: item.system?.activation?.type || "passive",
                  sortData: {
                      spellLevel: item.type === "spell" ? item.system?.level ?? 99 : 99,
                      featureType: item.type === "feat" ? item.system?.type?.value ?? "" : "",
                      name: item.name
                }
              };
              manager.weaponsContainers[i].items[gridKey] = itemData;
              manager.weaponsContainers[i].data.items[gridKey] = itemData;
            }
            if((i === 0 && !item.system.equipped) || (i > 0 && item.system.equipped)) toUpdate.push({_id: item.uuid.split('.').pop(), "system.equipped": (i === 0 ? 1 : 0)})
          }
          actor.updateEmbeddedDocuments("Item", toUpdate);
        }    
        // await AutoPopulateCreateToken._removeOtherItems()        
      } catch (error) {
          console.error("BG3 Inspired Hotbar | Error auto-populating weapons token hotbar:", error);
      }
    }

    static async _populateCommonActions(actor, manager) {
        if(actor.type == 'vehicule') return;
        try {
            const tmpArray = [],
                actionsClone = foundry.utils.deepClone(CONFIG.COMBATACTIONDATA)
            Object.entries(actionsClone).forEach(([key, value]) => {
              const hasItem = actor.items.find(item => item.type == 'feat' && item.name == value.name)
              if(hasItem) value.uuid = hasItem.uuid;
              else {
                let tmpItem = BG3Hotbar.combatActionsArray.find(it => it.name == value.name);
                if(tmpItem) tmpArray.push(tmpItem);
              }
            })
            if(tmpArray.length) {
              let tmpDoc = await actor.createEmbeddedDocuments('Item', tmpArray);
              tmpDoc.forEach(doc => Object.values(actionsClone).find(value => value.name == doc.name).uuid = doc.uuid)
            }
            manager.combatContainer[0].items = actionsClone;
            if(!manager.combatContainer[0].data) manager.combatContainer[0].data = {};
            manager.combatContainer[0].data.items = actionsClone;
        } catch (error) {
            console.error("BG3 Inspired Hotbar | Error auto-populating common actions token hotbar:", error);
        }
    }
}