// BG3 Inspired Hotbar Module - Main Entry Point

import { HotbarManager } from './managers/HotbarManager.js';
import { HotbarUI } from './components/HotbarUI.js';
import { CONFIG } from './utils/config.js';
import { ControlsManager } from './managers/ControlsManager.js';
import { AutoPopulateCreateToken, AutoPopulateDefaults } from './features/AutoPopulateCreateToken.js';
import { AutoPopulateContainer } from './features/AutoPopulateContainer.js';
import { ExtraInfosDialog, PortraitSettingDialog } from './features/ExtraInfosDialog.js';

export class BG3Hotbar extends Application {
    constructor() {
        super();

        this._manager = null;
        this._controlsManager = null;
        this._combatActionsArray = [];
        this._macroBarTimeout = null;

        /** Hooks Event **/
        Hooks.on("createToken", this._onCreateToken.bind(this));
        Hooks.on("controlToken", this._onControlToken.bind(this));
        Hooks.on("deleteToken", this._onDeleteToken.bind(this));
        Hooks.on("updateToken", this._onUpdateToken.bind(this));
        Hooks.on("updateActor", this._onUpdateActor.bind(this));
        Hooks.on("deleteScene", this._onDeleteScene.bind(this));
        Hooks.on("updateCombat", this._onUpdateCombat.bind(this));
        Hooks.on("deleteCombat", this._onDeleteCombat.bind(this));
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            id: CONFIG.MODULE_NAME,
            template: `modules/${CONFIG.MODULE_NAME}/templates/bg3-hud.hbs`,
            popOut: false,
            dragDrop: [{ dragSelector: null, dropSelector: null }],
        };
    }

    async getData(data) {
        return {};
    }

    _onCreateToken(token) {

    }

    _onControlToken(token, controlled) {
        if (!this.manager) return;

        if ((!controlled && !canvas.tokens.controlled.length) || canvas.tokens.controlled.length > 1) {
            setTimeout(() => {
                if (!canvas.tokens.controlled.length || canvas.tokens.controlled.length > 1) this.generate(null);
            }, 100);
        }
        if (!controlled) return;

        this.generate(token);
    }

    _onDeleteToken(scene, tokenData) {

    }

    _onUpdateToken(token, changes, options, userId) {

    }

    _onUpdateActor(actor, changes, options, userId) {

    }

    _onDeleteScene(scene) {

    }

    _onUpdateCombat(combat, changed, options, userId) {

    }

    _onDeleteCombat(combat) {

    }

    async generate(token) {
        if(!token) {
            this.manager = null;
            return this.close();
        }

        this.render(true);
    }

    async _renderInner(data) {
        
        const element = await super._renderInner(data);
        
        return element;
    }

    refresh() {
        if (this.rendered) this.render(true);
    }










    static async init() {
        // Apply custom theme
        this._applyTheme();

        // Ensure we clean up any existing manager/UI
        if (this.manager?.ui) {
            this.manager.ui.destroy();
            this.manager.ui = null;
        }
        
        // Initialize the controls manager
        this.controlsManager = new ControlsManager();
        
        // Initialize the hotbar manager
        this.manager = new HotbarManager();
        
        // Register hooks
        this._registerHooks();
        
        // Apply macrobar collapse setting immediately if it's enabled
        this._applyMacrobarCollapseSetting();

        // Log initialization
        console.log(`${CONFIG.MODULE_NAME} | Initialized`);

        // If a token is already selected, deselect it and let the hooks handle reselection
        const controlled = canvas.tokens?.controlled[0];
        if (controlled) {
            controlled.release(); // This will trigger our controlToken hook properly
        }

        // Retrieve Common Combat Actions based
        this.loadCombatActions();
    }

    static _applyTheme() {
      const theme = game.settings.get(CONFIG.MODULE_NAME, 'themeOption');
      if(theme !== 'default') {
        const themeConfig = CONFIG.THEME[theme];
        if(themeConfig) {
            const style = document.createElement('style');
            style.setAttribute('type', 'text/css');
            style.setAttribute('custom-theme', theme)
            style.textContent = Object.entries(themeConfig).map(([k, v]) => `${k} {\n${Object.entries(v).map(([k2, v2]) => `${k2}:${v2};`).join('\n')}\n}`).join('\n');
            document.head.appendChild(style);
        }
      } else if(document.head.querySelector('[custom-theme]')) {
        const currentTheme = document.head.querySelector('[custom-theme]');
        currentTheme.parentNode.removeChild(currentTheme);
      }
      console.log()
    }
    
    static _applyMacrobarCollapseSetting() {
        // We need to wait for the UI to be ready before collapsing the hotbar
        if (!ui.hotbar) {
            // UI not ready, deferring macrobar collapse
            Hooks.once('renderHotbar', () => this._applyMacrobarCollapseSetting());
            return;
        }
        
        const collapseMacrobar = game.settings.get(CONFIG.MODULE_NAME, 'collapseFoundryMacrobar');
        if(collapseMacrobar !== 'full' && document.querySelector("#hotbar").style.display != 'flex') document.querySelector("#hotbar").style.display = 'flex';
        // Applying macrobar collapse setting
        if (collapseMacrobar === 'always' || collapseMacrobar === 'true') {
            ui.hotbar.collapse();
        } else if (collapseMacrobar === 'never' || collapseMacrobar === 'false') {
            ui.hotbar.expand();
        } else if(collapseMacrobar === 'select') {
            if(this.macroBarTimeout) clearTimeout(this.macroBarTimeout);
            if(!!this.manager.ui) {
                ui.hotbar.collapse();
            } else {
                this.macroBarTimeout = setTimeout(() => {
                    ui.hotbar.expand();
                }, 100);
            }
        } else if(collapseMacrobar === 'full' && document.querySelector("#hotbar").style.display != 'none') document.querySelector("#hotbar").style.display = 'none';
    }

    static async _toggleUI() {
        const currentState = game.settings.get(CONFIG.MODULE_NAME, 'uiEnabled');
        await game.settings.set(CONFIG.MODULE_NAME, 'uiEnabled', !currentState);
        
        // Update scene controls button state
        const tokenTools = ui.controls.controls.find(c => c.name === "token");
        const toggleButton = tokenTools?.tools.find(t => t.name === "toggleBG3UI");
        if (toggleButton) {
            toggleButton.active = !currentState;
            ui.controls.render();
        }
        
        // Handle UI state
        if (!currentState) {
            // Enabling UI
            if (!this.manager) {
                await this.init();
            } else if (this.manager && !this.manager.ui) {
                const controlled = canvas.tokens?.controlled[0];
                
                // Check if we have a controlled token
                if (controlled) {
                    await this.manager.updateHotbarForControlledToken(controlled, true);
                } else {
                    // No token selected, but check if deselect lock is enabled
                    const isDeselectLocked = this.controlsManager.isLockSettingEnabled('deselect') && 
                                            this.controlsManager.isMasterLockEnabled();
                    
                    // If deselect lock is enabled and we have a currentTokenId, try to restore UI
                    if (isDeselectLocked && this.manager.currentTokenId) {
                        // Force create the UI even with no token selected
                        this.manager.ui = new HotbarUI(this.manager);
                        console.log(`${CONFIG.MODULE_NAME} | Restored UI with deselect lock enabled`);
                    }
                }
            }
        } else {
            // Disabling UI
            if (this.manager?.ui) {
                this.manager.ui.destroy();
                this.manager.ui = null;
            }
        }
    }

    static async _autoPopulateTokenHotbar(token) {
        if (!token?.actor) return;

        try {
            // Get settings for each container
            const container1Setting = game.settings.get(CONFIG.MODULE_NAME, 'container1AutoPopulate');
            const container2Setting = game.settings.get(CONFIG.MODULE_NAME, 'container2AutoPopulate');
            const container3Setting = game.settings.get(CONFIG.MODULE_NAME, 'container3AutoPopulate');

            // Create a temporary hotbar manager for this token if it's not the current one
            let tempManager = null;
            let useCurrentManager = false;

            if (this.manager && this.manager.currentTokenId === token.id) {
                useCurrentManager = true;
            } else {
                tempManager = new HotbarManager();
                tempManager.currentTokenId = token.id;
                await tempManager._loadTokenData();
            }

            const manager = useCurrentManager ? this.manager : tempManager;

            // Process each container
            await AutoPopulateCreateToken._populateContainerWithSettings(token.actor, manager, 0, container1Setting);
            await AutoPopulateCreateToken._populateContainerWithSettings(token.actor, manager, 1, container2Setting);
            await AutoPopulateCreateToken._populateContainerWithSettings(token.actor, manager, 2, container3Setting);

            // Save the changes
            if (manager) {
                await manager.persist();
            }

            // Clean up temporary manager
            if (tempManager) {
                tempManager = null;
            }

            ui.notifications.info(`Auto-populated hotbar for token: ${token.name}`);
        } catch (error) {
            console.error("BG3 Inspired Hotbar | Error auto-populating token hotbar:", error);
            ui.notifications.error(`Error auto-populating token hotbar: ${error.message}`);
        }
    }

    static async _populateContainer(actor, manager, containerIndex, settingValue) {
        const container = manager.containers[containerIndex];
        if (!container) return;

        await AutoPopulateContainer.populateContainer(actor, container, settingValue);
    }

    static async _populateRemainingItems(actor, manager, containerIndex, items) {
        const container = manager.containers[containerIndex];
        if (!container) return;

        await AutoPopulateContainer.populateContainer(actor, container, items.map(item => item.type));
    }

    static _registerMacroDragDrop() {
        // Add drag drop capability for macros
        if (!game.macros.directory?.dragDrop) return;

        game.macros.directory.dragDrop.push({
            dragSelector: ".macro",
            dropSelector: ".hotbar-cell",
            permissions: {
                dragstart: () => true,
                drop: () => true
            },
            callbacks: {
                dragstart: (event) => {
                    const macro = game.macros.get(event.currentTarget.dataset.documentId);
                    if (!macro) {
                        console.warn("Could not find macro from element:", event.currentTarget);
                        return;
                    }
                    event.dataTransfer.setData("text/plain", JSON.stringify({
                        type: "Macro",
                        uuid: macro.uuid,
                        id: macro.id,
                        data: {
                            name: macro.name,
                            img: macro.img
                        }
                    }));
                },
                drop: (event) => {
                    try {
                        const data = JSON.parse(event.dataTransfer.getData("text/plain"));
                        return data.type === "Macro" && (data.uuid?.startsWith("Macro.") || game.macros.has(data.id));
                    } catch {
                        return false;
                    }
                }
            }
        });
    }

    static async _onStartCombat(combat) {
      // Token was selected, update or create UI
      if (!this.manager.ui) {
          // UI doesn't exist but should (UI is enabled and token selected)
          await this.manager.updateHotbarForControlledToken(canvas.tokens.controlled[0], true);
      } else {
          // UI exists, just update it
          await this.manager.updateHotbarForControlledToken(canvas.tokens.controlled[0]);
      }
      BG3Hotbar.manager.ui?.toggleUI();
    }

    static async _onUpdateCombat(combat, updates) {
        this.manager?.ui?.combat?.forEach((component) => component.updateVisibility());
        if (combat === true || (updates && ("round" in updates || "turn" in updates))) BG3Hotbar.manager.ui?.toggleUI();
        if (updates && updates.round === 1 && updates.turn === 0) this._onStartCombat(combat);
    }

    static async loadCombatActions() {
        if (!game.modules.get("chris-premades")?.active) return;
        let pack = game.packs.get("chris-premades.CPRActions"),
            promises = [];
        Object.entries(CONFIG.COMBATACTIONDATA).forEach(([key, value]) => {
            let macroID = pack.index.find(t =>  t.type == 'feat' && t.name === value.name)._id;
            if(macroID) {
                promises.push(new Promise(async (resolve, reject) => {
                    let item = await pack.getDocument(macroID);
                    if(item) this.combatActionsArray.push(item)
                    resolve();
                }))
            }
        })
        await Promise.all(promises).then((values) => {})
    }
}

/* // Initialize the module when Foundry is ready
Hooks.once('ready', async () => {
    // Wait for canvas and UI to be ready
    if (!canvas || !canvas.ready) {
        Hooks.once('canvasReady', () => BG3Hotbar.init());
        return;
    }
    await BG3Hotbar.init();
}); */

