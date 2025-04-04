// BG3 Inspired Hotbar Module - Main Entry Point

import { GridContainer } from './components/GridContainer.js';
import { HotbarManager } from './managers/HotbarManager.js';
import { CONFIG } from './utils/config.js';

export class BG3Hotbar extends Application {
    constructor() {
        super();

        this._manager = null;

        /** Hooks Event **/
        Hooks.on("createToken", this._onCreateToken.bind(this));
        Hooks.on("controlToken", this._onControlToken.bind(this));
        Hooks.on("deleteToken", this._onDeleteToken.bind(this));
        Hooks.on("updateToken", this._onUpdateToken.bind(this));
        Hooks.on("updateActor", this._onUpdateActor.bind(this));
        Hooks.on("deleteScene", this._onDeleteScene.bind(this));
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
        // Initialize the hotbar manager
        this.manager = new HotbarManager();
        console.log(this.manager);
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

        for(let i = 0; i < this.manager.containers.hotbar.length; i++) {
            const container = new GridContainer(this.manager.containers.hotbar[i]);

        }
        for(let i = 0; i < this.manager.containers.weapon.length; i++) {
            const container = new GridContainer(this.manager.containers.weapon[i]);
        }
        for(let i = 0; i < this.manager.containers.combat.length; i++) {
            const container = new GridContainer(this.manager.containers.combat[i]);
        }
        
        return element;
    }

    refresh() {
        if (this.rendered) this.render(true);
    }
}