// File: scripts/components/containers/ContainerPopover.js

import { BG3Component } from "../component.js";
import { GridContainer } from "./GridContainer.js";
import { fromUuid } from "../../utils/foundryUtils.js";
import { BG3CONFIG } from "../../utils/config.js";

/**
 * Container Popover component for displaying container contents in a grid layout
 * @extends BG3Component
 */
export class ContainerPopover extends BG3Component {
    constructor(containerItem, parentCell) {
        super();
        this.containerItem = containerItem;
        this.parentCell = parentCell;
        this.gridContainer = null;
    }

    get classes() {
        return ['bg3-container-popover'];
    }

    get template() {
        return 'modules/bg3-inspired-hotbar/templates/components/ContainerPopover.hbs';
    }

    static isContainer(item) {
        return item && (item.type === 'container' || item.type === 'backpack');
    }

    /**
     * Gets the container key for flag storage based on parent cell position
     */
    getContainerKey() {
        const parentSlot = this.parentCell.data.slot || `${this.parentCell.data.row}-${this.parentCell.data.col}`;
        return `container_${parentSlot}`;
    }

    /**
     * Loads container layout from parent hotbar item flags
     */
    loadContainerLayout() {
        if (!this.parentCell?.data?.slot) return {};
        
        // Find parent hotbar slot data
        const parentSlotKey = this.parentCell.data.slot;
        const hotbarData = ui.BG3HOTBAR?.manager?.data?.items || {};
        const parentItemData = hotbarData[parentSlotKey];
        
        return parentItemData?.containerLayout || {};
    }

    /**
     * Saves container layout to parent hotbar item flags
     */
    async saveContainerLayout(containerData) {
        if (!this.parentCell?.data?.slot) return;
        
        const parentSlotKey = this.parentCell.data.slot;
        const hotbarData = ui.BG3HOTBAR?.manager?.data?.items || {};
        const parentItemData = hotbarData[parentSlotKey];
        
        if (parentItemData) {
            // Update parent item data with container layout
            const updatedData = {
                ...parentItemData,
                containerLayout: containerData
            };
            
            // Save to flags
            if (game.user.character) {
                const flagData = { ...hotbarData };
                flagData[parentSlotKey] = updatedData;
                await game.user.character.setFlag('bg3-inspired-hotbar', 'hotbar-layout', { items: flagData });
            }
        }
    }

    /**
     * Sets up container drag-drop by registering temporary container
     */
    setupContainerDragDrop() {
        if (!ui.BG3HOTBAR?.manager?.tempContainers) {
            ui.BG3HOTBAR.manager.tempContainers = {};
        }
        ui.BG3HOTBAR.manager.tempContainers['container-popover'] = this;
    }

    /**
     * Handles persistence when items are dropped in popover
     */
    async persistContainerDrop(sourceSlot, targetSlot, item) {
        const savedLayout = this.loadContainerLayout();
        
        // Update source slot
        if (sourceSlot && savedLayout[sourceSlot]) {
            delete savedLayout[sourceSlot];
        }
        
        // Update target slot
        if (targetSlot && item) {
            savedLayout[targetSlot] = { uuid: item.uuid };
        }
        
        await this.saveContainerLayout(savedLayout);
    }

    async getContainerContents() {
        if (!this.containerItem || !ContainerPopover.isContainer(this.containerItem)) {
            return [];
        }

        try {
            let contents = [];
            if (this.containerItem.system?.contents) {
                contents = Array.from(this.containerItem.system.contents || []);
            } else if (this.containerItem.items) {
                contents = Array.from(this.containerItem.items || []);
            } else if (this.containerItem.contents) {
                contents = Array.from(this.containerItem.contents || []);
            }

            const itemPromises = contents.map(async (itemRef) => {
                try {
                    if (typeof itemRef === 'string') {
                        return await fromUuid(itemRef);
                    } else if (itemRef.uuid) {
                        return await fromUuid(itemRef.uuid);
                    } else if (itemRef._id || itemRef.id) {
                        return this.containerItem.actor?.items?.get(itemRef._id || itemRef.id);
                    }
                    return itemRef;
                } catch (error) {
                    console.warn("BG3 Container Popover | Error resolving item reference:", error);
                    return null;
                }
            });

            const resolvedItems = await Promise.all(itemPromises);
            return resolvedItems.filter(item => item !== null);
        } catch (error) {
            console.error("BG3 Container Popover | Error getting container contents:", error);
            return [];
        }
    }

