import { BaseButton } from "../buttons/BaseButton.js";
import { BG3Component } from "../component.js";

export class ControlContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ["bg3-control-container"]
    }

    get btnData() {
        return [
            {
                type: 'div',
                class: ["hotbar-control-button"], 
                icon: 'fa-plus',
                title: 'Add Row',
                events: {
                    'click': function() {
                        // game.combat.nextTurn.bind(game.combat)()
                    }
                }
            },
            {
                type: 'div',
                class: ["hotbar-control-button"], 
                icon: 'fa-minus',
                title: 'Remove Row',
                events: {
                    'click': function() {
                        // game.combat.nextTurn.bind(game.combat)()
                    }
                }
            },
            {
                type: 'div',
                class: ["hotbar-control-button"], 
                icon: 'fa-unlock',
                title: 'Lock hotbar settings<br>(Right-click for options)',
                events: {
                    'click': function() {
                        // game.combat.nextTurn.bind(game.combat)()
                    }
                }
            },
            {
                type: 'div',
                class: ["hotbar-control-button"], 
                icon: 'fa-cog',
                title: 'Settings',
                events: {
                    'click': function() {
                        // game.combat.nextTurn.bind(game.combat)()
                    }
                }
            },
        ];
    }
    
    async render() {
        const html = await super.render();
        for(let i = 0; i < this.btnData.length; i++) {
            const btn = new BaseButton(this.btnData[i]);
            btn.render();
            this.element.appendChild(btn.element);
        }
        return this.element;
    }
}