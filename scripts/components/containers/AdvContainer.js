import { BaseButton } from "../buttons/BaseButton.js";
import { BG3Component } from "../component.js";
import { BG3CONFIG } from "../../utils/config.js";

export class AdvContainer extends BG3Component {
    constructor(data) {
        super(data);
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
                    'mouseup': this.setState.bind(this),
                }
            },
            {
                type: 'div',
                key: 'disBtn',
                title: 'Left-click to set Disadvantage to roll only.<br>Right-click to toggle.',
                label: 'DIS',
                events: {
                    'mouseup': this.setState.bind(this),
                }
            }
        ];
    }

    async setState(event) {
        const once = event?.button === 2 ? false : true,
            key = event?.target?.closest('[data-key]')?.dataset.key;
        if(event === null || (this.actor.getFlag(BG3CONFIG.MODULE_NAME, "advOnce") === once && this.actor.getFlag(BG3CONFIG.MODULE_NAME, "advState") === key)) {
            await this.actor.unsetFlag(BG3CONFIG.MODULE_NAME, "advState");
            await this.actor.unsetFlag(BG3CONFIG.MODULE_NAME, "advOnce");
        } else {
            await this.actor.setFlag(BG3CONFIG.MODULE_NAME, "advOnce", once);
            await this.actor.setFlag(BG3CONFIG.MODULE_NAME, "advState", key);
        }
        this.updateButtons();
    }

    updateButtons() {
        const state = this.actor.getFlag(BG3CONFIG.MODULE_NAME, "advState"),
            once = this.actor.getFlag(BG3CONFIG.MODULE_NAME, "advOnce");
        if(state !== undefined) this.element.dataset.state = this.actor.getFlag(BG3CONFIG.MODULE_NAME, "advState");
        else this.element.removeAttribute('data-state');
        if(once !== undefined) this.element.dataset.once = this.actor.getFlag(BG3CONFIG.MODULE_NAME, "advOnce");
        else this.element.removeAttribute('data-once');
    }
    
    async _renderInner() {
        await super._renderInner();
        if(!game.settings.get(BG3CONFIG.MODULE_NAME, 'addAdvBtnsMidiQoL')) return;
        const buttons = this.btnData.map((btn) => new BaseButton(btn, this));
        for(const btn of buttons) this.element.appendChild(btn.element);
        await Promise.all(buttons.map((btn) => btn.render()));
        this.updateButtons();
        // this.registerHooks() ;
    }

    destroy() {
        while (this.element.firstChild) {
            this.element.removeChild(this.element.lastChild);
        }
        // this.unRegisterHooks();
    }
}