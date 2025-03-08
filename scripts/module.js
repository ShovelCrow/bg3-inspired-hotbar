// Module Lifecycle Management
import { BG3Hotbar } from './bg3-hotbar.js';
import { CONFIG } from './utils/config.js';

Hooks.once('init', () => {
    // Register module settings
    BG3Hotbar._registerSettings();
});

Hooks.once('ready', async () => {
    // Only initialize if UI is enabled
    if (game.settings.get(CONFIG.MODULE_NAME, 'enableUI')) {
        await BG3Hotbar.init();
    }
});

// Handle settings menu close
Hooks.on('closeSettings', async (settingsApp) => {
    const module = game.modules.get(CONFIG.MODULE_NAME);
    if (!module?.active) {
        cleanup();
    }
});

async function cleanup() {
    if (BG3Hotbar.manager) {
        // Clean up all token data and UI
        await BG3Hotbar.manager.cleanupAllData();
        
        // Remove any event listeners
        Hooks.off('canvasReady', BG3Hotbar.manager.updateHotbarForControlledToken);
        Hooks.off('controlToken', BG3Hotbar.manager.updateHotbarForControlledToken);
        
        // Clean up any remaining DOM elements (safety check)
        const container = document.getElementById('bg3-hotbar-container');
        if (container) {
            container.remove();
        }
    }
    
    // Module cleanup complete
} 