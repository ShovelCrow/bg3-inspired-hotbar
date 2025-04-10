import { CONFIG } from "../utils/config.js";

export class ControlsManager {
    static getMasterLock() {
        return game.settings.get(CONFIG.MODULE_NAME, 'masterLockEnabled');
    }

    static getLockSetting(key) {
        return game.settings.get(CONFIG.MODULE_NAME, 'lockSettings')[key];
    }

    static isSettingLocked(key) {
        return ControlsManager.getMasterLock() && ControlsManager.getLockSetting(key);
    }

    static updateMasterLock(value) {
        const newValue = value !== undefined ? value : !game.settings.get(CONFIG.MODULE_NAME, 'masterLockEnabled');
        game.settings.set(CONFIG.MODULE_NAME, 'masterLockEnabled', newValue);
        document.querySelector('[data-key="controlLock"]').classList.toggle('locked', newValue)
    }

    static updateLockSetting(key) {
        const el = document.querySelector(`[data-key="${key}"`),
            settings = game.settings.get(CONFIG.MODULE_NAME, 'lockSettings'),
            masterLock = game.settings.get(CONFIG.MODULE_NAME, 'masterLockEnabled');
        settings[key] = !settings[key];
        el.classList.toggle('checked', settings[key]);
        game.settings.set(CONFIG.MODULE_NAME, 'lockSettings', settings);
        if(settings[key] && !masterLock) ControlsManager.updateMasterLock(true);
        else if(!Object.values(settings).filter(s => s === true).length) ControlsManager.updateMasterLock(false);
    }
}