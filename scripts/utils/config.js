// Configuration constants for the BG3 Hotbar

export const CONFIG = {
    // UI Constants
    CELL_SIZE: 50,
    INITIAL_COLS: 5,
    ROWS: 3,
    DRAG_THRESHOLD: 40, // 80% of cell width
    TOOLTIP_DELAY: 500, // Default tooltip delay in ms

    CONTAINERSDATA: {
        hotbar: {
            count: 3,
            config: {
                get cols() { return CONFIG.INITIAL_COLS},
                get rows() { return CONFIG.ROWS},
                items: {}
            }
        },
        weapon: {
            count: 3,
            config: {
                cols: 2,
                rows: 1,
                items: {},
                type: 'label',
                for: 'weapon-set',
                // size: 1.5,
                delOnly: true,
                allowDuplicate: true,
                type: 'label',
                class: ['bg3-weapon-set']
            }
        },
        combat: {
            count: 1,
            config: {
                cols: 2,
                rows: 3,
                items: {},
                class: ['bg3-combat-container']
                // size: 1.5,
                // locked: !!game.settings.get(CONFIG.MODULE_NAME, 'lockCombatContainer')
            }
        }
    },
    
    // Z-Index Layers
    Z_INDEX: {
        BACKGROUND: {
            PORTRAIT: 1,
            PORTRAIT_OVERLAY: 2
        },
        MAIN: {
            GRID_CONTAINER: 20,
            GRID_CELLS: 21,
            DRAG_BARS: 22
        },
        OVERLAY: {
            TOGGLE_BUTTONS: 25,
            TOOLTIPS: 30,
            CONTEXT_MENU: 35,
            SPELL_CARD: 24,
            ABILITY_CARD: 24,
            FEATURES_CARD: 73,
            TOOLTIP: 9999999999,
            PORTRAIT_TOGGLE: 90,
            ACTION_CARD: 80,
            PORTRAIT_CARD: 70,
            SETTINGS_MENU: 110,
            SETTINGS_WINDOW: 120,
            FILTER_CONTAINER: 100
        },
        BASE: 70
    },
    
    // State Management
    FLAG_NAME: "hotbarConfig",
    MODULE_NAME: "bg3-inspired-hotbar",
    // PATHs
    get COMPONENTS_PATH() { return `modules/${CONFIG.MODULE_NAME}/templates/components/`},
    
    // Styling
    COLORS: {
        ACTION: "#2ecc71",     // vibrant green
        BONUS: "#e67e22",      // vibrant orange
        REACTION: "#fe85f6",   // vibrant lavender
        DEFAULT: "#cccccc",
        PACT_MAGIC: "#8e44ad", // deep purple
        SPELL_SLOT: "#3498db",
        CANTRIP: "#27ae60",    // deep green
        PROFICIENT: "#4da6ff", // blue (same as spell slot)
        BACKGROUND: "#1e1e1e",
        BACKGROUND_LIGHT: "#2e2e2e",
        BACKGROUND_HIGHLIGHT: "#3e3e3e",
        BACKGROUND_ACTIVE: "#4e4e4e",
        // BORDER: "#444444",
        TEXT: {
            PRIMARY: "#dddddd",
            SECONDARY: "#999999"
        },
        FEATURE_HIGHLIGHT: "#d35400",  // deeper orange for features
        FEATURES: {
            class: "#7b68ee",      // Medium Slate Blue
            race: "#20b2aa",       // Light Sea Green
            background: "#daa520",  // Goldenrod
            feat: "#ff6347",       // Tomato
            monster: "#4682b4",    // Steel Blue
            subclass: "#9370db",   // Medium Purple
            default: "#808080"     // Gray for unknown types
        }
    },

    EXTRAINFOS: [
        {attr: 'attributes.ac.value', icon: 'fas fa-shield', color: '#5abef5', pos: 'Top Left'},
        {attr: 'attributes.spell.dc', icon: 'fas fa-book-open', color: '#af68d5', pos: 'Top Right'},
        {attr: '', icon: '', color: '', pos: 'Left'},
        {attr: '', icon: '', color: '', pos: 'Right'},
        {attr: '', icon: '', color: '', pos: 'Bottom Left'},
        {attr: '', icon: '', color: '', pos: 'Bottom Right'}
    ],

    // Themes
    THEME: {
        gold: {
            ":root": {
                "--primary-border-width": "2px",
                "--primary-border-color": "#b78846",
                "--bg3-border": "#161616",
                "--shadow-text-stroke": "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                "--bg3-portrait-size": "175px"
            },
            "img": {
                border: "unset"
            },
            ".bg3-hud .bg3-hotbar-subcontainer": {
                padding: "2px 6px"
            },
            ".bg3-hud .hotbar-subcontainer": {
                width: "var(--cols-override, calc(var(--cols) * (var(--cell-size) + 1px) + 8px))",
                background: "#222222f2",
                gap: "1px"
            },
            ".bg3-hud .passives-container, .bg3-hud .effects-container": {
                bottom: "calc(100% + var(--primary-border-width))",
                top: "unset",
                background: "unset",
                border: "unset",
                padding: "0",
                gap: "0"
            },
            ".bg3-hud .passive-feature-icon img, .bg3-hud .active-effect-icon img": {
                width: "36px",
                height: "36px",
                border: "1px solid var(--color-border-dark)",
                "background-color": "var(--bg3-background)"
            },
            ".bg3-hud .filter-container": {
                bottom: "calc(100% - 5px)"
            },
            ".bg3-hud .hotbar-cell": {
                width: "var(--cell-size)",
                height: "var(--cell-size)"
            },
            ".bg3-hud .hotbar-item-uses": {
                "text-shadow": "var(--shadow-text-stroke)"
            },
            ".bg3-hud .hotbar-item": {
                "object-fit": "contain",
                width: "100%",
                height: "100%"
            },
            ".bg3-hud .hotbar-control-column": {
                left: "calc(100% + -7px)"
            },
            ".bg3-hud .hotbar-control-button": {
                "border-radius": "50%"
            },
            ".bg3-hud .hotbar-control-button, .bg3-hud .rest-turn-button, .bg3-hud .bg3-weapon-container .hotbar-cell, #bg3-combat-container": {
                border: "var(--primary-border-width) solid var(--primary-border-color)"
            },
            ".bg3-hud .rest-turn-container": {
                "margin-left": "20px",
                "min-height": "168px"
            },
            ".bg3-hud .damage-overlay": {
                top: "unset",
                bottom: "0",
                "border-radius": "unset"
            },
            ".bg3-hud .hp-text": {
                bottom: "25px",
                "z-index": "20",
                "text-shadow": "var(--shadow-text-stroke)"
            },
            ".bg3-hud .portrait-card .extra-info": {
                "text-shadow": "var(--shadow-text-stroke)"
            },
            ".bg3-hud .ability-button": {
                width: "40px",
                height: "40px",
                "font-size": "var(--font-size-20)",
                top: "-20px"
            },
            ".bg3-hud .spell-level-label": {
                "text-shadow": "var(--shadow-text-stroke)"
            },
            ".bg3-hud .action-type-button, .bg3-hud .feature-button, .bg3-hud .spell-level-button": {
                "box-shadow": "0px 0px 5px black"
            }
        },
        custom: []
    },

    COMBATACTIONDATA: {
        "0-0": {
            "uuid": null,
            "name": "Grapple",
            "icon": "icons/magic/control/buff-strength-muscle-damage-red.webp",
            "description": "<p>When you want to grab a creature or wrestle with it, you can use the Attack action to make a special melee attack, a grapple. If you're able to make multiple attacks with the Attack action, this attack replaces one of them. The target of your grapple must be no more than one size larger than you, and it must be within your reach.</p><p>Using at least one free hand, you try to seize the target by making a grapple check, a Strength (Athletics) check contested by the target's Strength (Athletics) or Dexterity (Acrobatics) check (the target chooses the ability to use). You succeed automatically if the target is incapacitated. If you succeed, you subject the target to the grappled condition (see the appendix). The condition specifies the things that end it, and you can release the target whenever you like (no action required).</p>",
            "type": "feat",
            "activation": {
                "type": "action",
                "cost": null,
                "condition": ""
            },
            "sortData": {}
        },
        "1-0": {
            "uuid": null,
            "name": "Shove",
            "icon": "icons/skills/melee/unarmed-punch-fist-white.webp",
            "description": "<p>When you want to grab a creature or wrestle with it, you can use the Attack action to make a special melee attack, a grapple. If you're able to make multiple attacks with the Attack action, this attack replaces one of them.</p><p>The target of your grapple must be no more than one size larger than you and must be within your reach. Using at least one free hand, you try to seize the target by making a grapple check instead of an attack roll: a Strength (Athletics) check contested by the target's Strength (Athletics) or Dexterity (Acrobatics) check (the target chooses the ability to use). You succeed automatically if the target is incapacitated. If you succeed, you subject the target to the grappled condition. The condition specifies the things that end it, and you can release the target whenever you like (no action required).</p><p>Escaping a Grapple. A grappled creature can use its action to escape. To do so, it must succeed on a Strength (Athletics) or Dexterity (Acrobatics) check contested by your Strength (Athletics) check.</p><p>Moving a Grappled Creature. When you move, you can drag or carry the grappled creature with you, but your speed is halved, unless the creature is two or more sizes smaller than you.</p><h4 id=\"ShovingaCreature\">Shoving a Creature</h4><p>Using the Attack action, you can make a special melee attack to shove a creature, either to knock it prone or push it away from you. If you're able to make multiple attacks with the Attack action, this attack replaces one of them.</p><p>The target must be no more than one size larger than you and must be within your reach. Instead of making an attack roll, you make a Strength (Athletics) check contested by the target's Strength (Athletics) or Dexterity (Acrobatics) check (the target chooses the ability to use). You succeed automatically if the target is incapacitated. If you succeed, you either knock the target prone or push it 5 feet away from you.</p>",
            "type": "feat",
            "activation": {
                "type": "action",
                "cost": null,
                "condition": ""
            },
            "sortData": {}
        },
        "1-2": {
            "uuid": null,
            "name": "Disengage",
            "icon": "icons/skills/movement/feet-winged-boots-blue.webp",
            "description": "<p>If you take the Disengage action, your movement doesn't provoke opportunity attacks for the rest of the turn.</p>",
            "type": "feat",
            "activation": {
                "type": "action",
                "cost": null,
                "condition": ""
            },
            "sortData": {}
        },
        "0-2": {
            "uuid": null,
            "name": "Dodge",
            "icon": "icons/equipment/shield/buckler-wooden-boss-lightning.webp",
            "description": "<p>When you take the Dodge action, you focus entirely on avoiding attacks. Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage. You lose this benefit if you are incapacitated or if your speed drops to 0.</p>",
            "type": "feat",
            "activation": {
                "type": "action",
                "cost": null,
                "condition": ""
            },
            "sortData": {}
        },
        "1-1": {
            "uuid": null,
            "name": "Dash",
            "icon": "icons/skills/movement/figure-running-gray.webp",
            "description": "<p>When you take the Dash action, you gain extra movement for the current turn. The increase equals your speed, after applying any modifiers. With a speed of 30 feet, for example, you can move up to 60 feet on your turn if you dash.</p><p>Any increase or decrease to your speed changes this additional movement by the same amount. If your speed of 30 feet is reduced to 15 feet, for instance, you can move up to 30 feet this turn if you dash.</p>",
            "type": "feat",
            "activation": {
                "type": "action",
                "cost": null,
                "condition": ""
            },
            "sortData": {}
        },
        "0-1": {
            "uuid": null,
            "name": "Hide",
            "icon": "icons/containers/barrels/barrel-open-brown-red.webp",
            "description": "<p>When you take the Hide action, you make a Dexterity (Stealth) check in an attempt to hide, following the rules for hiding. If you succeed, you gain certain benefits.</p><p>Combatants often try to escape their foes' notice by hiding, casting the invisibility spell, or lurking in darkness.</p><p>When you attack a target that you can't see, you have disadvantage on the attack roll. This is true whether you're guessing the target's location or you're targeting a creature you can hear but not see. If the target isn't in the location you targeted, you automatically miss, but the DM typically just says that the attack missed, not whether you guessed the target's location correctly.</p><p>When a creature can't see you, you have advantage on attack rolls against it. If you are hidden--both unseen and unheard--when you make an attack, you give away your location when the attack hits or misses.</p>",
            "type": "feat",
            "activation": {
                "type": "action",
                "cost": null,
                "condition": ""
            },
            "sortData": {}
        }
    }
};

export function registerKeybinding() {
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
}

export function registerEarly() {
    // UI Toggle Setting (hidden from settings menu)
    game.settings.register(CONFIG.MODULE_NAME, 'uiEnabled', {
        name: "UI Enabled",
        scope: 'client',
        config: false,
        type: Boolean,
        default: true
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
            // onClick: () => BG3Hotbar._toggleUI()
        });
    });
}

export function registerHooks() {
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
}

export function registerSettings() {
/*
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
      name: 'Auto Hide UI',
      // hint: 'Display a extra container to for basic actions like dodge, dash, etc (Compatible with CPR)',
      scope: 'client',
      config: true,
      type: String,
      default: false,
      choices: {
          'false': 'Never',
          'true': 'When not in combat',
          'init': 'When not in combat and it\'s not your turn'
      },
      onChange: () => {
        BG3Hotbar._onUpdateCombat(true);
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
    */
}

export function registerHandlebarsPartials() {
    
}