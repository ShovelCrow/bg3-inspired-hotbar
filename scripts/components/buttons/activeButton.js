import { BG3Component } from "../component.js";
import { MenuContainer } from "../containers/MenuContainer.js";


export class ActiveButton extends BG3Component {
    constructor(data, parent) {
        super(data, parent);
    }

    get classes() {
        return ['active-effect-icon'];
    }

    async getData() {
        return this.data.item;
    }

    get dataTooltip() {
        return {type: 'advanced'};
    }

    async _registerEvents() {
        this.element.addEventListener('click', async (e) => {
            if (this.data.item.isSuppressed) return;
            e.preventDefault();
            e.stopPropagation();

            if (this._isTemporary()) {
                if (this._isStatusEffect()) {
                    return await this.data.item.delete();
                } 
                let op = this.data.item.statuses.has('concentrating') ? {
                    title: 'Break Concentration',
                    content: `Are you sure you want to break "${this.data.item.name}"?`,
                    icon: 'fa-solid fa-head-side-gear',
                    label: 'Break Concentration'
                } : {};
                this._deletionDialog(op);
            } else {
                this._toggleEffect()
            }
        });

        this.element.addEventListener('contextmenu', async (e) => {
            return MenuContainer.toggle(this.getActiveMenu(), this, e);
        });
    }

    _isStatusEffect() {
        return !!CONFIG.statusEffects.find((c) => c.hud !== false && c._id === this.data.item.id);
    }

    _isTemporary() {
        return (this.data.item.isTemporary && (!this.data.item.transfer || !this.data.item.flags?.dae?.showIcon))
            || (!this.data.item.isTemporary && !this.data.item.transfer);
    }

    async _toggleEffect() {
        await this.data.item.update({ disabled: !this.data.item.disabled });
        this.update();
    };

    async _deletionDialog(options = {}) {
        const title = options.title ?? 'Remove Effect';
        const content = options.content ?? `Are you sure you want to remove the effect "${this.data.item.name}"?`;
        const icon = options.icon ?? 'fas fa-trash';
        const label = options.label ?? 'Remove';
        const dialog = new Dialog({
            title: title,
            content: `<p>${content}</p>`,
            buttons: {
                delete: {
                    icon: `<i class="${icon}"></i>`,
                    label: label,
                    callback: async () => {
                        await this.data.item.delete();
                        this._parent.render();
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel'
                }
            },
            default: 'cancel'
        });
        dialog.render(true);
    };

    getActiveMenu() {
        const isConcentration = this.data.item.statuses.has('concentrating');
        return {
            position: 'topright2',
            event: 'contextmenu',
            name: 'baseMenu',
            closeParent: true,
            standalone: true,
            buttons: {
                // edit: {
                //     label: 'Edit',
                //     icon: 'fas fa-edit',
                //     visibility: !this.data.item,
                //     click: () => this.menuActiveAction('edit')
                // },
                toggle: {
                    label: 'Toggle Effect',
                    icon: this.data.item.disabled ? 'fas fa-toggle-off' : 'fas fa-toggle-on',
                    visibility: !this.data.item || this.data.item.isSuppressed,
                    click: async () => await this.menuActiveAction('toggle')
                },
                unavailable: {
                    label: 'Effect Unavailable',
                    icon: 'fas fa-eye-slash',
                    class: 'disabled',
                    visibility: !this.data.item || !this.data.item.isSuppressed,
                    click: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                },
                // divider: { visibility: !this.data.item },
                remove: {
                    label: 'Remove Effect',
                    icon: 'fas fa-trash',
                    visibility: !this.data.item || !this._isTemporary()  || isConcentration,
                    click: async () => await this.menuActiveAction('remove')
                },
                break: {
                    label: 'Break Concentration',
                    icon: 'fa-solid fa-head-side-gear',
                    visibility: !this.data.item || !this._isTemporary() || !isConcentration,
                    click: async () => await this.menuActiveAction('remove')
                },
                item: {
                    label: 'View Source',
                    icon: 'fas fa-circle-info',
                    visibility: !this.data.item || !this.data.item.transfer,
                    click: () => this.menuActiveAction('item')
                },
            }
        };
    }

    async menuActiveAction(action) {
        if(!this.data.item) return;
        switch (action) {
            case 'edit':
                try {
                    if (this.data.item?.sheet) this.data.item.sheet.render(true);
                } catch (error) {
                    console.error("BG3 Inspired Hotbar | Error editing effect:", error);
                    ui.notifications.error(`Error editing item: ${error.message}`);
                }
                break;
            case 'toggle':
                await this._toggleEffect();
                break;
            case 'remove':
                await this.data.item.delete();
                this._parent.render();
                break;
            case 'item':
                try {
                    if (!this.data.item.transfer) return;
                    const itemData = this.data.item?.parent;
                    if (itemData?.sheet) itemData.sheet.render(true);
                } catch (error) {
                    console.error("BG3 Inspired Hotbar | Error viewing effect source:", error);
                    ui.notifications.error(`Error viewing effect source: ${error.message}`);
                }
                break;
            default:
                break;
        }
    }

    async update() {
        await super.update();
        this.element.classList.toggle('disabled', this.data.item.disabled || this.data.item.isSuppressed);
    }

    async render() {
        await super.render();
        this.element.dataset.uuid = this.data.item.uuid;
        await this.update();
        return this.element;
    }
}