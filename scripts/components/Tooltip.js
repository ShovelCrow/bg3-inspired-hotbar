// Tooltip Component

import { CONFIG } from '../utils/config.js';
import { fromUuid } from '../utils/foundryUtils.js';

// Helper: Convert numeric spell level to ordinal string or "Cantrip"
function getSpellLevelString(level) {
    if (level === 0) return "Cantrip";
    const ordinalSuffix = (n) => {
        let j = n % 10, k = n % 100;
        if (j === 1 && k !== 11) return n + "st level";
        if (j === 2 && k !== 12) return n + "nd level";
        if (j === 3 && k !== 13) return n + "rd level";
        return n + "th level";
    };
    return ordinalSuffix(level);
}

// Helper: Map abbreviated school codes to full names.
function getSpellSchool(schoolCode) {
    const mapping = {
        "abj": "Abjuration",
        "con": "Conjuration",
        "div": "Divination",
        "enc": "Enchantment",
        "evo": "Evocation",
        "ill": "Illusion",
        "nec": "Necromancy",
        "trs": "Transmutation"
    };
    return mapping[schoolCode] || schoolCode;
}

// Helper: Format the casting time from activation based on item type.
function formatCastingTime(activation, itemType) {
    if (!activation) return "N/A";
    if (!activation.type) return "N/A";
    
    // Capitalize the activation type
    const type = activation.type.charAt(0).toUpperCase() + activation.type.slice(1);
    
    // If there's a value, format it with the type (e.g., "1 Action")
    if (activation.value) {
        return `${activation.value} ${type}`;
    }
    
    // Otherwise just return the type (e.g., "Bonus", "Reaction")
    return type;
}

// Helper: Format spell target based on item type.
function formatSpellTarget(target, itemType) {
    if (!target) return "N/A";
    
    // Special handling for features and items that target self
    if (itemType === "feat" || itemType === "equipment") {
        if (target.affects?.type?.toLowerCase() === "self") {
            return "Self";
        }
    }
    
    // Handle template targeting (mainly for spells)
    if (target.template?.type) {
        const type = target.template.type.charAt(0).toUpperCase() + target.template.type.slice(1);
        if (target.template.size && target.template.units) {
            return `${target.template.size} ${target.template.units} ${type}`.trim();
        }
        return type;
    }
    
    // Handle creature/object targeting
    if (target.affects?.type) {
        const type = target.affects.type.charAt(0).toUpperCase() + target.affects.type.slice(1);
        const count = target.affects.count ? ` (${target.affects.count})` : "";
        const special = target.affects.special ? ` ${target.affects.special}` : "";
        return `${type}${count}${special}`.trim();
    }
    
    return "N/A";
}

// Helper: Format a property that may be an object or string.
function formatSpellProperty(prop, itemType) {
    if (!prop) return "N/A";

    // Special case for "Self" and "Touch" - check all possible locations
    if (prop.value?.toString().toLowerCase() === "self" ||
        prop.units?.toString().toLowerCase() === "self" ||
        prop.special?.toString().toLowerCase() === "self") {
        return "Self";
    }
    
    if (prop.value?.toString().toLowerCase() === "touch" ||
        prop.units?.toString().toLowerCase() === "touch" ||
        prop.special?.toString().toLowerCase() === "touch") {
        return "Touch";
    }
    
    // Handle weapons specifically
    if (itemType === "weapon") {
        if (prop.reach && prop.value) {
            return `${prop.reach} ${prop.units} • ${prop.value}/${prop.long} ${prop.units}`.trim();
        }
        if (prop.value && prop.long) {
            return `${prop.value}/${prop.long} ${prop.units}`.trim();
        }
        if (prop.reach) {
            return `${prop.reach} ${prop.units}`.trim();
        }
    }
    
    // Handle features and equipment
    if (itemType === "feat" || itemType === "equipment") {
        if (prop.units?.toLowerCase() === "self") {
            return "Self";
        }
    }
    
    if (prop.value && prop.units) {
        // List of common measurement units
        const measurementUnits = ['ft', 'feet', 'mi', 'mile', 'miles', 'm', 'meter', 'meters', 'km', 'yards', 'yd'];
        const firstWord = prop.value.toString().toLowerCase();
        
        // If the first word isn't a measurement unit, capitalize it
        if (!measurementUnits.includes(firstWord)) {
            return `${prop.value.toString().charAt(0).toUpperCase() + prop.value.toString().slice(1)} ${prop.units}`.trim();
        }
        return `${prop.value} ${prop.units}`.trim();
    } else if (prop.value != null && prop.value !== "") {
        // Capitalize first letter of any standalone value
        const value = prop.value.toString();
        return value.charAt(0).toUpperCase() + value.slice(1);
    } else if (prop.units) {
        if (prop.units.toLowerCase() === "inst") return "Instantaneous";
        if (prop.units.toLowerCase() === "touch") return "Touch";
        return prop.units;
    } else if (prop.special) {
        return prop.special;
    }
    
    return "N/A";
}

