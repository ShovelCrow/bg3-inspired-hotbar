import { BaseButton } from "../buttons/BaseButton.js";
import { BG3Component } from "../component.js";

export class RestTurnContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ["bg3-restturn-container"]
    }

    get btnData() {
        return [
            {
                type: 'div',
                class: ["rest-turn-button", "turn-button"], 
                label: 'End Turn',
                icon: 'fa-clock-rotate-left',
                visible: () => !!game.combat?.started && game.combat?.combatant?.actor === ui.BG3HOTBAR.manager.actor,
                events: {
                    'click': function() {
                        game.combat.nextTurn.bind(game.combat)()
                    }
                }
            },
            {
                type: 'div',
                class: ["rest-turn-button"],
                label: 'Short Rest',
                icon: "fa-campfire",
                visible: () => !game.combat?.started,
                events: {
                    'click': ui.BG3HOTBAR.manager.actor.shortRest.bind(ui.BG3HOTBAR.manager.actor)
                }
            },
            {
                type: 'div',
                class: ["rest-turn-button"],
                label: 'Long Rest',
                icon: "fa-tent",
                visible: () => !game.combat?.started,
                events: {
                    'click': ui.BG3HOTBAR.manager.actor.longRest.bind(ui.BG3HOTBAR.manager.actor)
                }
            },
            {
                type: 'label',
                class: ["btn-toggle", "fas", "fa-caret-down"],
                attr: {"title": 'Show/Hide HotBar UI', "for": 'toggle-input'},
                events: {
                    'click': () => {
                        ui.BG3HOTBAR.element.classList.toggle('slidedown');
                    }
                }
            }
        ]
    }
    
    async render() {
        const html = await super.render();
        for(let i = 0; i < this.btnData.length; i++) {
            const btn = new BaseButton(this.btnData[i]);
            this.components.push(btn);
            btn.render();
            this.element.appendChild(btn.element);
        }
        return this.element;
    }
}