import { BG3CONFIG } from '../../utils/config.js';
import { PassiveButton } from '../buttons/passiveButton.js';
import { BG3Component } from "../component.js";

export class PassiveContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ['bg3-passives-container'];
    }

    get dataTooltip() {
        return {type: 'simple', content: "Right-click to configure passive features"};
    }

    get passivesList() {
        if(!this.token && !this.actor) return null;

        const availablePassives = this.actor.items.filter(item => 
            item.type === "feat" && (!item.system.activation?.type || item.system.activation.type === "passive")
        );
        const saved = this.actor.getFlag(BG3CONFIG.MODULE_NAME, "selectedPassives");
        let featuresToShow = [];
        if (this.selectedPassives) {
            featuresToShow = availablePassives.filter(item => this.selectedPassives.has(item.uuid));
        }
        return featuresToShow;
    }

    get selectedPassives() {
        const saved = this.actor.getFlag(BG3CONFIG.MODULE_NAME, "selectedPassives");
        if (saved && Array.isArray(saved)) return new Set(saved);
        return;
    }

    async _registerEvents() {
        this.element.onmouseup = this._showPassivesDialog.bind(this);
    }

    async _showPassivesDialog(event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.button !== 2) return;
                
        // Get all available passive features from the actor
        const availableFeatures = this.actor.items
            .filter(item => item.type === "feat" && (!item.system.activation?.type || item.system.activation.type === "passive"))
            .map(item => ({
                uuid: item.uuid,
                name: item.name,
                img: item.img,
                selected: this.selectedPassives?.has(item.uuid)
            }));

        // Create and show dialog using the template
        const dialog = new Dialog({
            title: "Configure Passive Features",
            content: await renderTemplate(`modules/${BG3CONFIG.MODULE_NAME}/templates/dialog/passives-dialog.hbs`, {
                features: availableFeatures
            }),
            buttons: {
                save: {
                    icon: '<i class="fas fa-save"></i>',
                    label: "Save",
                    callback: async (html) => {
                        // Use jQuery to query within the dialog's content container
                        const $dialogContent = $(html);
                        // Find all checkboxes and build a new set based on their checked state
                        const newSelection = new Set();
                        $dialogContent.find("input.passives-checkbox").each(function() {
                            if ($(this).is(":checked")) {
                                newSelection.add($(this).val());
                            }
                        });
                        // Update our selection and persist it
                        await this.actor.setFlag(BG3CONFIG.MODULE_NAME, "selectedPassives", Array.from(newSelection));
                        this.render();
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel"
                }
            },
            default: "save"
        }, {
            classes: ["configure-passives", "bg3-hud-dialog"],
            resizable: false
        });
        
        dialog.render(true);

        // Add click handlers after dialog is rendered
        setTimeout(() => {
            const $rows = $('.passives-row');
            
            // Click handlers for rows
            $rows.on('click', function(e) {
                if (!$(e.target).is('input')) {
                    const checkbox = $(this).find('input[type="checkbox"]');
                    checkbox.prop('checked', !checkbox.prop('checked'));
                }
            });
        }, 100);
    }

    async render() {
        await super.render();
        const passivesList = this.passivesList;
        // if(passivesList.length === 0) this.element.style.visibility = 'hidden';

        const passives = passivesList.map((passive) => new PassiveButton({item: passive}, this));
        for(const passive of passives) this.element.appendChild(passive.element);
        await Promise.all(passives.map((passive) => passive.render()));

        return this.element;
    }
}