    /**
     * Generates grid container data with saved layout integration
     */
    async getGridContainerData() {
        const savedContainerData = this.loadContainerLayout();
        
        // Load contents only if needed for validation or default layout
        const needsContents = Object.keys(savedContainerData).length === 0;
        let contents = [];
        if (needsContents) {
            contents = await this.getContainerContents();
        }

        // Validate saved UUIDs still exist
        const savedUuids = Object.values(savedContainerData).map(item => item?.uuid).filter(Boolean);
        if (savedUuids.length > 0) {
            contents = await this.getContainerContents();
        }

        const gridData = {
            id: 'container-popover',
            index: 0,
            locked: false,
            allowDuplicate: true,
            cols: BG3CONFIG.INITIAL_COLS,
            rows: BG3CONFIG.ROWS,
            items: {}
        };

        // If we have saved layout, use it
        if (Object.keys(savedContainerData).length > 0) {
            gridData.items = { ...savedContainerData };
        } else if (contents.length > 0) {
            // Create default layout from contents
            contents.forEach((item, index) => {
                const row = Math.floor(index / gridData.cols);
                const col = index % gridData.cols;
                if (row < gridData.rows) {
                    const slotKey = `${row}-${col}`;
                    gridData.items[slotKey] = { uuid: item.uuid };
                }
            });
            
            // Save the default layout
            await this.saveContainerLayout(gridData.items);
        }

        return gridData;
    }

    /**
     * Inherits theming and settings from main hotbar
     */
    inheritTheming() {
        const mainHotbar = document.querySelector('#bg3-hotbar');
        if (!mainHotbar || !this.element) return;

        // Copy CSS custom properties
        const computedStyle = getComputedStyle(mainHotbar);
        const cssVars = [
            '--bg3-hotbar-background-color',
            '--bg3-hotbar-border-color', 
            '--bg3-cell-border-width',
            '--bg3-hotbar-text-color'
        ];

        cssVars.forEach(varName => {
            const value = computedStyle.getPropertyValue(varName);
            if (value) {
                this.element.style.setProperty(varName, value);
            }
        });

        // Copy data attributes for item display
        const dataAttrs = ['data-item-name', 'data-item-use'];
        dataAttrs.forEach(attr => {
            const value = mainHotbar.getAttribute(attr);
            if (value !== null) {
                this.element.setAttribute(attr, value);
            }
        });
    }

    setupEvents() {
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);

        this.outsideClickHandler = (e) => {
            if (!this.element.contains(e.target) && !this.parentCell.element.contains(e.target)) {
                this.close();
            }
        };
        document.addEventListener('click', this.outsideClickHandler);
    }

    positionPopover(triggerElement) {
        const rect = triggerElement.getBoundingClientRect();
        const popoverRect = this.element.getBoundingClientRect();

        let left = rect.left + rect.width + 10;
        let top = rect.top;

        if (left + popoverRect.width > window.innerWidth) {
            left = rect.left - popoverRect.width - 10;
        }

        if (top + popoverRect.height > window.innerHeight) {
            top = window.innerHeight - popoverRect.height - 10;
        }

        if (left < 0) left = 10;
        if (top < 0) top = 10;

        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
    }

    cleanup() {
        if (ui.BG3HOTBAR?.manager?.tempContainers) {
            delete ui.BG3HOTBAR.manager.tempContainers['container-popover'];
        }
    }

    close() {
        if (this.element) {
            this.cleanup();
            this.element.classList.add('closing');

            if (this.escapeHandler) {
                document.removeEventListener('keydown', this.escapeHandler);
            }
            if (this.outsideClickHandler) {
                document.removeEventListener('click', this.outsideClickHandler);
            }

            setTimeout(() => {
                if (this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
            }, 200);
        }
    }

    async show(triggerElement) {
        await this.render();
        this.positionPopover(triggerElement);
        document.body.appendChild(this.element);
        this.setupEvents();
        this.inheritTheming();
        
        requestAnimationFrame(() => {
            this.element.classList.add('show');
        });

        return this;
    }

    async render() {
        await super.render();
        
        // Get grid data and create GridContainer
        const gridData = await this.getGridContainerData();
        this.gridContainer = new GridContainer(gridData, this);
        
        // Set properties explicitly after creation
        this.gridContainer.id = gridData.id;
        this.gridContainer.index = gridData.index;
        
        // Setup drag-drop
        this.setupContainerDragDrop();
        
        // Override clear action for container-specific behavior
        const originalMenuItemAction = this.gridContainer.menuItemAction;
        this.gridContainer.menuItemAction = async (action) => {
            if (action === 'clear') {
                await this.saveContainerLayout({});
                this.gridContainer.data.items = {};
                this.gridContainer.render();
            } else {
                return originalMenuItemAction.call(this.gridContainer, action);
            }
        };

        // Render grid container into popover
        await this.gridContainer.render();
        const gridElement = this.element.querySelector('.bg3-grid-container');
        if (gridElement) {
            gridElement.appendChild(this.gridContainer.element);
        }

        return this.element;
    }

    async getData() {
        return {
            containerName: this.containerItem?.name || 'Container'
        };
    }
}