// Helper: Get common details for any item.
function getItemDetails(itemData) {
    // Get all activities and sort them by sort property
    const activities = Object.values(itemData.system.activities || {})
        .sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Helper to find the first activity that has an override for a specific property
    const findOverridingActivity = (propertyPath) => {
        return activities.find(activity => {
            const props = propertyPath.split('.');
            let value = activity;
            for (const prop of props) {
                value = value?.[prop];
            }
            return value?.override === true;
        });
    };

    // Helper to get property value considering overrides
    const getPropertyValue = (propertyPath, defaultValue = null) => {
        // First check for any activity that explicitly overrides this property
        const overridingActivity = findOverridingActivity(propertyPath);
        if (overridingActivity) {
            const props = propertyPath.split('.');
            let value = overridingActivity;
            for (const prop of props) {
                value = value?.[prop];
            }
            return value;
        }

        // If no override, get the first activity with this property
        const firstActivityWithProperty = activities.find(activity => {
            const props = propertyPath.split('.');
            let value = activity;
            for (const prop of props) {
                value = value?.[prop];
            }
            return value !== undefined;
        });

        if (firstActivityWithProperty) {
            const props = propertyPath.split('.');
            let value = firstActivityWithProperty;
            for (const prop of props) {
                value = value?.[prop];
            }
            return value;
        }

        // Fallback to system-level property
        const systemValue = propertyPath.split('.')
            .reduce((obj, prop) => obj?.[prop], itemData.system);
        
        return systemValue ?? defaultValue;
    };

    // Get activation details
    const activation = {
        type: getPropertyValue('activation.type', 'none'),
        value: getPropertyValue('activation.value'),
        condition: getPropertyValue('activation.condition', '')
    };

    // Get range details
    const range = {
        value: null,
        units: getPropertyValue('range.units', ''),
        special: getPropertyValue('range.special', ''),
        long: null,
        reach: null
    };

    // Handle different range structures based on item type
    if (itemData.type === "weapon") {
        const reach = itemData.system.range?.reach;
        const rangeValue = itemData.system.range?.value;
        const rangeLong = itemData.system.range?.long;

        // Store both reach and range values if they exist
        if (reach) {
            range.reach = reach;
        }
        if (rangeValue) {
            range.value = rangeValue;
            range.long = rangeLong;
        }
    } else {
        // Default handling for spells and other items
        range.value = getPropertyValue('range.value', '');
        range.long = itemData.system.range?.long || null;
    }

    // Get target details
    const target = {
        affects: {
            type: getPropertyValue('target.affects.type', ''),
            count: getPropertyValue('target.affects.count', ''),
            choice: getPropertyValue('target.affects.choice', false),
            special: getPropertyValue('target.affects.special', '')
        },
        template: {
            type: getPropertyValue('target.template.type', ''),
            size: getPropertyValue('target.template.size', ''),
            units: getPropertyValue('target.template.units', '')
        }
    };

    // Get duration details
    const duration = {
        value: getPropertyValue('duration.value', ''),
        units: getPropertyValue('duration.units', 'inst'),
        concentration: getPropertyValue('duration.concentration', false)
    };

    // Format the values for display with item type
    return {
        castingTime: formatCastingTime(activation, itemData.type),
        range: formatSpellProperty(range, itemData.type),
        target: formatSpellTarget(target, itemData.type),
        duration: formatSpellProperty(duration, itemData.type)
    };
}

