// BG3 Inspired Hotbar Module - Main Entry Point

import { HotbarContainer } from './components/containers/HotbarContainer.js';
import { PortraitContainer } from './components/containers/PortraitContainer.js';
import { RestTurnContainer } from './components/containers/RestTurnContainer.js';
import { WeaponContainer } from './components/containers/WeaponContainer.js';
import { DragDropManager } from './managers/DragDropManager.js';
import { HotbarManager } from './managers/HotbarManager.js';
import { CONFIG } from './utils/config.js';

export class BG3Hotbar extends Application {
    constructor() {
        super();

        this._manager = null;
        this.dragDropManager = null;
        this.combat = [];
        this.components = {
            hotbar: []
        };
        this.macroBarTimeout = null;
        // this.enabled = game.settings.get(CONFIG.MODULE_NAME, 'uiEnabled');

        /** Hooks Event **/
        Hooks.on("createToken", this._onCreateToken.bind(this));
        Hooks.on("controlToken", this._onControlToken.bind(this));
        // Hooks.on("deleteToken", this._onDeleteToken.bind(this));
        Hooks.on("updateToken", this._onUpdateToken.bind(this));
        Hooks.on("updateActor", this._onUpdateActor.bind(this));
        // Hooks.on("deleteScene", this._onDeleteScene.bind(this));
        Hooks.on("updateCombat", this._onUpdateCombat.bind(this));
        Hooks.on("deleteCombat", this._onDeleteCombat.bind(this));

        this._init();
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

    async _init() {

        this._applyTheme();

        // Initialize the hotbar manager
        this.manager = new HotbarManager();
        this.dragDropManager = new DragDropManager();
        console.log(this.manager);
        
        // Apply macrobar collapse setting immediately if it's enabled
        this._applyMacrobarCollapseSetting();

        this.updateUIScale();
    }

    _onCreateToken(token) {

    }

    _onControlToken(token, controlled) {
        if (!this.manager) return;

        /* if ((!controlled && !canvas.tokens.controlled.length) || canvas.tokens.controlled.length > 1) {
            setTimeout(() => {
                if (!canvas.tokens.controlled.length || canvas.tokens.controlled.length > 1) this.generate(null);
            }, 100);
        } */
        if (!controlled && !canvas.tokens.controlled.length) {
            setTimeout(() => {
                if (!canvas.tokens.controlled.length) this.generate(null);
            }, 100);
        }
        if (!controlled) return;

        if(game.settings.get(CONFIG.MODULE_NAME, 'uiEnabled')) this.generate(token);
    }

    async _onUpdateToken(token, changes, options, userId) {
        if (!this.manager || game.user.id !== userId) return;
            
        // If this is our current token and actor-related data changed
        if (token.id === this.manager.currentTokenId && 
            (changes.actorId || changes.actorData || changes.actorLink)) {
            await this.generate(token);
        }
    }

    async _onUpdateActor(actor, changes, options, userId) {
        if(!this.manager) return;
        
        if(changes?.flags?.[CONFIG.MODULE_NAME] && game.user.id !== userId) this.manager.socketUpdateData(actor, changes);
        
        if (game.user.id !== userId) return;
        
        // Check if this update affects our current token
        if (this.actor?.id !== actor.id) return;
        
        // Update UI components
        if (this.manager.element?.[0]) {
            this.generate(this.token);
            /* // Update portrait card for any actor changes
            if (this.manager.ui.portraitCard) {
                this.manager.ui.portraitCard.update(actor);
            }
            
            // Update filter container for spell slot changes
            if (changes.system?.spells && this.manager.ui.filterContainer) {
                this.manager.ui.filterContainer.render();
            }
            
            // Update passives container if items changed
            if (changes.items && this.manager.ui.passivesContainer) {
                await this.manager.ui.passivesContainer.update();
            }
            
            // Let ItemUpdateManager handle item changes
            if (changes.items || changes.system?.spells) {
                await this.manager.itemManager.cleanupInvalidItems(actor);
            } */
        }
    }

    _onUpdateCombat(combat, updates) {
        this.combat.forEach(e => e.setComponentsVisibility());
        if (combat === true || (updates && ("round" in updates || "turn" in updates))) this.hide();
        if (updates && updates.round === 1 && updates.turn === 0) this._onStartCombat(combat);
    }

    async _onStartCombat(combat) {
        this.generate(canvas.tokens.controlled[0]);
        this.hide();
    }

    _onDeleteCombat(combat) {
        this.combat.forEach(e => e.setComponentsVisibility());
        if(!this.components.container?.components?.filterContainer) return;
        this.components.container.components.filterContainer.resetUsedActions();
    }

    _applyMacrobarCollapseSetting() {
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

    _applyTheme() {
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
    }
    
    updateUIScale() {
        // const element = document.body;
        let scale = 1;
        if(game.settings.get(CONFIG.MODULE_NAME, 'autoScale')) {
            scale = window.innerHeight / 1500;
        } else {
            scale = game.settings.get(CONFIG.MODULE_NAME, 'uiScale') / 100;
        }
        // element.style.setProperty('--bg3-scale-ui', scale);
        return scale;
    }    

    // Update methods that other components can call
    updateOpacity() {
        if(!this.element[0]) return;
        const isFaded = this.element[0].classList.contains('faded');
        this._updateFadeState(isFaded);
    }
    
    _updateFadeState(shouldFade) {
        // Clear any existing timeout
        if (this._fadeTimeout) {
            clearTimeout(this._fadeTimeout);
            this._fadeTimeout = null;
        }

        // If opacity is locked and master lock is enabled, always use normal opacity
        if (BG3Hotbar.controlsManager.isLockSettingEnabled('opacity') && 
            BG3Hotbar.controlsManager.isMasterLockEnabled()) {
            this.element.classList.remove('faded');
            this.element.style.opacity = game.settings.get(CONFIG.MODULE_NAME, 'normalOpacity');
            return;
        }

        // If we shouldn't fade or mouse is over module
        if (!shouldFade) {
            this.element.classList.remove('faded');
            this.element.style.opacity = game.settings.get(CONFIG.MODULE_NAME, 'normalOpacity');
            return;
        }

        // Set timeout to fade
        const delay = game.settings.get(CONFIG.MODULE_NAME, 'fadeOutDelay') * 1000;
        this._fadeTimeout = setTimeout(() => {
            if (this.element?.isConnected) {
            this.element.classList.add('faded');
            this.element.style.opacity = game.settings.get(CONFIG.MODULE_NAME, 'fadedOpacity');
            }
        }, delay);
    }

    _initializeFadeOut() {
        // Add mousemove listener to document
        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('dragover', this._handleMouseMove);
        
        // Set initial state
        this._updateFadeState(false);
    }

    updateFadeDelay() {
      this._initializeFadeOut();
    }

    toggle(state) {
        game.settings.set(CONFIG.MODULE_NAME, 'uiEnabled', state);
        this.generate(state ? (canvas.tokens?.controlled?.length > 1 ? null : canvas.tokens?.controlled?.[0]) : null);
    }

    hide() {
        const autoHideSetting = game.settings.get(CONFIG.MODULE_NAME, 'autoHideCombat');
        let state = false;
        if (autoHideSetting !== 'false') {
            const actor = this.manager.actor;
            if(!actor) return;
            state = (autoHideSetting == 'true' && !game.combat?.started) || (autoHideSetting == 'init' && (!game.combat?.started || !(game.combat?.started && game.combat?.combatant?.actor === actor)));
            this.element[0].classList.toggle('slidedown',state);
        }
    }

    async generate(token) {
        if (!this.manager) return;
        if(!token) {
            this.manager.currentTokenId = null;
            return this.close();
        }
        this.manager.currentTokenId = token.id;
        this.manager._loadTokenData();
        this.render(true);
    }

    async _renderInner(data) {        
        const element = await super._renderInner(data),
            html = element[0];

        // Apply setting
        html.style.setProperty('--bg3-scale-ui', this.updateUIScale());
        html.dataset.position = game.settings.get(CONFIG.MODULE_NAME, 'uiPosition');
        html.style.setProperty('--position-padding', `${game.settings.get(CONFIG.MODULE_NAME, 'posPadding')}px`);
        html.style.setProperty('--position-bottom', `${game.settings.get(CONFIG.MODULE_NAME, 'posPaddingBottom')}px`);
        html.dataset.itemName = game.settings.get(CONFIG.MODULE_NAME, 'showItemNames');
        html.dataset.itemUse = game.settings.get(CONFIG.MODULE_NAME, 'showItemUses');
        html.dataset.cellHighlight = game.settings.get(CONFIG.MODULE_NAME, 'highlightStyle');

        this.components = {
            portrait: new PortraitContainer(),
            weapon: new WeaponContainer({weapon: this.manager.containers.weapon, combat: this.manager.containers.combat}),
            container: new HotbarContainer(this.manager.containers.hotbar),
            restTurn: new RestTurnContainer(),
            hotbar: []
        }

        html.appendChild(this.components.portrait.element);
        html.appendChild(this.components.weapon.element);
        html.appendChild(this.components.container.element);
        this.components.container._parent = this;
        html.appendChild(this.components.restTurn.element);
        
        this.combat.push(this.components.restTurn);

        const promises = [];
        Object.values(this.components).forEach((component) => {
            if (component && !Array.isArray(component)) promises.push(component.render());
        });

        await Promise.all(promises);
        
        return element;
    }

    refresh() {
        if (this.rendered) this.render(true);
    }
}