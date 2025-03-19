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

    COMBATACTIONDATA: {
        "0-0": {
            "uuid": "Item.NxdZDpCnlK7lZmNQ",
            "name": "Grapple",
            "icon": "icons/magic/control/buff-strength-muscle-damage-red.webp",
            "type": "feat",
            "activation": {
                "type": "action",
                "cost": null,
                "condition": ""
            },
            "sortData": {}
        },
        "1-0": {
            "uuid": "Item.cMSvUkLZrGIRzFB0",
            "name": "Shove",
            "icon": "icons/skills/melee/unarmed-punch-fist-white.webp",
            "type": "feat",
            "activation": {
                "type": "action",
                "cost": null,
                "condition": ""
            },
            "sortData": {}
        },
        "1-2": {
            "uuid": "Item.JrPIFzd0J3VEM3rr",
            "name": "Disengage",
            "icon": "icons/skills/movement/feet-winged-boots-blue.webp",
            "type": "feat",
            "activation": {
                "type": "action",
                "cost": null,
                "condition": ""
            },
            "sortData": {}
        },
        "0-2": {
            "uuid": `Item.RC2W0i5c64S9fwdQ`,
            "name": "Dodge",
            "icon": "icons/equipment/shield/buckler-wooden-boss-lightning.webp",
            "type": "feat",
            "activation": {
                "type": "action",
                "cost": null,
                "condition": ""
            },
            "sortData": {}
        },
        "1-1": {
            "uuid": "Item.erW9Jj9BYmufqbx1",
            "name": "Dash",
            "icon": "icons/skills/movement/figure-running-gray.webp",
            "type": "feat",
            "activation": {
                "type": "action",
                "cost": null,
                "condition": ""
            },
            "sortData": {}
        },
        "0-1": {
            "uuid": "Item.hj5qto1IOul6UaEx",
            "name": "Hide",
            "icon": "icons/containers/barrels/barrel-open-brown-red.webp",
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

/**
 * Helper function to determine token linkage status
 * @param {Actor} actor - The actor to check
 * @param {string} tokenId - The token ID to check
 * @returns {boolean} - Whether the token is considered linked
 */
export function isTokenLinked(actor, tokenId) {
    // Get the token from the canvas
    const token = canvas.tokens.get(tokenId);
    
    // If we have a token, check its document's actorLink property
    if (token) {
        return token.document.actorLink;
    }
    
    // If no token found, assume it's linked if it's not a synthetic token actor
    return !actor.isToken;
}

/**
 * Helper function to determine if spell preparation should be enforced
 * @param {Actor} actor - The actor to check
 * @param {string} tokenId - The token ID to check
 * @returns {boolean} - Whether spell preparation should be enforced
 */
export function shouldEnforceSpellPreparation(actor, tokenId) {
    const isLinked = isTokenLinked(actor, tokenId);
    
    // Debug log to help track issues
    console.debug("BG3 Inspired Hotbar | Spell preparation check:", {
        actorId: actor.id,
        actorName: actor.name,
        tokenId: tokenId,
        isLinked: isLinked,
        setting: isLinked ? 'PC' : 'NPC'
    });

    // If linked token (including PCs) - use PC setting
    if (isLinked) {
        return game.settings.get(CONFIG.MODULE_NAME, 'enforceSpellPreparationPC');
    }
    
    // If unlinked token - use NPC setting
    return game.settings.get(CONFIG.MODULE_NAME, 'enforceSpellPreparationNPC');
}