export class Tooltip {
    static isDragging = false;

    constructor() {
        this.element = null;
        this._pinned = false;
        this._isHighlighted = false;
        this._moveThrottle = false;
    }

    attach(cell, item, event) {
        // Don't create tooltips during any dragging operation
        if (Tooltip.isDragging || document.body.classList.contains('dragging-active')) {
            return;
        }

        if (cell._hotbarTooltip) {
            if (cell._hotbarTooltip._pinned) {
                // If there's a pinned tooltip, highlight it
                cell._hotbarTooltip.highlight(true);
                return;
            }
            cell._hotbarTooltip.remove();
            cell._hotbarTooltip = null;
        }

        // Check if there's already a pinned tooltip for this item elsewhere
        const existingTooltips = Array.from(document.querySelectorAll('.custom-tooltip'))
            .filter(el => el._tooltip && el._tooltip._pinned);
            
        for (const tooltipEl of existingTooltips) {
            const tooltip = tooltipEl._tooltip;
            if (tooltip._itemUuid === item.uuid) {
                // If we found a pinned tooltip for this item, highlight it
                tooltip.highlight(true);
                
                // Set up mouse leave to remove highlight
                const onMouseLeave = () => {
                    tooltip.highlight(false);
                    cell.removeEventListener('mouseleave', onMouseLeave);
                };
                cell.addEventListener('mouseleave', onMouseLeave);
                return;
            }
        }

        this.element = document.createElement("div");
        this.element.classList.add("custom-tooltip");
        this.element._tooltip = this; // Store reference to tooltip instance
        this._cell = cell;
        this._itemUuid = item.uuid;
        this._pinned = false; // Explicitly initialize as unpinned
        this._isDragging = false; // Track if we're dragging an item
        
        this._buildContent(item);
        document.body.appendChild(this.element);

        // Position tooltip at the top right of the cursor
        const padding = {
            right: 15,  // Offset from cursor
            top: -10    // Slightly above cursor
        };

        // Wait for the element to be rendered to get its dimensions
        requestAnimationFrame(() => {
            const tooltipRect = this.element.getBoundingClientRect();
            
            // Position at top right of cursor
            let left = event.clientX + padding.right;
            let top = event.clientY + padding.top - tooltipRect.height;
            
            // Ensure tooltip stays within viewport
            if (left + tooltipRect.width > window.innerWidth) {
                left = event.clientX - tooltipRect.width - padding.right;
            }
            
            if (top < 0) {
                top = event.clientY + 20; // Position below cursor if it would go above viewport
            }
            
            this.element.style.left = `${left}px`;
            this.element.style.top = `${top}px`;
            
            // Make visible after positioning
            this.element.classList.add("visible");
        });

        cell._hotbarTooltip = this;
        this._setupEventListeners(cell);
    }

    _buildContent(item) {
        // Icon
        const icon = document.createElement("img");
        icon.src = item.icon || "";
        icon.alt = item.name || "";
        icon.classList.add("tooltip-icon");
        this.element.appendChild(icon);

        // Name
        const nameEl = document.createElement("div");
        nameEl.classList.add("tooltip-name");
        nameEl.textContent = item.name;
        this.element.appendChild(nameEl);

        // Details container
        const detailsContainer = document.createElement("div");
        detailsContainer.classList.add("tooltip-details");
        this.element.appendChild(detailsContainer);

        // Description header
        const descHeader = document.createElement("div");
        descHeader.classList.add("tooltip-description-header");
        descHeader.textContent = "Description";
        this.element.appendChild(descHeader);

        // Description container
        const descContainer = document.createElement("div");
        descContainer.classList.add("tooltip-description-container");
        
        // Description content
        const descEl = document.createElement("div");
        descEl.textContent = "Loading description...";
        descContainer.appendChild(descEl);
        
        // Load item data
        fromUuid(item.uuid).then(itemData => {
            if (!itemData) {
                descEl.textContent = "No description available.";
                detailsContainer.appendChild(descContainer);
                return;
            }

            this._addItemDetails(itemData, detailsContainer, descEl);
        });

        // Add description container after details
        this.element.appendChild(descContainer);
    }

