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
                    'click': () => {
                        ui.BG3HOTBAR.components.hotbar.forEach(c => {
                            c.data.rows++;
                            c.render();
                        });
                        ui.BG3HOTBAR.manager.persist();
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
                        if(ui.BG3HOTBAR.components.hotbar[0].data.rows > 1) {
                            ui.BG3HOTBAR.components.hotbar.forEach(c => {
                                c.data.rows--;
                                c.render();
                            });
                            ui.BG3HOTBAR.manager.persist();
                        }
                    }
                }
            },
            {
                type: 'div',
                class: ["hotbar-control-button"], 
                icon: 'fa-unlock',
                title: 'Lock hotbar settings<br>(Right-click for options)',
                events: {
                    'click': function(e) {
                        
                    }
                }
            },
            {
                type: 'div',
                class: ["hotbar-control-button"], 
                icon: 'fa-cog',
                title: 'Settings',
                events: {
                    'click': function(e) {
                        
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