// BG3 Inspired Hotbar Module - Main Entry Point

import { HotbarManager } from './managers/HotbarManager.js';
import { HotbarUI } from './components/HotbarUI.js';
import { CONFIG } from './utils/config.js';
import { ControlsManager } from './managers/ControlsManager.js';
import { AutoPopulateCreateToken, AutoPopulateDefaults } from './features/AutoPopulateCreateToken.js';
import { AutoPopulateContainer } from './features/AutoPopulateContainer.js';
import { TooltipFactory } from './tooltip/TooltipFactory.js';
import { ExtraInfosDialog, PortraitSettingDialog } from './features/ExtraInfosDialog.js';

export class BG3Hotbar {
    static manager = null;
    static controlsManager = null;
    static combatActionsArray = [];
    static macroBarTimeout = null;

    static async init() {
        // Apply custom theme
        this._applyTheme();

        // Ensure we clean up any existing manager/UI
        if (this.manager?.ui) {
            this.manager.ui.destroy();
            this.manager.ui = null;
        }
        
        // Initialize the controls manager
        this.controlsManager = new ControlsManager();
        
        // Initialize the hotbar manager
        this.manager = new HotbarManager();
        
        // Register hooks
        this._registerHooks();
        
        // Apply macrobar collapse setting immediately if it's enabled
        this._applyMacrobarCollapseSetting();

        // Log initialization
        console.log(`${CONFIG.MODULE_NAME} | Initialized`);

        // If a token is already selected, deselect it and let the hooks handle reselection
        const controlled = canvas.tokens?.controlled[0];
        if (controlled) {
            controlled.release(); // This will trigger our controlToken hook properly
        }

        // Retrieve Common Combat Actions based
        this.loadCombatActions();
    }

    static _applyTheme() {
      const theme = game.settings.get(CONFIG.MODULE_NAME, 'themeOption');
      if(theme !== 'default') {
        const themeConfig = CONFIG.THEME[theme];
        if(themeConfig) {
            const style = document.createElement('style');
            style.setAttribute('type', 'text/css');
            style.setAttribute('custom-theme', theme)
            style.textContent = Object.entries(themeConfig).map(([k, v]) => `${k} {\n${Object.entries(v).map(([k2, v2]) => `${k2}:${v2};`).join('\n')}\n}`).join('\n');
            document.head.appendChild(style);
        }
      } else if(document.head.querySelector('[custom-theme]')) {
        const currentTheme = document.head.querySelector('[custom-theme]');
        currentTheme.parentNode.removeChild(currentTheme);
      }
      console.log()
    }
    
    static _applyMacrobarCollapseSetting(msg) {
        // We need to wait for the UI to be ready before collapsing the hotbar
        if (!ui.hotbar) {
            // UI not ready, deferring macrobar collapse
            Hooks.once('renderHotbar', () => this._applyMacrobarCollapseSetting());
            return;
        }
        
        const collapseMacrobar = game.settings.get(CONFIG.MODULE_NAME, 'collapseFoundryMacrobar');
        if(collapseMacrobar !== 'full' && document.querySelector("#hotbar").style.display != 'flex') document.querySelector("#hotbar").style.display = 'flex';
        // Applying macrobar collapse setting
        if (collapseMacrobar === 'always' || collapseMacrobar === 'true') {
            ui.hotbar.collapse();
        } else if (collapseMacrobar === 'never' || collapseMacrobar === 'false') {
            ui.hotbar.expand();
        } else if(collapseMacrobar === 'select') {
            if(this.macroBarTimeout) clearTimeout(this.macroBarTimeout);
            if(!!this.manager.ui) {
                ui.hotbar.collapse();
            } else {
                this.macroBarTimeout = setTimeout(() => {
                    ui.hotbar.expand();
                }, 100);
            }
        } else if(collapseMacrobar === 'full' && document.querySelector("#hotbar").style.display != 'none') document.querySelector("#hotbar").style.display = 'none';
    }

    static async _toggleUI() {
        const currentState = game.settings.get(CONFIG.MODULE_NAME, 'uiEnabled');
        await game.settings.set(CONFIG.MODULE_NAME, 'uiEnabled', !currentState);
        
        // Update scene controls button state
        const tokenTools = ui.controls.controls.find(c => c.name === "token");
        const toggleButton = tokenTools?.tools.find(t => t.name === "toggleBG3UI");
        if (toggleButton) {
            toggleButton.active = !currentState;
            ui.controls.render();
        }
        
        // Handle UI state
        if (!currentState) {
            // Enabling UI
            if (!this.manager) {
                await this.init();
            } else if (this.manager && !this.manager.ui) {
                const controlled = canvas.tokens?.controlled[0];
                
                // Check if we have a controlled token
                if (controlled) {
                    await this.manager.updateHotbarForControlledToken(true);
                } else {
                    // No token selected, but check if deselect lock is enabled
                    const isDeselectLocked = this.controlsManager.isLockSettingEnabled('deselect') && 
                                            this.controlsManager.isMasterLockEnabled();
                    
                    // If deselect lock is enabled and we have a currentTokenId, try to restore UI
                    if (isDeselectLocked && this.manager.currentTokenId) {
                        // Force create the UI even with no token selected
                        this.manager.ui = new HotbarUI(this.manager);
                        console.log(`${CONFIG.MODULE_NAME} | Restored UI with deselect lock enabled`);
                    }
                }
            }
        } else {
            // Disabling UI
            if (this.manager?.ui) {
                this.manager.ui.destroy();
                this.manager.ui = null;
            }
        }
    }