    _addItemDetails(itemData, detailsContainer, descEl) {
        // Add spell level and school for spells
        if (itemData.type === "spell") {
            const levelStr = getSpellLevelString(itemData.system.level);
            const schoolStr = getSpellSchool(itemData.system.school);
            const lvlSchoolEl = document.createElement("div");
            lvlSchoolEl.classList.add("tooltip-spell-info");
            lvlSchoolEl.textContent = `${levelStr} - ${schoolStr}`;
            detailsContainer.appendChild(lvlSchoolEl);

            // Add spell components and tags
            const properties = itemData.system.properties || [];
            const tags = [];

            // Add components
            const componentParts = [];
            if (properties instanceof Set) {
                if (properties.has("vocal")) componentParts.push("V");
                if (properties.has("somatic")) componentParts.push("S");
                if (properties.has("material")) componentParts.push("M");
            } else if (Array.isArray(properties)) {
                if (properties.includes("vocal")) componentParts.push("V");
                if (properties.includes("somatic")) componentParts.push("S");
                if (properties.includes("material")) componentParts.push("M");
            } else if (typeof properties === 'object') {
                if (properties.vocal) componentParts.push("V");
                if (properties.somatic) componentParts.push("S");
                if (properties.material) componentParts.push("M");
            }
            
            if (componentParts.length > 0) {
                tags.push(componentParts.join(", "));
            }

            // Add concentration and ritual tags
            if (properties instanceof Set) {
                if (properties.has("concentration")) tags.push("Concentration");
                if (properties.has("ritual")) tags.push("Ritual");
            } else if (Array.isArray(properties)) {
                if (properties.includes("concentration")) tags.push("Concentration");
                if (properties.includes("ritual")) tags.push("Ritual");
            } else {
                if (properties.concentration || itemData.system.duration?.concentration) tags.push("Concentration");
                if (properties.ritual || itemData.system.ritual) tags.push("Ritual");
            }

            // Create tags container if we have any tags
            if (tags.length > 0) {
                const tagsContainer = document.createElement("div");
                tagsContainer.classList.add("tooltip-spell-tags");
                tagsContainer.textContent = tags.join(" • ");
                detailsContainer.appendChild(tagsContainer);

                // If there's material components, add them as a tooltip
                const hasMaterial = properties instanceof Set ? properties.has("material") : 
                                   Array.isArray(properties) ? properties.includes("material") : 
                                   properties.material;
                                   
                if (hasMaterial) {
                    const materialText = itemData.system.materials?.value || "Material components required";
                    tagsContainer.title = `Material Components: ${materialText}`;
                }
            }
        }

        // Add common details
        const details = getItemDetails(itemData);
        const detailsList = document.createElement("div");
        detailsList.classList.add("tooltip-details-list");
        detailsList.innerHTML = `
            <div><strong>Casting Time:</strong> ${details.castingTime}</div>
            <div><strong>Range:</strong> ${details.range}</div>
            <div><strong>Target:</strong> ${details.target}</div>
            <div><strong>Duration:</strong> ${details.duration}</div>
        `;
        detailsContainer.appendChild(detailsList);

        // Add enriched description
        TextEditor.enrichHTML(itemData.system.description?.value || "", {
            rollData: itemData.getRollData ? itemData.getRollData() : {},
            secrets: false,
            entities: true,
            async: true
        }).then(enrichedDescription => {
            descEl.innerHTML = enrichedDescription || "No description available.";
        });
    }

