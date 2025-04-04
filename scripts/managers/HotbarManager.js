// Hotbar Manager Component

import { CONFIG } from '../utils/config.js';

export class HotbarManager {
    constructor() {

        this.containers = {};
        
        this._initializeContainers();
    }

    _initializeContainers() {
        Object.entries(CONFIG.CONTAINERSDATA).forEach(([index, data]) => {
            this.containers[index] = [];
            for(let i = 0; i < data.count; i++) {
                this.containers[index].push({...data.config, ...{id: `${index}-container`, index: i}});
            }
        })
    }
} 