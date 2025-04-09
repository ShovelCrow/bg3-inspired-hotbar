import { AutoSort } from "../../features/AutoSort.js";
import { BG3Component } from "../component.js";
import { GridCell } from "./GridCell.js";
import { MenuContainer } from "./MenuContainer.js";

export class GridContainer extends BG3Component {
    constructor(data) {
        super(data);
        this.index = 0;
        this.id = null;
        this.targetItem = null;
        this.locked = false;
    }

    get classes() {
        return [...['bg3-hotbar-subcontainer'], ...(this.data?.class ?? [])];
    }

    getItemMenu() {
        return {
            position: 'target',
            event: 'contextmenu',
            name: 'baseMenu',
            buttons: {
                edit: {
                    label: game.i18n.localize("BG3.Hotbar.ContextMenu.EditItem"),
                    icon: 'fas fa-edit',
                    click: () => {
                        if(!this.targetItem) return;
                        this.targetItem.menuItemAction.bind(this.targetItem)('edit');
                        this.itemMenu.setVisibility();
                    }
                },
                activity: {
                    label: game.i18n.localize("BG3.Hotbar.ContextMenu.ConfigureActivities"),
                    icon: 'fas fa-cog',
                    click: () => {
                        if(!this.targetItem) return;
                        this.targetItem.menuItemAction.bind(this.targetItem)('activity');
                        this.itemMenu.setVisibility();
                    }
                },
                remove: {
                    label: game.i18n.localize("BG3.Hotbar.ContextMenu.Remove"),
                    icon: 'fas fa-trash',
                    click: async () => {
                        if(!this.targetItem) return;
                        await this.targetItem.menuItemAction.bind(this.targetItem)('remove');
                        if(this.id === 'weapon') this._parent.switchSet(this);
                        this.itemMenu.setVisibility();
                    }
                },
                divider: {},
                populate: {
                    label: 'Auto-Populate This Container', icon: 'fas fa-magic'
                },
                sort: {
                    label: 'Sort Items In This Container', icon: 'fas fa-sort',
                    click: () => {
                        this.menuItemAction('sort');
                        this.itemMenu.setVisibility();
                    }
                },
                clear: {
                    label: 'Clear Container', icon: 'fas fa-trash-alt',
                    click: () => {
                        this.menuItemAction('clear');
                        this.itemMenu.setVisibility();
                        if(this.id === 'weapon') this._parent.switchSet(this);
                    }
                }
            }
        }
    }

    async menuItemAction(action) {
        switch (action) {
            case 'populate':
                
                break;
            case 'sort':
                await AutoSort.sortContainer(this);
                break;
            case 'clear':
                ui.BG3HOTBAR.manager.containers[this.id][this.index].items = {};
                this.data.items = {};
                await this._renderInner();
                await ui.BG3HOTBAR.manager.persist();
                break;
            default:
                break;
        }
    }

    async _renderInner() {
        await super._renderInner();
        this.element.style.setProperty('--cols', this.data.cols);
        this.element.style.setProperty('--rows', this.data.rows);
        for(let r = 0; r < this.data.rows; r++) {
            for(let c = 0; c < this.data.cols; c++) {
                const item = this.data?.items?.[`${c}-${r}`] ?? null,
                    cell = new GridCell({row: r, col: c, item: item});
                cell._parent = this;
                cell.render();
                this.element.appendChild(cell.element);
                this.addComponent(cell);
            }
        }
        this.itemMenu = new MenuContainer(this.getItemMenu(), this, true);
        this.itemMenu.render();
    }
}