    _setupEventListeners(cell) {
        // Mouse down on tooltip (for dragging)
        this.element.addEventListener("mousedown", this._onTooltipMouseDown.bind(this));
        
        // Middle click on tooltip (for closing)
        this.element.addEventListener("mousedown", this._onTooltipMiddleClick.bind(this));
        
        // Cell mouse move (for following cursor)
        cell.addEventListener("mousemove", this._onCellMouseMove.bind(this));
        
        // Cell mouse leave
        cell.addEventListener("mouseleave", this._onCellMouseLeave.bind(this));
        
        // Track drag start
        cell.addEventListener("dragstart", () => {
            this._isDragging = true;
            if (!this._pinned) {
                this.remove();
            }
        });
        
        // Track drag end
        cell.addEventListener("dragend", () => {
            this._isDragging = false;
        });
        
        // Cell middle click (for pinning)
        cell.addEventListener("mousedown", (evt) => {
            if (evt.button === 1 && !this._isDragging) { // Only pin if not dragging
                evt.preventDefault();
                this._pinned = !this._pinned;
                if (!this._pinned) {
                    this.remove();
                }
            }
        });
    }

    _onTooltipMouseDown(evt) {
        if (evt.button !== 0) return; // Only allow left click for dragging
        evt.preventDefault();
        
        // Only allow dragging if pinned
        if (!this._pinned) return;
        
        this.element.classList.add("dragging");
        const startX = evt.clientX;
        const startY = evt.clientY;
        const origRect = this.element.getBoundingClientRect();
        const origLeft = origRect.left;
        const origTop = origRect.top;
        
        const onDragMove = (e) => {
            let newX = origLeft + e.clientX - startX;
            let newY = origTop + e.clientY - startY;
            
            // Ensure tooltip stays within viewport
            const tooltipRect = this.element.getBoundingClientRect();
            if (newX + tooltipRect.width > window.innerWidth - 10) {
                newX = window.innerWidth - tooltipRect.width - 10;
            }
            if (newY + tooltipRect.height > window.innerHeight - 10) {
                newY = window.innerHeight - tooltipRect.height - 10;
            }
            if (newX < 10) newX = 10;
            if (newY < 10) newY = 10;
            
            this.element.style.left = `${newX}px`;
            this.element.style.top = `${newY}px`;
        };
        
        const onDragEnd = () => {
            window.removeEventListener("mousemove", onDragMove);
            window.removeEventListener("mouseup", onDragEnd);
            this.element.classList.remove("dragging");
        };
        
        window.addEventListener("mousemove", onDragMove);
        window.addEventListener("mouseup", onDragEnd);
    }

    _onTooltipMiddleClick(evt) {
        if (evt.button === 1) {
            evt.preventDefault();
            this.remove();
        }
    }

    _onCellMouseMove(evt) {
        if (!this.element || this._pinned || this._isDragging) return;
        
        const padding = {
            right: 15,
            top: -10
        };
        
        const tooltipRect = this.element.getBoundingClientRect();
        
        let left = evt.clientX + padding.right;
        let top = evt.clientY + padding.top - tooltipRect.height;
        
        if (left + tooltipRect.width > window.innerWidth) {
            left = evt.clientX - tooltipRect.width - padding.right;
        }
        
        if (top < 0) {
            top = evt.clientY + 20;
        }
        
        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
    }

    _onCellMouseLeave() {
        if (!this._pinned || this._isDragging) {
            this.remove();
        } else {
            this.highlight(false);
        }
    }

    remove() {
        this._pinned = false; // Ensure pinned state is cleared
        this._isDragging = false; // Reset drag state
        if (this.element?.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        if (this._cell) {
            this._cell._hotbarTooltip = null;
            this._cell = null;
        }
        this._moveThrottle = false;
        this.element = null;
    }

    highlight(show) {
        if (this._isHighlighted === show) return;
        this._isHighlighted = show;
        
        if (show) {
            this.element.classList.add("highlighted");
        } else {
            this.element.classList.remove("highlighted");
        }
    }
}

export class EffectTooltip {
    constructor() {
        this.element = null;
        this._pinned = false;
        this._isHighlighted = false;
        this._moveThrottle = false;
        this._isDragging = false;
    }

