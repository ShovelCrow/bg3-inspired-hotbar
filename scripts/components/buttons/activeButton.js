import { BG3Component } from "../component.js";


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
        const _toggleEffect = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.data.item.update({ disabled: !this.data.item.disabled });
            this.update();
        };
        const _deletionDialog = async (
            title = "Delete Effect",
            content = `Are you sure you want to delete the effect "${this.data.item.label}"?`,
            icon = "fas fa-trash",
            label = "Delete"
            ) => {
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
                label: "Cancel"
                }
            },
            default: "cancel"
            });
            dialog.render(true);
        };

        this.element.addEventListener('click', async (e) => {
            _toggleEffect(e)
        });
        
        this.element.addEventListener('contextmenu', async (e) => {
            e.preventDefault();
            if (!this.data.item.transfer) {
                if (this.data.item.statuses.has('concentrating')) {
                    _deletionDialog('Break Concentration',
                         `Are you sure you want to break "${this.data.item.label}"?`,
                         'fa-solid fa-head-side-gear',
                         'Break Concentration'
                        );
                } else if (CONFIG.statusEffects.filter((c) => c._id === this.data.item.id).length >= 1) {
                    console.log(CONFIG.statusEffects.filter((c) => c._id === this.data.item.id));
                    await this.data.item.delete();
                } else {
                    _deletionDialog();
                }
            } else { // SHOVEL
                _toggleEffect(e)
            }
        });
    }

    async update() {
        await super.update();
        this.element.classList.toggle('disabled', this.data.item.disabled);
    }

    async render() {
        await super.render();
        this.element.dataset.uuid = this.data.item.uuid;
        await this.update();
        return this.element;
    }
}