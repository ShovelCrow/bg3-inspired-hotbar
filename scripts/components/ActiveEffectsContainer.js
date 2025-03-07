import { CONFIG } from '../utils/config.js';
import { Tooltip, EffectTooltip } from './Tooltip.js';

export class ActiveEffectsContainer {
    constructor(hotbarUI) {
        this.hotbarUI = hotbarUI;
        this.element = null;
        this._createContainer();
        this._registerHooks();
        this.update();
    }

    _createContainer() {
        this.element = document.createElement("div");
        this.element.classList.add("effects-container");
    }

    _registerHooks() {
        // Store hook handlers as instance properties so we can remove them later
        this._createEffectHandler = (effect) => {
            const token = canvas.tokens.get(this.hotbarUI.manager.currentTokenId);
            if (token?.actor?.id === effect.parent.id) {
                this.update();
            }
        };

        this._deleteEffectHandler = (effect) => {
            const token = canvas.tokens.get(this.hotbarUI.manager.currentTokenId);
            if (token?.actor?.id === effect.parent.id) {
                this.update();
            }
        };

        this._updateEffectHandler = (effect) => {
            const token = canvas.tokens.get(this.hotbarUI.manager.currentTokenId);
            if (token?.actor?.id === effect.parent.id) {
                this.update();
            }
        };

        // Register hooks with stored handlers
        Hooks.on('createActiveEffect', this._createEffectHandler);
        Hooks.on('deleteActiveEffect', this._deleteEffectHandler);
        Hooks.on('updateActiveEffect', this._updateEffectHandler);
    }

    _createEffectIcon(effect) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("active-effect-icon");
        if (effect.disabled) {
            wrapper.classList.add("disabled");
        }
        
        wrapper.dataset.uuid = effect.uuid;
        const img = document.createElement("img");
        img.src = effect.icon;

        // Update visual state based on effect disabled state
        const updateVisualState = () => {
            if (effect.disabled) {
                wrapper.classList.add("disabled");
            } else {
                wrapper.classList.remove("disabled");
            }
        };

        // Left click to toggle
        wrapper.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Remove tooltip before toggling
            if (wrapper._hotbarTooltip) {
                wrapper._hotbarTooltip.remove();
                wrapper._hotbarTooltip = null;
            }
            await effect.update({ disabled: !effect.disabled });
            updateVisualState();
        });

        // Right click to delete with confirmation
        wrapper.addEventListener("contextmenu", async (e) => {
            e.preventDefault();
            const dialog = new Dialog({
                title: "Delete Effect",
                content: `<p>Are you sure you want to delete the effect "${effect.label}"?</p>`,
                buttons: {
                    delete: {
                        icon: '<i class="fas fa-trash"></i>',
                        label: "Delete",
                        callback: () => effect.delete()
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

        // Attach a tooltip
        wrapper.addEventListener("mouseenter", (evt) => {
            const tooltip = new EffectTooltip();
            tooltip.attach(wrapper, effect, evt);
            wrapper._hotbarTooltip = tooltip;
        });
        wrapper.addEventListener("mouseleave", () => {
            if (wrapper._hotbarTooltip && !wrapper._hotbarTooltip._pinned) {
                wrapper._hotbarTooltip.remove();
                wrapper._hotbarTooltip = null;
            }
        });
        wrapper.appendChild(img);
        return wrapper;
    }

    _updateEffectsDisplay() {
        // Clear current icons
        this.element.innerHTML = "";
        const token = canvas.tokens.get(this.hotbarUI.manager.currentTokenId);
        if (!token?.actor) return;
        
        // Show all current effects
        const currentEffects = token.actor.effects;
        
        currentEffects.forEach(effect => {
            const iconEl = this._createEffectIcon(effect);
            this.element.appendChild(iconEl);
        });
    }

    destroy() {
        // Remove hooks when destroying using stored handlers
        if (this._createEffectHandler) {
            Hooks.off('createActiveEffect', this._createEffectHandler);
        }
        if (this._deleteEffectHandler) {
            Hooks.off('deleteActiveEffect', this._deleteEffectHandler);
        }
        if (this._updateEffectHandler) {
            Hooks.off('updateActiveEffect', this._updateEffectHandler);
        }

        if (this.element?.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.hotbarUI = null;
    }

    async update() {
        this._updateEffectsDisplay();
    }
} 