    attach(cell, effect, event) {
        // Don't create tooltips during any dragging operation
        if (Tooltip.isDragging || document.body.classList.contains('dragging-active')) {
            return;
        }

        if (cell._hotbarTooltip) {
            if (cell._hotbarTooltip._pinned) {
                cell._hotbarTooltip.highlight(true);
                return;
            }
            cell._hotbarTooltip.remove();
            cell._hotbarTooltip = null;
        }

        // Check if there's already a pinned tooltip for this effect elsewhere
        const existingTooltips = Array.from(document.querySelectorAll('.effect-tooltip'))
            .filter(el => el._tooltip && el._tooltip._pinned);
            
        for (const tooltipEl of existingTooltips) {
            const tooltip = tooltipEl._tooltip;
            if (tooltip._effectUuid === effect.uuid) {
                // If we found a pinned tooltip for this effect, highlight it
                tooltip.highlight(true);
                
                // Set up mouse leave to remove highlight
                const onMouseLeave = () => {
                    tooltip.highlight(false);
                    cell.removeEventListener('mouseleave', onMouseLeave);
                };
                cell.addEventListener('mouseleave', onMouseLeave);
                return;
            }
        }

        this.element = document.createElement("div");
        this.element.classList.add("custom-tooltip", "effect-tooltip");
        this.element._tooltip = this; // Store reference to tooltip instance
        this._cell = cell;
        this._effectUuid = effect.uuid;
        
        this._buildEffectContent(effect);
        document.body.appendChild(this.element);

        const padding = {
            right: 15,
            top: -10
        };

        requestAnimationFrame(() => {
            const tooltipRect = this.element.getBoundingClientRect();
            
            let left = event.clientX + padding.right;
            let top = event.clientY + padding.top - tooltipRect.height;
            
            if (left + tooltipRect.width > window.innerWidth) {
                left = event.clientX - tooltipRect.width - padding.right;
            }
            
            if (top < 0) {
                top = event.clientY + 20;
            }
            
            this.element.style.left = `${left}px`;
            this.element.style.top = `${top}px`;
            this.element.classList.add("visible");
        });

        cell._hotbarTooltip = this;
        this._setupEventListeners(cell);
    }

