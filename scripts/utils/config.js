// Configuration constants for the BG3 Hotbar

export const CONFIG = {
    // UI Constants
    CELL_SIZE: 50,
    INITIAL_COLS: 5,
    ROWS: 3,
    DRAG_THRESHOLD: 40, // 80% of cell width
    TOOLTIP_DELAY: 500, // Default tooltip delay in ms
    
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
        BORDER: "#444444",
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
    SETTINGS: {
        normalOpacity: {
            name: 'Normal Opacity',
            hint: 'Opacity when mouse is over the hotbar',
            scope: 'client',
            config: true,
            type: Number,
            default: 1.0,
            range: {
                min: 0,
                max: 1,
                step: 0.1
            }
        },
        fadedOpacity: {
            name: 'Faded Opacity',
            hint: 'Opacity when mouse is away from the hotbar',
            scope: 'client',
            config: true,
            type: Number,
            default: 0.5,
            range: {
                min: 0,
                max: 1,
                step: 0.1
            }
        },
        fadeOutDelay: {
            name: 'Fade Out Delay',
            hint: 'Delay in seconds before the hotbar fades',
            scope: 'client',
            config: true,
            type: Number,
            default: 3,
            range: {
                min: 0,
                max: 10,
                step: 0.5
            }
        },
        lockSettings: {
            name: 'Lock Settings',
            hint: 'Hotbar lock settings',
            scope: 'client',
            config: false,
            type: Object,
            default: {
                deselect: false,
                opacity: false,
                dragDrop: false
            }
        }
    }
};

// Register module settings
export function registerSettings() {
    // Register all settings
    Object.entries(CONFIG.SETTINGS).forEach(([key, setting]) => {
        game.settings.register(CONFIG.MODULE_NAME, key, setting);
    });
} 