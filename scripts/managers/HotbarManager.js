// Hotbar Manager Component

import { CONFIG } from '../utils/config.js';

export class HotbarManager {
    constructor() {

        this.containers = {};
        this.currentTokenId = null;
        
        this._initializeContainers();
    }

    get token() {
        return canvas?.tokens?.get(this.currentTokenId) ?? null;
    }

    get actor() {
        return this.token?.actor ?? null;
    }

    _initializeContainers() {
        Object.entries(CONFIG.CONTAINERSDATA).forEach(([index, data]) => {
            this.containers[index] = [];
            for(let i = 0; i < data.count; i++) {
                this.containers[index].push({...data.config, ...{id: `${index}-container`, index: i}});
            }
        })
    }

    convertAllFormat(savedData) {
        return [savedData.containers, savedData.weaponsContainers, savedData.combatContainer];
    }

    async _loadTokenData() {
        if(!this.token || !this.actor) return;
        const savedData = this.actor.getFlag(CONFIG.MODULE_NAME, CONFIG.FLAG_NAME);

        if(savedData) {
            let containersData, weaponsContainersData, combatContainerData;
            if (Array.isArray(savedData)) {
                // Old format: direct array of containers
                containersData = foundry.utils.deepClone(savedData);
                this.portraitVisible = true; // Default for old format
                // Using old data format, portrait defaulted to hidden
            } else {
                // New format: object with containers and portraitVisible
                /* containersData = foundry.utils.deepClone(savedData.containers);
                weaponsContainersData = foundry.utils.deepClone(savedData.weaponsContainers);
                combatContainerData = foundry.utils.deepClone(savedData.combatContainer); */
                // console.log(this.convertAllFormat(savedData));
                const [hotbarData, weaponData, combatData] = this.convertAllFormat(savedData);
                if(Array.isArray(hotbarData)) {
                    hotbarData.forEach(c => {
                        this.containers.hotbar[c.index].cols = c.cols;
                        this.containers.hotbar[c.index].rows = c.rows;
                        this.containers.hotbar[c.index].items = c.items;
                    });
                }
                if(Array.isArray(weaponData)) {
                    weaponData.forEach(c => {
                        this.containers.weapon[c.index].cols = c.cols;
                        this.containers.weapon[c.index].rows = c.rows;
                        this.containers.weapon[c.index].items = c.items;
                    });
                }
                if(Array.isArray(combatData)) {
                    combatData.forEach(c => {
                        this.containers.combat[c.index].cols = c.cols;
                        this.containers.combat[c.index].rows = c.rows;
                        this.containers.combat[c.index].items = c.items;
                    });
                }
            }
        } else {

        }
    }
} 