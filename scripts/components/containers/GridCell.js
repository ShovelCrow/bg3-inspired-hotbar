import { BG3Component } from "../component.js";
import { fromUuid } from "../../utils/foundryUtils.js";

export class GridCell extends BG3Component {
    constructor(data) {
        super(data);
        this.type = null;
    }

    get classes() {
        return ['hotbar-cell', 'drag-cursor'];
    }

    get slotKey() {
        return this.element.dataset.slot;
    }

    async getData() {
        let itemData = await this.item,
            data = super.getData();
        if(itemData) {
            data = {...data, ...{
                    uuid: itemData.uuid,
                    name: itemData.name,
                    icon: itemData.img,
                    actionType: itemData.system?.activation?.type?.toLowerCase(),
                    itemType: itemData.type
                },
                ...await this.getItemUses()
            };        
            if(itemData.type === "spell") data = {...data, ...{isPact: itemData.system?.preparation?.mode === "pact", level: itemData.system?.level}};
            if(itemData.type === 'feat') data = {...data, ...{featType: itemData.system?.type?.value || 'default'}};
        }
        return data;
    }

    get item() {
        return (async () => {
            if(!this.data.item?.uuid) return;
            return await fromUuid(this.data.item.uuid);
        })();
    }

    async getItemUses() {
        const itemData = await this.item;
        if (itemData?.system?.uses) {
            const uses = itemData.system.uses;
            const value = uses.value ?? 0;
            const max = uses.max ?? 0;

            // Only show uses if max > 0.
            if (max > 0) return {uses: {value: value, max: max}};
            else return null;
        } else return null;
    }

    async menuItemAction(action) {
        if(!this.data.item) return;
        switch (action) {
            case 'edit':
                try {
                    const itemData = await this.item;
                    if (itemData?.sheet) itemData.sheet.render(true);
                } catch (error) {
                    console.error("BG3 Inspired Hotbar | Error editing item:", error);
                    ui.notifications.error(`Error editing item: ${error.message}`);
                }
                break;
            case 'activity':
                try {
                    const itemData = await this.item;
                    if (itemData?.sheet) {
                        const sheet = itemData.sheet.render(true);
                        if (sheet?.activateTab) {
                            setTimeout(() => {
                                try {
                                    sheet.activateTab("activities");
                                } catch (err) {
                                    // No activities tab found
                                }
                            }, 100);
                        }
                    }
                } catch (error) {
                    console.error("BG3 Inspired Hotbar | Error configuring activities:", error);
                    ui.notifications.error(`Error configuring activities: ${error.message}`);
                }
                break;
            case 'remove':
                delete this.data.item;
                await this._renderInner();
                delete ui.BG3HOTBAR.manager.containers[this._parent.id][this._parent.index].items[this.slotKey];
                await ui.BG3HOTBAR.manager.persist();
                break;
            default:
                break;
        }
    }

    async _registerEvents() {
        this.element.addEventListener('click', async (e) => {
            e.preventDefault();
            // e.stopPropagation();
            const item = await this.item;
            if(item) {
                try {
                    if(item.execute) item.execute();
                    else if(item.use) {
                        const options = {
                        configureDialog: false,
                        legacy: false,
                        event: e
                        };
                        if (e.ctrlKey) options.disadvantage = true;
                        if (e.altKey) options.advantage = true;
                        const used = await item.use(options, { event: e });
                        if (used) this._renderInner();
                    }
                } catch (error) {
                    console.error("BG3 Inspired Hotbar | Error using item:", error);
                    ui.notifications.error(`Error using item: ${error.message}`);
                }
            } else {
                
            }
        });
        
        this.element.addEventListener('contextmenu', (e) => {
            if(this.data.item?.uuid) this._parent.targetItem = this;
            else this._parent.targetItem = null;
            this._parent.itemMenu.element.setAttribute('data-item', this.data.item?.uuid ? 'true' : 'false');
        });
        
        this.element.addEventListener('mouseenter', (e) => {

        });
        
        this.element.addEventListener('mouseleave', (e) => {

        });
        
        this.element.addEventListener('dragstart', (e) => {
            if (this._parent?.locked || !this.data.item) {
                e.preventDefault();
                return;
            }

            document.body.classList.add('dragging-active');
            document.body.classList.add('drag-cursor');
            this.element.classList.add("dragging");

            ui.BG3HOTBAR.dragDropManager.dragSourceCell = this;
        });
        
        this.element.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this._parent?.locked) return;
            e.dataTransfer.dropEffect = "move";
            this.element.classList.add("dragover");
        });
        
        this.element.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this._parent?.locked) return;

            this.element.classList.remove("dragover");

            await ui.BG3HOTBAR.dragDropManager.proceedDrop(this, e);

            if(this._parent.id === 'weapon') this._parent._parent.switchSet(this._parent);
        });
        
        this.element.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (this._parent?.locked) return;
            this.element.classList.add("dragover");
        });
        
        this.element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (this._parent?.locked) return;
            this.element.classList.remove("dragover");
        });
        
        this.element.addEventListener('dragend', (e) => {
            document.body.classList.remove('dragging-active');
            document.body.classList.remove('drag-cursor');
            this.element.classList.remove("dragging");
            this.element.classList.remove("dragover");
        });
    }

    async _renderInner() {
        await super._renderInner();
        this.element.setAttribute('data-slot', `${this.data.col}-${this.data.row}`);
        this.element.setAttribute('draggable', !!this.data.item);
        this.element.classList.toggle('has-item', !!this.data.item);
        if(this.data.item) {
            const itemData = await this.item;
            if(itemData) {
                if(itemData.system?.activation?.type) this.element.dataset.actionType = itemData.system.activation.type.toLowerCase();
                this.element.dataset.itemType = itemData.type;
                if(itemData.type === "spell") {
                    this.element.dataset.isPact = itemData.system.preparation?.mode === "pact";
                    this.element.dataset.level = itemData.system.level;
                }
                if(itemData.type === 'feat') this.element.dataset.featType = itemData.system.type?.value || 'default';
            }
        }
    }
}