    _buildEffectContent(effect) {
        // Icon and Name
        const header = document.createElement("div");
        header.classList.add("effect-tooltip-header");
        
        const icon = document.createElement("img");
        icon.src = effect.img || effect.icon;
        icon.classList.add("tooltip-icon");
        header.appendChild(icon);

        const nameEl = document.createElement("div");
        nameEl.classList.add("tooltip-name");
        nameEl.textContent = effect.name || effect.label;
        header.appendChild(nameEl);

        this.element.appendChild(header);

        // Duration
        const durationEl = document.createElement("div");
        durationEl.classList.add("effect-tooltip-duration");
        
        let durationText = "";
        
        // Helper function to format time units
        const formatTimeUnit = (value, unit) => `${value} ${value === 1 ? unit : unit + 's'} Remaining`;
        
        // Helper function to format time remaining from seconds
        const formatTimeRemaining = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            
            const parts = [];
            if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'Hour' : 'Hours'}`);
            if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'Minute' : 'Minutes'}`);
            if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'Second' : 'Seconds'}`);
            
            return `${parts.join(', ')} Remaining`;
        };
        
        if (effect.duration) {
            if (effect.duration.type === 'rounds' || effect.duration.type === 'turns') {
                const remaining = effect.duration.remaining;
                durationText = formatTimeUnit(remaining, effect.duration.type === 'rounds' ? 'Round' : 'Turn');
            }
            else if (effect.duration.seconds) {
                // Calculate remaining time based on startTime
                const totalSeconds = effect.duration.seconds;
                const startTime = effect.duration.startTime;
                const currentTime = game.time.worldTime;
                const elapsedSeconds = currentTime - startTime;
                const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
                
                durationText = formatTimeRemaining(remainingSeconds);
            }
            else {
                durationText = "Permanent";
            }
        } else {
            durationText = "Permanent";
        }

        durationEl.innerHTML = `<strong>Duration:</strong> ${durationText}`;
        this.element.appendChild(durationEl);

        // Status
        const statusEl = document.createElement("div");
        statusEl.classList.add("effect-tooltip-status");
        statusEl.innerHTML = `<strong>Status:</strong> ${effect.disabled ? "Disabled" : "Active"}`;
        this.element.appendChild(statusEl);

        // Description
        if (effect.description) {
            const descHeader = document.createElement("div");
            descHeader.classList.add("tooltip-description-header");
            descHeader.textContent = "Effect";
            this.element.appendChild(descHeader);

            const descContainer = document.createElement("div");
            descContainer.classList.add("tooltip-description-container");
            
            const descEl = document.createElement("div");
            TextEditor.enrichHTML(effect.description, {
                secrets: false,
                entities: true,
                async: true
            }).then(enrichedDesc => {
                descEl.innerHTML = enrichedDesc;
            });
            
            descContainer.appendChild(descEl);
            this.element.appendChild(descContainer);
        }
    }

    _setupEventListeners(cell) {
        // Mouse down on tooltip (for dragging)
        this.element.addEventListener("mousedown", this._onTooltipMouseDown.bind(this));
        
        // Middle click on tooltip (for closing)
        this.element.addEventListener("mousedown", this._onTooltipMiddleClick.bind(this));
        
        // Cell mouse move (for following cursor)
        cell.addEventListener("mousemove", this._onCellMouseMove.bind(this));
        
        // Cell mouse leave
        cell.addEventListener("mouseleave", this._onCellMouseLeave.bind(this));
        
        // Cell middle click (for pinning)
        cell.addEventListener("mousedown", (evt) => {
            if (evt.button === 1) { // Middle click
                evt.preventDefault();
                this._pinned = !this._pinned;
                if (!this._pinned) {
                    this.remove();
                }
            }
        });
    }

    _onTooltipMouseDown(evt) {
        if (evt.button !== 0) return; // Only allow left click for dragging
        evt.preventDefault();
        
        // Only allow dragging if pinned
        if (!this._pinned) return;
        
        this.element.classList.add("dragging");
        const startX = evt.clientX;
        const startY = evt.clientY;
        const origRect = this.element.getBoundingClientRect();
        const origLeft = origRect.left;
        const origTop = origRect.top;
        
        const onDragMove = (e) => {
            let newX = origLeft + e.clientX - startX;
            let newY = origTop + e.clientY - startY;
            
            // Ensure tooltip stays within viewport
            const tooltipRect = this.element.getBoundingClientRect();
            if (newX + tooltipRect.width > window.innerWidth - 10) {
                newX = window.innerWidth - tooltipRect.width - 10;
            }
            if (newY + tooltipRect.height > window.innerHeight - 10) {
                newY = window.innerHeight - tooltipRect.height - 10;
            }
            if (newX < 10) newX = 10;
            if (newY < 10) newY = 10;
            
            this.element.style.left = `${newX}px`;
            this.element.style.top = `${newY}px`;
        };
        
        const onDragEnd = () => {
            window.removeEventListener("mousemove", onDragMove);
            window.removeEventListener("mouseup", onDragEnd);
            this.element.classList.remove("dragging");
        };
        
        window.addEventListener("mousemove", onDragMove);
        window.addEventListener("mouseup", onDragEnd);
    }

    _onTooltipMiddleClick(evt) {
        if (evt.button === 1) {
            evt.preventDefault();
            this.remove();
        }
    }

    _onCellMouseMove(evt) {
        if (!this.element || this._pinned || this._isDragging) return;
        
        const padding = {
            right: 15,
            top: -10
        };
        
        const tooltipRect = this.element.getBoundingClientRect();
        
        let left = evt.clientX + padding.right;
        let top = evt.clientY + padding.top - tooltipRect.height;
        
        if (left + tooltipRect.width > window.innerWidth) {
            left = evt.clientX - tooltipRect.width - padding.right;
        }
        
        if (top < 0) {
            top = evt.clientY + 20;
        }
        
        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
    }

    _onCellMouseLeave() {
        if (!this._pinned || this._isDragging) {
            this.remove();
        } else {
            this.highlight(false);
        }
    }

    remove() {
        this._pinned = false;
        this._isDragging = false;
        if (this.element?.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        if (this._cell) {
            this._cell._hotbarTooltip = null;
            this._cell = null;
        }
        this.element = null;
    }

    highlight(show) {
        if (this._isHighlighted === show) return;
        this._isHighlighted = show;
        
        if (show) {
            this.element.classList.add("highlighted");
        } else {
            this.element.classList.remove("highlighted");
        }
    }
} 