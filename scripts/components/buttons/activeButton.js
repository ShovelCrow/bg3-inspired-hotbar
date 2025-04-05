import { BG3Component } from "../component.js";


export class ActiveButton extends BG3Component {
    constructor(data) {
        super(data);
        this.element.dataset.uuid = this.data.item.uuid;
    }

    get classes() {
        return ['active-effect-icon'];
    } 

    async getData() {
        return this.data.item;
    }

    _registerEvents() {
        this.element.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Clear any pending tooltip timer
            // BaseTooltip.cleanup(effect.type || "effect");
    
            // Store the current tooltip before updating
            // const currentTooltip = wrapper._hotbarTooltip;
            
            // Set updating flag
            // wrapper._isUpdatingTooltip = true;
            
            // Update the effect's disabled status
            console.log(this, this.data.item.disabled)
            await this.data.item.update({ disabled: !this.data.item.disabled });
            console.log(this, this.data.item.disabled)
            
            /* // If there was a tooltip and it's not being dragged, update its content
            if (currentTooltip && !currentTooltip._isDragging) {
            // Clear the current content
            if (currentTooltip.element) {
                currentTooltip.element.innerHTML = '';
                // Rebuild the content with the updated effect state
                currentTooltip.item = effect;  // Update the item reference
                currentTooltip.buildContent();
            }
            }
            
            // Clear updating flag after a short delay
            const tooltipDelay = BaseTooltip.getTooltipDelay();
            setTimeout(() => {
            wrapper._isUpdatingTooltip = false;
            }, tooltipDelay + 50); // Add 50ms buffer to the delay */
            this.render();
        });
        
        this.element.addEventListener("contextmenu", async (e) => {
            e.preventDefault();
            const dialog = new Dialog({
              title: "Delete Effect",
              content: `<p>Are you sure you want to delete the effect "${this.data.item.label}"?</p>`,
              buttons: {
                delete: {
                  icon: '<i class="fas fa-trash"></i>',
                  label: "Delete",
                  callback: () => this.data.item.delete()
                },
                cancel: {
                  icon: '<i class="fas fa-times"></i>',
                  label: "Cancel"
                }
              },
              default: "cancel"
            });
            dialog.render(true);
        });
    }

    async render() {
        const html = await super.render();
        this.element.classList.toggle('disabled', this.data.item.disabled);
        return this.element;
    }
}