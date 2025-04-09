import { BaseButton } from "../buttons/BaseButton.js";
import { BG3Component } from "../component.js";
import { CONFIG } from "../../utils/config.js";
import { MenuContainer } from "./MenuContainer.js";

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
                key: 'controlPlus',
                class: ["hotbar-control-button"], 
                icon: 'fa-plus',
                title: 'Add Row',
                events: {
                    'click': () => {
                        ui.BG3HOTBAR.components.hotbar.forEach(c => {
                            c.data.rows++;
                            c._renderInner();
                        });
                        ui.BG3HOTBAR.manager.persist();
                    }
                }
            },
            {
                type: 'div',
                key: 'controlMinus',
                class: ["hotbar-control-button"], 
                icon: 'fa-minus',
                title: 'Remove Row',
                events: {
                    'click': function() {
                        if(ui.BG3HOTBAR.components.hotbar[0].data.rows > 1) {
                            ui.BG3HOTBAR.components.hotbar.forEach(c => {
                                c.data.rows--;
                                c._renderInner();
                            });
                            ui.BG3HOTBAR.manager.persist();
                        }
                    }
                }
            },
            {
                type: 'div',
                key: 'controlLock',
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
                key: 'controlSettings',
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

    getSettingsMenu() {
        return {
            position: 'target',
            event: 'click',
            name: 'baseMenu',
            buttons: {
                resetSettings: {
                    label: game.i18n.localize("BG3.Hotbar.ContextMenu.ResetLayout"),
                    icon: 'fas fa-rotate',
                    click: () => {
                        
                    }
                },
                clearSettings: {
                    label: game.i18n.localize("BG3.Hotbar.ContextMenu.ClearAllItems"),
                    icon: 'fas fa-trash',
                    click: () => {
                        
                    }
                },
                divider: {},
                importSettings: {
                    label: game.i18n.localize("BG3.Hotbar.ContextMenu.ImportLayout"),
                    icon: 'fas fa-file-import',
                    click: () => {
                        
                    }
                },
                exportSettings: {
                    label: game.i18n.localize("BG3.Hotbar.ContextMenu.ExportLayout"),
                    icon: 'fas fa-file-export',
                    click: () => {
                        
                    }
                }
            }
        }
    }

    getLockMenu() {
        return {
            position: 'target',
            event: 'contextmenu',
            name: 'baseMenu',
            buttons: {
                deselectLock: {
                    label: 'Deselecting Token',
                    icon: 'fas fa-user-slash',
                    click: () => {
                        
                    }
                },
                opacityLock: {
                    label: 'Opacity',
                    icon: 'fas fa-eye',
                    click: () => {
                        
                    }
                },
                dragDropLock: {
                    label: 'Drag & Drop',
                    icon: 'fas fa-arrows-alt',
                    click: () => {
                        
                    }
                }
            }
        }
    }
    
    async _renderInner() {
        await super._renderInner();
        if(game.settings.get(CONFIG.MODULE_NAME, 'fadeControlsMenu')) this.element.classList.add('fade');
        for(let i = 0; i < this.btnData.length; i++) {
            const btn = new BaseButton(this.btnData[i]);
            await btn.render();
            this.element.appendChild(btn.element);
        };
        this.settingsMenu = new MenuContainer(this.getSettingsMenu(), this.element.querySelector('[data-key="controlSettings"]'), true);
        this.settingsMenu.render();
        this.lockMenu = new MenuContainer(this.getLockMenu(), this.element.querySelector('[data-key="controlLock"]'), true);
        this.lockMenu.render();
    }
}