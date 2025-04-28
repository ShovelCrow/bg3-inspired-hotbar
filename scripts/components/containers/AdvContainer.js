import { BaseButton } from "../buttons/BaseButton.js";
import { BG3Component } from "../component.js";
import { BG3CONFIG } from "../../utils/config.js";

export class AdvContainer extends BG3Component {
    constructor(data) {
        super(data);
        this._enabled = false;
        this._state = null;
        this._once = true;
        this._init();
    }

    get classes() {
        return ["bg3-adv-container"]
    }

    get visible() {
        return game.settings.get(BG3CONFIG.MODULE_NAME, 'addAdvBtnsMidiQoL');
    }
    
    get btnData() {
        return [
            {
                type: 'div',
                key: 'advBtn',
                title: 'Left-click to set Advantage to roll only.<br>Right-click to toggle.',
                label: 'ADV',
                events: {
                    'mouseup': this.setState,
                }
            },
            {
                type: 'div',
                key: 'disBtn',
                title: 'Left-click to set Disadvantage to roll only.<br>>Right-click to toggle.',
                label: 'DIS',
                events: {
                    'mouseup': this.setState,
                }
            }
        ];
    }

    // get enabled() {
    //     return this._enabled;
    // }

    // set enabled(value) {
    //     this._enabled = value;
    //     this.element.style.setProperty('display', this.enabled ? 'flex': 'none');
    // }

    get state() {
        return this._state;
    }

    set state(state) {
        this._state = state;
        this.element.dataset.state = this.state;
        this.element.dataset.once = this._once;
    }

    _init() {
        Hooks.on("dnd5e.preRollAttackV2", this.hookRollEvent.bind(this));
        Hooks.on("dnd5e.preRollSavingThrowV2", this.hookRollEvent.bind(this));
        Hooks.on("dnd5e.preRollSkillV2", this.hookRollEvent.bind(this));
        Hooks.on("dnd5e.preRollAbilityCheckV2", this.hookRollEvent.bind(this));
        Hooks.on("dnd5e.preRollConcentrationV2", this.hookRollEvent.bind(this));
        Hooks.on("dnd5e.preRollDeathSaveV2", this.hookRollEvent.bind(this));
        Hooks.on("dnd5e.preRollToolV2", this.hookRollEvent.bind(this));
    }

    hookRollEvent(rollConfig, dialogConfig, messageConfig) {
        if(this.state !== null) {
            if(this.state === 'advBtn') rollConfig.advantage = true;
            else if(this.state === 'disBtn') rollConfig.disadvantage = true;
            if(this._once) this.state = this._once = null;
        }
    }

    setState(event) {
        const once = event.button === 2 ? false : true;
        if(this._parent._once === once && this._parent.state === this.data.key) this._parent.state = null;
        else {
            this._parent._once = once;
            this._parent.state = this.data.key;
        }
    }
    
    async _renderInner() {
        await super._renderInner();
        const buttons = this.btnData.map((btn) => new BaseButton(btn, this));
        for(const btn of buttons) this.element.appendChild(btn.element);
        await Promise.all(buttons.map((btn) => btn.render()));
    }
}