import { BG3Component } from "../component.js";
import { MenuContainer } from "../containers/MenuContainer.js";


export class PassiveButton extends BG3Component {
    constructor(data, parent) {
        super(data, parent);
    }

    get classes() {
        return ['passive-feature-icon'];
    } 

    get dataTooltip() {
        return {type: 'advanced'};
    }

    async getData() {
        return this.data.item;
    }

    async _registerEvents() {
        this.element.addEventListener("click", async () => {
            if(this.data.item.use) await this.data.item.use();
        });
        this.element.addEventListener('contextmenu', async (e) => {
            return MenuContainer.toggle(this.getPassiveMenu(), this, e);
        });
    }

    getPassiveMenu() {
        return {
            position: 'topright2',
            event: 'contextmenu',
            name: 'baseMenu',
            closeParent: true,
            standalone: true,
            buttons: {
                view: {
                    label: game.i18n.localize("BG3.Hotbar.ContextMenu.ViewItem"),
                    icon: 'fas fa-eye',
                    visibility: !this.data.item,
                    click: () => this.menuPassiveAction('view')
                },
                edit: {
                    label: game.i18n.localize("BG3.Hotbar.ContextMenu.EditItem"),
                    icon: 'fas fa-edit',
                    visibility: !this.data.item,
                    click: () => this.menuPassiveAction('edit')
                },
                divider: { visibility: !this.data.item },
                config: {
                    label: 'Configure Container',
                    icon: 'fas fa-gear',
                    visibility: !this.data.item,
                    click: () => this.menuPassiveAction('config')
                }
            }
        };
    }

    async menuPassiveAction(action) {
        if(!this.data.item) return;
        switch (action) {
            case 'view':
                try {
                    const itemData = this.data.item;
                    if (itemData?.sheet) itemData.sheet.render(true, { mode: 1 });
                } catch (error) {
                    console.error("BG3 Inspired Hotbar | Error viewing item:", error);
                    ui.notifications.error(`Error viewing item: ${error.message}`);
                }
                break;
            case 'edit':
                try {
                    const itemData = this.data.item;
                    if (itemData?.sheet) itemData.sheet.render(true, { mode: 2 });
                } catch (error) {
                    console.error("BG3 Inspired Hotbar | Error editing item:", error);
                    ui.notifications.error(`Error editing item: ${error.message}`);
                }
                break;
            case 'config':
                try {
                    this._parent._showPassivesDialog();
                } catch (error) {
                    console.error("BG3 Inspired Hotbar | Error configuring passives:", error);
                    ui.notifications.error(`Error configuring passives: ${error.message}`);
                }
                break;
            default:
                break;
        }
    }

    async render() {
        await super.render();
        this.element.dataset.uuid = this.data.item.uuid;
        return this.element;
    }
}