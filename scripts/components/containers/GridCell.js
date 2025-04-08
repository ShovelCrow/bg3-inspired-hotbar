import { BG3Component } from "../component.js";
import { fromUuid } from "../../utils/foundryUtils.js";

export class GridCell extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ['hotbar-cell', 'drag-cursor'];
    }

    get slotKey() {
        return this.element.dataset.slot;
    }

    get _dragData() {
        return this.data.item ? { containerIndex: this._parent.index, slotKey: this.slotKey } : null;
    }

    async getData() {
        return {...super.getData(), ...this.data, ...await this.getItemUses()};
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

    async _registerEvents() {
        this.element.addEventListener('click', async (e) => {
            const item = await this.item;
            console.log(this, item)
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
                        if (used) this.render();
                    }
                } catch (error) {
                    console.error("BG3 Inspired Hotbar | Error using item:", error);
                    ui.notifications.error(`Error using item: ${error.message}`);
                }
            } else {
                
            }
        });
        
        this.element.addEventListener('contextmenu', (e) => {

        });
        
        this.element.addEventListener('mouseenter', (e) => {

        });
        
        this.element.addEventListener('mouseleave', (e) => {

        });
        
        this.element.addEventListener('dragstart', (e) => {
            if (this._parent?.data?.locked || !this.data.item) {
                e.preventDefault();
                return;
            }

            document.body.classList.add('dragging-active');
            document.body.classList.add('drag-cursor');
            this.element.classList.add("dragging");

            // Allow movement
            e.dataTransfer.effectAllowed = "move";
            // Set a simple JSON payload containing the source slot key and the item
            e.dataTransfer.setData("text/plain", JSON.stringify({
                containerId: this._parent.id,
                containerIndex: this._parent.index,
                slotKey: this.slotKey,
                item: this.data.item
            }));
        });
        
        this.element.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this._parent?.data?.locked) return;
            e.dataTransfer.dropEffect = "move";
            this.element.classList.add("dragover");
        });
        
        this.element.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this._parent?.data?.locked) return;

            this.element.classList.remove("dragover");

            console.log(JSON.parse(e.dataTransfer.getData("text/plain")))

            /* // Parse the transferred data
            let dragData;
            try {
                dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
            } catch (err) {
                console.error("Failed to parse drop data:", err);
                return;
            }

            // Do nothing if dropped in the same slot
            if(dragData._parent.id === dragData.containerId && dragData._parent.index === dragData.containerIndex && dragData.slotKey === this.slotKey) return;

            const targetItem =  */

        });
        
        this.element.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (this._parent?.data?.locked) return;
            this.element.classList.add("dragover");
        });
        
        this.element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (this._parent?.data?.locked) return;
            this.element.classList.remove("dragover");
        });
        
        this.element.addEventListener('dragend', (e) => {
            document.body.classList.remove('dragging-active');
            document.body.classList.remove('drag-cursor');
            this.element.classList.remove("dragging");
            this.element.classList.remove("dragover");
        });
    }

    async render() {
        const html = await super.render();
        this.element.setAttribute('data-slot', `${this.data.col}-${this.data.row}`);
        this.element.setAttribute('draggable', !!this.data.item);
        this.element.classList.toggle('has-item', !!this.data.item);
        if(this.data.item) {
            const itemData = await this.item;
            // console.log(itemData)
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

        return this.element;
    }
}