    static _registerSettings() {
        // UI Toggle Setting (hidden from settings menu)
        game.settings.register(CONFIG.MODULE_NAME, 'uiEnabled', {
            name: "UI Enabled",
            scope: 'client',
            config: false,
            type: Boolean,
            default: true
        });

        // Register keybinding for toggling UI
        game.keybindings.register(CONFIG.MODULE_NAME, "toggleUI", {
            name: "Toggle BG3 Hotbar",
            hint: "Toggles the BG3 Inspired Hotbar UI visibility",
            editable: [{ key: "KeyH" }],
            onDown: () => {
                this._toggleUI();
            },
            restricted: false,
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
        });

        // Core UI Settings
        game.settings.register(CONFIG.MODULE_NAME, 'collapseFoundryMacrobar', {
            name: 'BG3.Settings.CollapseFoundryMacrobar.Name',
            hint: 'BG3.Settings.CollapseFoundryMacrobar.Hint',
            scope: 'client',
            config: true,
            type: String,
            choices: {
                'always': 'Always',
                'never': 'Never',
                'select': 'When Hotbar visible',
                'full': 'Fully hidden'
            },
            default: 'always',
            onChange: () => {
                // Handle the macrobar state when the setting changes
                this._applyMacrobarCollapseSetting();
            }
        });

        // Visual Settings - Appearance
        game.settings.register(CONFIG.MODULE_NAME, 'themeOption', {
            name: 'Theme options',
            hint: 'Choose between available themes',
            scope: 'client',
            config: true,
            type: String,
            choices: {
                'default': 'Default',
                'gold': 'Gold',
                'custom': 'Custom (Coming soon !)'
            },
            default: 'default',
            onChange: value => {
                if(value == 'custom') game.settings.set(CONFIG.MODULE_NAME, 'themeOption', 'default');
                this._applyTheme()
            }
        });
        
        game.settings.register(CONFIG.MODULE_NAME, 'autoScale', {
            name: 'Auto UI scale',
            hint: 'Auto scale the UI based on your browser. Disable the UI scale parameter below.',
            scope: 'client',
            config: true,
            type: Boolean,
            default: true,
            onChange: () => {
                if(this.manager?.ui) {
                    this.manager.ui.updateUIScale();
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'uiScale', {
            name: 'UI Scale',
            hint: 'Change the UI scale (50% to 300%) according to your preferences and settings.',
            scope: 'client',
            config: true,
            type: Number,
            range: {
                min: 50,
                max: 300,
                step: 5
            },
            default: 100,
            onChange: () => {
                if(this.manager?.ui && !game.settings.get(CONFIG.MODULE_NAME, 'autoScale')) {
                    this.manager.ui.updateUIScale();
                }
            }
        });

         game.settings.register(CONFIG.MODULE_NAME, 'uiPosition', {
             name: 'UI Position',
             hint: 'Choose where the hotbar should be placed.',
             scope: 'client',
             config: true,
             type: String,
             choices: {
                 'center': 'Center',
                 'left': 'Left',
                 'right': 'Right'
             },
             default: 'center',
             onChange: value => {
                if(this.manager?.ui?.element) this.manager.ui.element.dataset.position = value;
             }
         });
         
        game.settings.register(CONFIG.MODULE_NAME, "posPadding", {
            name: "UI Position - Padding",
            hint: "Space from the screen border. From the left if UI Position -> Left, From the right if UI Position -> Right",
            scope: "client",
            config: true,
            type: Number,
            default: 0,
            onChange: value => {
                if(this.manager?.ui?.element) this.manager.ui.element.style.setProperty('--position-padding', `${value}px`);
            },
        });
         
        game.settings.register(CONFIG.MODULE_NAME, "posPaddingBottom", {
            name: "UI Position - Bottom",
            hint: "Space from the bottom of the screen.",
            scope: "client",
            config: true,
            type: Number,
            default: 10,
            onChange: value => {
                if(this.manager?.ui?.element) this.manager.ui.element.style.setProperty('--position-bottom', `${value}px`);
            },
        });

        game.settings.register(CONFIG.MODULE_NAME, 'normalOpacity', {
            name: 'BG3.Settings.NormalOpacity.Name',
            hint: 'BG3.Settings.NormalOpacity.Hint',
            scope: 'client',
            config: true,
            type: Number,
            range: {
                min: 0.1,
                max: 1.0,
                step: 0.1
            },
            default: 1.0,
            onChange: value => {
                if (this.manager?.ui) {
                    this.manager.ui.updateOpacity();
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'fadedOpacity', {
            name: 'BG3.Settings.FadedOpacity.Name',
            hint: 'BG3.Settings.FadedOpacity.Hint',
            scope: 'client',
            config: true,
            type: Number,
            range: {
                min: 0.0,
                max: 1,
                step: 0.1
            },
            default: 1,
            onChange: value => {
                if (this.manager?.ui) {
                    this.manager.ui.updateOpacity();
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'fadeOutDelay', {
            name: 'BG3.Settings.FadeOutDelay.Name',
            hint: 'BG3.Settings.FadeOutDelay.Hint',
            scope: 'client',
            config: true,
            type: Number,
            range: {
                min: 1,
                max: 30,
                step: 1
            },
            default: 5,
            onChange: value => {
                // Update the UI fade delay when the setting changes
                if (this.manager?.ui) {
                    this.manager.ui.updateFadeDelay();
                }
            }
        });
      
        game.settings.register(CONFIG.MODULE_NAME, 'autoHideCombat', {
          name: 'Hide UI when not in combat and show only on your turn',
          // hint: 'Display a extra container to for basic actions like dodge, dash, etc (Compatible with CPR)',
          scope: 'client',
          config: true,
          type: Boolean,
          default: false,
          onChange: value => {
            if(!value) document.getElementById("toggle-input").checked = false;
            else BG3Hotbar._onUpdateCombat(true);
          }
        });

        // Portrait Settings        
        game.settings.registerMenu(CONFIG.MODULE_NAME, "menuPortrait", {
            name: 'Portrait settings',
            label: 'Configure Portrait',
            hint: 'Advanced settings for character portrait.',
            icon: "fas fa-cogs",
            type: PortraitSettingDialog,
        });

        game.settings.register(CONFIG.MODULE_NAME, 'defaultPortraitPreferences', {
            name: 'BG3.Settings.DefaultPortraitPreferences.Name',
            hint: 'BG3.Settings.DefaultPortraitPreferences.Hint',
            scope: 'client',
            config: false,
            type: String,
            choices: {
                'token': 'BG3.Settings.DefaultPortraitPreferences.Token',
                'portrait': 'BG3.Settings.DefaultPortraitPreferences.Portrait'
            },
            default: 'token',
            onChange: () => {
                // Refresh UI if it exists
                if (this.manager?.ui?.portraitCard) {
                    this.manager.ui.portraitCard.loadImagePreference();
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'shapePortraitPreferences', {
            name: 'BG3.Settings.ShapePortraitPreferences.Name',
            hint: 'BG3.Settings.ShapePortraitPreferences.Hint',
            scope: 'client',
            config: false,
            type: String,
            choices: {
                'round': 'BG3.Settings.ShapePortraitPreferences.Round',
                'square': 'BG3.Settings.ShapePortraitPreferences.Square'
            },
            default: 'round',
            onChange: value => {
                // Refresh UI if it exists
                if (this.manager?.ui?.portraitCard?.element) {
                    this.manager.ui.portraitCard.element.setAttribute("data-shape", value);
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'borderPortraitPreferences', {
            name: 'BG3.Settings.BorderPortraitPreferences.Name',
            hint: 'BG3.Settings.BorderPortraitPreferences.Hint',
            scope: 'client',
            config: false,
            type: String,
            choices: {
                'none': 'BG3.Settings.BorderPortraitPreferences.None',
                'simple': 'BG3.Settings.BorderPortraitPreferences.Simple',
                'styled': 'BG3.Settings.BorderPortraitPreferences.Styled'
            },
            default: 'none',
            onChange: value => {
                // Refresh UI if it exists
                if (this.manager?.ui?.portraitCard?.element) {
                    this.manager.ui.portraitCard.element.setAttribute("data-border", value);
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'backgroundPortraitPreferences', {
            name: 'BG3.Settings.BackgroundPortraitPreferences.Name',
            hint: 'BG3.Settings.BackgroundPortraitPreferences.Hint',
            scope: 'client',
            config: false,
            type: String,
            default: '',
            onChange: value => {
                // Refresh UI if it exists
                if (this.manager?.ui?.portraitCard?.element) {
                    this.manager.ui.portraitCard.element.style.setProperty('--img-background-color', (value && value != '' ? value : 'transparent'));
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'hidePortraitImage', {
            name: 'Hide Portrait Image',
            hint: 'Also hide health overlay and text.',
            scope: 'client',
            config: false,
            type: Boolean,
            default: true,
            onChange: value => {
              if(BG3Hotbar.manager.ui.portraitCard) {
                BG3Hotbar.manager.ui.portraitCard.element.classList.toggle('portrait-hidden', !value);
              }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'overlayModePortrait', {
            name: 'BG3.Settings.OverlayModePortrait.Name',
            hint: 'BG3.Settings.OverlayModePortrait.Hint',
            scope: 'client',
            config: false,
            type: Boolean,
            default: false,
            onChange: value => {
                // Refresh UI if it exists
                if (this.manager?.ui?.portraitCard?.element) {
                    const imageContainer = document.getElementsByClassName('portrait-image-subcontainer');
                    if(imageContainer[0]) imageContainer[0].setAttribute('data-bend-mode', value);
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'showSheetSimpleClick', {
            name: 'Open character sheet on click',
            hint: 'Open the character sheet with a single click on portrait instead of double click.',
            scope: 'client',
            config: false,
            type: Boolean,
            default: false
        });

        game.settings.register(CONFIG.MODULE_NAME, 'showHealthOverlay', {
          name: 'Show health overlay on character portrait.',
          // hint: 'Display a extra container to for basic actions like dodge, dash, etc (Compatible with CPR)',
          scope: 'client',
          config: false,
          type: Boolean,
          default: true,
          onChange: value => {
            /* if(BG3Hotbar.manager.ui.portraitCard) {
                const actor = canvas.tokens.get(BG3Hotbar.manager.currentTokenId)?.actor;
                BG3Hotbar.manager.ui.portraitCard.update(actor);
            } */
            if(BG3Hotbar.manager.ui.portraitCard) {
                const overlay = document.getElementsByClassName('health-overlay');
                if(overlay && overlay[0]) overlay[0].classList.toggle('hidden', !value)
            }
          }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'showHPText', {
          name: 'Show HP text on character portrait.',
          // hint: 'Display a extra container to for basic actions like dodge, dash, etc (Compatible with CPR)',
          scope: 'client',
          config: false,
          type: Boolean,
          default: true,
          onChange: value => {
            if(BG3Hotbar.manager.ui.portraitCard) {
                const text = document.getElementsByClassName('hp-text');
                if(text && text[0]) text[0].classList.toggle('hidden', !value)
            }
          }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'showExtraInfo', {
          name: 'Show extra datas on character portrait.',
          // hint: 'Display a extra container to for basic actions like dodge, dash, etc (Compatible with CPR)',
          scope: 'client',
          config: false,
          type: Boolean,
          default: false,
          onChange: value => {
            if(BG3Hotbar.manager.ui.portraitCard) {
                const actor = canvas.tokens.get(BG3Hotbar.manager.currentTokenId)?.actor;
                BG3Hotbar.manager.ui.portraitCard.update(actor);
            }
          }
        });
        
        game.settings.register(CONFIG.MODULE_NAME, "dataExtraInfo", {
            scope: "client",
            config: false,
            type: Array,
            default: CONFIG.EXTRAINFOS ?? [],
            onChange: () => {
                if(BG3Hotbar.manager?.ui?.portraitCard) {
                    const token = canvas.tokens.get(this.manager.currentTokenId);
                    if (token) BG3Hotbar.manager.ui.portraitCard.update(token.actor)
                };
            },
        });
        
        game.settings.registerMenu(CONFIG.MODULE_NAME, "menuExtraInfo", {
            name: 'Portrait extra datas settings',
            label: 'Configure Portait Extra Datas',
            hint: 'Extra datas to show on character portrait.',
            icon: "fas fa-cogs",
            type: ExtraInfosDialog,
        });

        game.settings.register(CONFIG.MODULE_NAME, 'showItemNames', {
            name: 'Show Item Names',
            hint: 'Display item names below each hotbar item',
            scope: 'client',
            config: true,
            type: Boolean,
            default: false,
            onChange: () => {
                if (this.manager?.ui) {
                    this.manager.ui.render();
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'showItemUses', {
            name: 'Show Item Uses',
            hint: 'Display remaining uses in the top-right corner of items',
            scope: 'client',
            config: true,
            type: Boolean,
            default: true,
            onChange: () => {
                if (this.manager?.ui) {
                    this.manager.ui.render();
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'highlightStyle', {
            name: game.i18n.localize('BG3.Settings.HighlightStyle.Name'),
            hint: game.i18n.localize('BG3.Settings.HighlightStyle.Hint'),
            scope: 'client',
            config: true,
            type: String,
            choices: {
                'bottom': game.i18n.localize('BG3.Settings.HighlightStyle.Bottom'),
                'border': game.i18n.localize('BG3.Settings.HighlightStyle.Border')
            },
            default: 'border',
            onChange: value => {
                if(this.manager?.ui?.element) this.manager.ui.element.classList.toggle('cell-bottom-highlight', value === 'bottom');
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'fadeControlsMenu', {
            name: 'Hide/Show hotbar controls menu on hover',
            // hint: 'Display remaining uses in the top-right corner of items',
            scope: 'client',
            config: true,
            type: Boolean,
            default: false,
            onChange: value => {
                if (this.manager?.ui?.controlsContainer) {
                    this.manager.ui.controlsContainer.element.classList.toggle('fade', value);
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'showRestTurnButton', {
            name: 'BG3.Settings.ShowRestTurnButton.Name',
            hint: 'BG3.Settings.ShowRestTurnButton.Hint',
            scope: 'client',
            config: true,
            type: Boolean,
            default: true,
            onChange: () => {
                if (this.manager?.ui?.restTurnContainer) {
                    this.manager.ui.restTurnContainer.render();
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'showCombatContainer', {
            name: 'Add a basic actions container',
            hint: 'Display a extra container for basic actions like dodge, dash, etc (Compatible with CPR)',
            scope: 'client',
            config: true,
            type: Boolean,
            default: true,
            onChange: value => {
              if (this.manager?.ui?.combatContainer[0]?.element) this.manager.ui.combatContainer[0].element.classList.toggle('hidden', !value);
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'autoPopulateCombatContainer', {
            name: 'Autopopulate the basic actions container',
            hint: 'Auto-populate the basic actions with dodge, dash, etc (Compatible with CPR). Disable this will unlock the container.',
            scope: 'client',
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(CONFIG.MODULE_NAME, 'lockCombatContainer', {
            name: 'Lock the basic actions container',
            hint: 'Prevent users for removing the basic actions for the container.',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true,
            onChange: value => {
                if (this.manager?.ui?.combatContainer) {
                    this.manager.ui.combatContainer[0].data.locked = value;
                    // this.manager.ui.combatContainer[0].render();
                }
            }
        });

        // Tooltip Settings
        game.settings.register(CONFIG.MODULE_NAME, 'tooltipDelay', {
            name: 'BG3.Settings.TooltipDelay.Name',
            hint: 'BG3.Settings.TooltipDelay.Hint',
            scope: 'client',
            config: true,
            type: Number,
            range: {
                min: 0,
                max: 2000,
                step: 100
            },
            default: 500,
            onChange: value => {
                // Update the tooltip delay in the config
                CONFIG.TOOLTIP_DELAY = value;
                // Tooltip delay changed
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'showMaterialDescription', {
            name: 'BG3.Settings.ShowMaterialDescription.Name',
            hint: 'BG3.Settings.ShowMaterialDescription.Hint',
            scope: 'client',
            config: true,
            type: Boolean,
            default: false,
            onChange: () => {
                // Force refresh of any open tooltips
                if (this.manager?.ui) {
                    this.manager.ui.render();
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'showDamageRanges', {
            name: 'BG3.Settings.ShowDamageRanges.Name',
            hint: 'BG3.Settings.ShowDamageRanges.Hint',
            scope: 'client',
            config: true,
            type: Boolean,
            default: false,
            onChange: () => {
                if (this.manager?.ui) {
                    this.manager.ui.render();
                }
            }
        });

        // Spell Preparation Settings
        game.settings.register(CONFIG.MODULE_NAME, 'enforceSpellPreparationPC', {
            name: 'BG3.Settings.EnforceSpellPreparationPC.Name',
            hint: 'BG3.Settings.EnforceSpellPreparationPC.Hint',
            scope: 'client',
            config: true,
            type: Boolean,
            default: true,
            onChange: () => {
                if (this.manager?.ui) {
                    this.manager.ui.render();
                }
            }
        });

        game.settings.register(CONFIG.MODULE_NAME, 'enforceSpellPreparationNPC', {
            name: 'BG3.Settings.EnforceSpellPreparationNPC.Name',
            hint: 'BG3.Settings.EnforceSpellPreparationNPC.Hint',
            scope: 'client',
            config: true,
            type: Boolean,
            default: false,
            onChange: () => {
                if (this.manager?.ui) {
                    this.manager.ui.render();
                }
            }
        });

        // Auto-Population Settings
        game.settings.register(CONFIG.MODULE_NAME, 'autoPopulateLinkedTokens', {
            name: 'Auto-Populate Linked Tokens',
            hint: 'Automatically populate the hotbar for newly created linked tokens based on the settings below',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(CONFIG.MODULE_NAME, 'autoPopulateUnlinkedTokens', {
            name: 'BG3.Settings.AutoPopulateUnlinkedTokens.Name',
            hint: 'BG3.Settings.AutoPopulateUnlinkedTokens.Hint',
            scope: 'world',
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.register(CONFIG.MODULE_NAME, 'container1AutoPopulate', {
            name: 'BG3.Settings.Container1AutoPopulate.Name',
            hint: 'BG3.Settings.Container1AutoPopulate.Hint',
            scope: 'world',
            config: false,
            type: Array,
            default: ["weapon", "feat"],
        });

        game.settings.register(CONFIG.MODULE_NAME, 'container2AutoPopulate', {
            name: 'BG3.Settings.Container2AutoPopulate.Name',
            hint: 'BG3.Settings.Container2AutoPopulate.Hint',
            scope: 'world',
            config: false,
            type: Array,
            default: ["spell"],
        });

        game.settings.register(CONFIG.MODULE_NAME, 'container3AutoPopulate', {
            name: 'BG3.Settings.Container3AutoPopulate.Name',
            hint: 'BG3.Settings.Container3AutoPopulate.Hint',
            scope: 'world',
            config: false,
            type: Array,
            default: ["consumable"],
        });

        game.settings.register(CONFIG.MODULE_NAME, 'noActivityAutoPopulate', {
            name: 'Allow passives for auto-populate',
            hint: 'If activated, passives will be also added to hotbars.',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false,
        });

        // Register the chip selector menu item
        game.settings.registerMenu(CONFIG.MODULE_NAME, 'containerAutoPopulateSettings', {
            name: game.i18n.localize('BG3.Settings.ContainerAutoPopulate.Name'),
            label: game.i18n.localize('BG3.Settings.ContainerAutoPopulate.Configure'),
            icon: 'fas fa-tags',
            type: AutoPopulateDefaults,
            restricted: true
        });

        // Lock System Settings
        game.settings.register(CONFIG.MODULE_NAME, 'lockSettings', {
            name: 'BG3.Settings.LockSettings.Name',
            hint: 'BG3.Settings.LockSettings.Hint',
            scope: 'client',
            config: false,
            type: Object,
            default: {
                deselect: false,
                opacity: false,
                dragDrop: false
            }
        });
        
        game.settings.register(CONFIG.MODULE_NAME, 'masterLockEnabled', {
            name: 'Master Lock State',
            hint: 'Whether the master lock is enabled',
            scope: 'client',
            config: false,
            type: Boolean,
            default: false
        });

        // Storage Settings
        game.settings.register(CONFIG.MODULE_NAME, 'selectedPassivesByActor', {
            scope: 'client',
            config: false,
            type: Object,
            default: {}
        });
    }

    static _registerHooks() {
        // Add Categories to module settings
        Hooks.on("renderSettingsConfig", (app, html, data) => {
            $('<div>').addClass('form-group group-header').html(game.i18n.localize("BG3.Settings.SettingsCategories.Global")).insertBefore($('[name="bg3-inspired-hotbar.collapseFoundryMacrobar"]').parents('div.form-group:first'));
            $('<div>').addClass('form-group group-header').html(game.i18n.localize("BG3.Settings.SettingsCategories.CombatContainer")).insertBefore($('[name="bg3-inspired-hotbar.showCombatContainer"]').parents('div.form-group:first'));
            $('<div>').addClass('form-group group-header').html(game.i18n.localize("BG3.Settings.SettingsCategories.Tooltip")).insertBefore($('[name="bg3-inspired-hotbar.tooltipDelay"]').parents('div.form-group:first'));
            $('<div>').addClass('form-group group-header').html(game.i18n.localize("BG3.Settings.SettingsCategories.AutoPopulating")).insertBefore($('[name="bg3-inspired-hotbar.enforceSpellPreparationPC"]').parents('div.form-group:first'));
            $('<div>').addClass('form-group group-header').html(game.i18n.localize("BG3.Settings.SettingsCategories.HotbarContainer")).insertBefore($('[name="bg3-inspired-hotbar.showItemNames"]').parents('div.form-group:first'));

            $('button[data-key="bg3-inspired-hotbar.menuExtraInfo"]').parents('div.form-group:first').insertAfter($('[name="bg3-inspired-hotbar.autoHideCombat"]').parents('div.form-group:first'));
            $('button[data-key="bg3-inspired-hotbar.containerAutoPopulateSettings"]').parents('div.form-group:first').insertAfter($('[name="bg3-inspired-hotbar.autoPopulateUnlinkedTokens"]').parents('div.form-group:first'));
            $('button[data-key="bg3-inspired-hotbar.menuPortrait"]').parents('div.form-group:first').insertAfter($('[name="bg3-inspired-hotbar.autoHideCombat"]').parents('div.form-group:first'));
            
            $('<div>').addClass('form-group group-header').html(game.i18n.localize("BG3.Settings.SettingsCategories.Portrait")).insertBefore($('button[data-key="bg3-inspired-hotbar.menuPortrait"]').parents('div.form-group:first'));
        });

        // Canvas and token control hooks
        Hooks.on("canvasReady", async () => {
            if (this.manager) {
                // When canvas is ready, check for selected token
                const controlled = canvas.tokens?.controlled[0];
                if (controlled) {
                    await this.manager.updateHotbarForControlledToken(true);
                } else {
                    // Clean up UI if no token is selected
                    if (this.manager.ui) {
                        this.manager.ui.destroy();
                        this.manager.ui = null;
                    }
                }
            }
        });

        Hooks.on("controlToken", async (token, controlled) => {
            if (!this.manager) return;
            
            // Check if UI is enabled in settings
            const isUIEnabled = game.settings.get(CONFIG.MODULE_NAME, 'uiEnabled');
            if (!isUIEnabled) return;
            
            if (!controlled) {
                // Token was deselected, clean up UI if not locked
                const isDeselectLocked = this.controlsManager.isLockSettingEnabled('deselect') && 
                                        this.controlsManager.isMasterLockEnabled();
                if (this.manager.ui && !isDeselectLocked) {
                    this.manager.ui.destroy();
                    this.manager.ui = null;
                    this.manager.currentTokenId = null;
                }
                this._applyMacrobarCollapseSetting('hide');
                return;
            }
            
            // Token was selected, update or create UI
            if (!this.manager.ui) {
                // UI doesn't exist but should (UI is enabled and token selected)
                await this.manager.updateHotbarForControlledToken(true);
            } else {
                // UI exists, just update it
                await this.manager.updateHotbarForControlledToken();
            }
            this._applyMacrobarCollapseSetting('show');
        });

        // Token creation hook for auto-populating unlinked tokens
        Hooks.on("createToken", async (token) => {
            if (!token?.actor) return;

            await AutoPopulateCreateToken.populateUnlinkedToken(token);
        });

        // Actor updates
        Hooks.on("updateActor", async (actor, changes, options, userId) => {
            if(!this.manager) return;
            
            if(changes?.flags?.[CONFIG.MODULE_NAME] && game.user.id !== userId) this.manager.socketUpdateData(actor, changes);
            
            if (game.user.id !== userId) return;
            
            // Check if this update affects our current token
            const token = canvas.tokens.get(this.manager.currentTokenId);
            if (!token || token.actor?.id !== actor.id) return;
            
            // Update UI components
            if (this.manager.ui) {
                // Update portrait card for any actor changes
                if (this.manager.ui.portraitCard) {
                    this.manager.ui.portraitCard.update(actor);
                }
                
                // Update filter container for spell slot changes
                if (changes.system?.spells && this.manager.ui.filterContainer) {
                    this.manager.ui.filterContainer.render();
                }
                
                // Update passives container if items changed
                if (changes.items && this.manager.ui.passivesContainer) {
                    await this.manager.ui.passivesContainer.update();
                }
                
                // Let ItemUpdateManager handle item changes
                if (changes.items || changes.system?.spells) {
                    await this.manager.itemManager.cleanupInvalidItems(actor);
                }
            }
        });

        // Item creation/deletion/updates are now handled by ItemUpdateManager
        
        // Token deletion
        Hooks.on("deleteToken", async (scene, tokenData) => {
            if (!this.manager) return;

            const token = canvas.tokens.get(tokenData._id);
            const isPlayerCharacter = token?.actor?.hasPlayerOwner;
            const isCurrentToken = tokenData._id === this.manager.currentTokenId;
            const isLocked = this.controlsManager.isLockSettingEnabled('deselect') && 
                            this.controlsManager.isMasterLockEnabled();

            // Only clean up data if:
            // 1. It's an unlinked token, OR
            // 2. It's the current token AND either:
            //    - It's not a player character, OR
            //    - It's not locked
            if (!token?.actorLink || (isCurrentToken && (!isPlayerCharacter || !isLocked))) {
                await this.manager.cleanupTokenData(tokenData._id);
            }

            // Handle UI cleanup based on token type and current status
            if (isCurrentToken) {
                // Only clear currentTokenId if it's not a locked player character
                if (!isPlayerCharacter || !isLocked) {
                    this.manager.currentTokenId = null;
                    
                    if (this.manager.ui) {
                        this.manager.ui.destroy();
                        this.manager.ui = null;
                    }
                    await this.manager.updateHotbarForControlledToken();
                }
            }
        });

        // Token updates
        Hooks.on("updateToken", async (token, changes, options, userId) => {
            if (!this.manager || game.user.id !== userId) return;
            
            // If this is our current token and actor-related data changed
            if (token.id === this.manager.currentTokenId && 
                (changes.actorId || changes.actorData || changes.actorLink)) {
                await this.manager.updateHotbarForControlledToken();
            }
        });

        // Scene deletion
        Hooks.on("deleteScene", async (scene) => {
            if (!this.manager) return;

            // Clean up data for unlinked tokens in the scene
            for (const tokenData of scene.tokens) {
                const token = canvas.tokens.get(tokenData._id);
                if (token && !token.actorLink) {
                    await this.manager.cleanupTokenData(tokenData._id);
                }
            }

            // If the current token was in this scene, update the UI
            const token = canvas.tokens.get(this.manager.currentTokenId);
            if (token && token.scene.id === scene.id) {
                this.manager.currentTokenId = null;
                await this.manager.updateHotbarForControlledToken();
            }
        });

        // Add combat turn update hooks
        Hooks.on("updateCombat", (combat, changed, options, userId) => {
            
            this._onUpdateCombat(combat, changed);
            
            // Only process if the turn actually changed
            if (!foundry.utils.hasProperty(changed, "turn") && !foundry.utils.hasProperty(changed, "round")) return;
            
            // Handle the turn update in the filter container
            if (!this.manager?.ui?.filterContainer) return;
            this.manager.ui.filterContainer.handleCombatTurnUpdate();
        });

        // Handle combat start
        Hooks.on("combatStart", (combat) => {
            if (!this.manager?.ui?.filterContainer) return;
            this.manager.ui.filterContainer.handleCombatTurnUpdate();
        });

        // Handle when combat is actually deleted/removed
        Hooks.on("deleteCombat", (combat) => {
            this.manager?.ui?.combat?.forEach((component) => component.updateVisibility());
            if (game.settings.get(CONFIG.MODULE_NAME, 'autoHideCombat')) BG3Hotbar.manager.ui?.toggleUI(false);
            if (!this.manager?.ui?.filterContainer) return;
            this.manager.ui.filterContainer.resetUsedActions();
        });

        // Initialize the module when ready
        Hooks.once('ready', async () => {
            // Module is ready
            Handlebars.registerHelper({

            });
        });
    }

    static async _autoPopulateTokenHotbar(token) {
        if (!token?.actor) return;

        try {
            // Get settings for each container
            const container1Setting = game.settings.get(CONFIG.MODULE_NAME, 'container1AutoPopulate');
            const container2Setting = game.settings.get(CONFIG.MODULE_NAME, 'container2AutoPopulate');
            const container3Setting = game.settings.get(CONFIG.MODULE_NAME, 'container3AutoPopulate');

            // Create a temporary hotbar manager for this token if it's not the current one
            let tempManager = null;
            let useCurrentManager = false;

            if (this.manager && this.manager.currentTokenId === token.id) {
                useCurrentManager = true;
            } else {
                tempManager = new HotbarManager();
                tempManager.currentTokenId = token.id;
                await tempManager._loadTokenData();
            }

            const manager = useCurrentManager ? this.manager : tempManager;

            // Process each container
            await AutoPopulateCreateToken._populateContainerWithSettings(token.actor, manager, 0, container1Setting);
            await AutoPopulateCreateToken._populateContainerWithSettings(token.actor, manager, 1, container2Setting);
            await AutoPopulateCreateToken._populateContainerWithSettings(token.actor, manager, 2, container3Setting);

            // Save the changes
            if (manager) {
                await manager.persist();
            }

            // Clean up temporary manager
            if (tempManager) {
                tempManager = null;
            }

            ui.notifications.info(`Auto-populated hotbar for token: ${token.name}`);
        } catch (error) {
            console.error("BG3 Inspired Hotbar | Error auto-populating token hotbar:", error);
            ui.notifications.error(`Error auto-populating token hotbar: ${error.message}`);
        }
    }

    static async _populateContainer(actor, manager, containerIndex, settingValue) {
        const container = manager.containers[containerIndex];
        if (!container) return;

        await AutoPopulateContainer.populateContainer(actor, container, settingValue);
    }

    static async _populateRemainingItems(actor, manager, containerIndex, items) {
        const container = manager.containers[containerIndex];
        if (!container) return;

        await AutoPopulateContainer.populateContainer(actor, container, items.map(item => item.type));
    }

    static _registerMacroDragDrop() {
        // Add drag drop capability for macros
        if (!game.macros.directory?.dragDrop) return;

        game.macros.directory.dragDrop.push({
            dragSelector: ".macro",
            dropSelector: ".hotbar-cell",
            permissions: {
                dragstart: () => true,
                drop: () => true
            },
            callbacks: {
                dragstart: (event) => {
                    const macro = game.macros.get(event.currentTarget.dataset.documentId);
                    if (!macro) {
                        console.warn("Could not find macro from element:", event.currentTarget);
                        return;
                    }
                    event.dataTransfer.setData("text/plain", JSON.stringify({
                        type: "Macro",
                        uuid: macro.uuid,
                        id: macro.id,
                        data: {
                            name: macro.name,
                            img: macro.img
                        }
                    }));
                },
                drop: (event) => {
                    try {
                        const data = JSON.parse(event.dataTransfer.getData("text/plain"));
                        return data.type === "Macro" && (data.uuid?.startsWith("Macro.") || game.macros.has(data.id));
                    } catch {
                        return false;
                    }
                }
            }
        });
    }

    static async _onStartCombat(combat) {
      // Token was selected, update or create UI
      if (!this.manager.ui) {
          // UI doesn't exist but should (UI is enabled and token selected)
          await this.manager.updateHotbarForControlledToken(true);
      } else {
          // UI exists, just update it
          await this.manager.updateHotbarForControlledToken();
      }
    }

    static async _onUpdateCombat(combat, updates) {
        this.manager?.ui?.combat?.forEach((component) => component.updateVisibility());
        if (combat === true || "round" in updates || "turn" in updates) {
          if (game.settings.get(CONFIG.MODULE_NAME, 'autoHideCombat')) {
            const actor = canvas.tokens.get(BG3Hotbar.manager.currentTokenId)?.actor;
            BG3Hotbar.manager.ui?.toggleUI(!!game.combat?.started && game.combat?.combatant?.actor === actor);
          }
        }
        if (updates && updates.round === 1 && updates.turn === 0) this._onStartCombat(combat);
    }

    static async loadCombatActions() {
        if (!game.modules.get("chris-premades")?.active) return;
        let pack = game.packs.get("chris-premades.CPRActions"),
            promises = [];
        Object.entries(CONFIG.COMBATACTIONDATA).forEach(([key, value]) => {
            let macroID = pack.index.find(t =>  t.type == 'feat' && t.name === value.name)._id;
            if(macroID) {
                promises.push(new Promise(async (resolve, reject) => {
                    let item = await pack.getDocument(macroID);
                    if(item) this.combatActionsArray.push(item)
                    resolve();
                }))
            }
        })
        await Promise.all(promises).then((values) => {})
    }
}

// Initialize the module when Foundry is ready
Hooks.once('ready', async () => {
    // Wait for canvas and UI to be ready
    if (!canvas || !canvas.ready) {
        Hooks.once('canvasReady', () => BG3Hotbar.init());
        return;
    }
    await BG3Hotbar.init();
});


Hooks.on('getSceneControlButtons', (controls) => {
    const tokenTools = controls.find(c => c.name === "token");
    if (!tokenTools) return;

    const isActive = game.settings.get(CONFIG.MODULE_NAME, 'uiEnabled') ?? true;
    
    tokenTools.tools.push({
        name: "toggleBG3UI",
        title: "Toggle BG3 Hotbar",
        icon: "fas fa-gamepad",
        toggle: true,
        active: isActive,
        onClick: () => BG3Hotbar._toggleUI()
    });
});