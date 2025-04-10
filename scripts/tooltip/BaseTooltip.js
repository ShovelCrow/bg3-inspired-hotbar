// BaseTooltip.js
import { getItemDetails, enrichHTMLClean } from "../utils/tooltipUtils.js";
import { CONFIG } from "../utils/config.js";
import { TooltipFactory } from "./TooltipFactory.js";

export class BaseTooltip {
  static pinnedTooltips = new Map();
  static currentTooltips = new Map();
  static pendingTooltipTimers = new Map();
  static contentUpdateTimers = new Map();

  constructor(item) {
    this.item = item;
    this.element = null;
    this._pinned = false;
    this._isHighlighted = false;
    this._isDragging = false;
    this.tooltipType = "base"; // Subclasses may override this value
    this._contentUpdateTimeout = null;
  }

  static getTooltipDelay() {
    return game.settings.get(CONFIG.MODULE_NAME, "tooltipDelay") ?? CONFIG.TOOLTIP_DELAY;
  }

  static cleanup(tooltipType) {
    // Clear any pending timers
    if (this.pendingTooltipTimers.has(tooltipType)) {
      clearTimeout(this.pendingTooltipTimers.get(tooltipType));
      this.pendingTooltipTimers.delete(tooltipType);
    }

    // Clear any existing tooltip
    const existingTooltip = this.currentTooltips.get(tooltipType);
    if (existingTooltip) {
      // Always remove from currentTooltips to ensure clean state
      this.currentTooltips.delete(tooltipType);
      // Only call remove() if not pinned to avoid duplicate cleanup
      if (!existingTooltip._pinned) {
        existingTooltip.remove();
      }
    }
  }

  static async createWithDelay(item, cell, event, isUpdating = false) {
    if (isUpdating) return null;
    const existingTooltip = this.getPinnedTooltip(item);
    if (existingTooltip) {
      existingTooltip.highlight(true);
      return existingTooltip;
    }
    this.cleanup(item.type || "base");
    const tooltipDelay = this.getTooltipDelay();
    if (tooltipDelay === 0) {
      const tooltip = await TooltipFactory.create(item);
      if (tooltip) {
        tooltip.attach(cell, event);
        return tooltip;
      }
      return null;
    }
    // Store the initial event for context
    const initialEvent = event;
    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        // Create a new synthetic event object or just capture coords
        // at the moment the timer fires. Using the initial event's properties
        // but potentially updated coordinates if we could capture them globally,
        // but sticking to initial event for simplicity for now.
        // Let's pass the initialEvent through for context.
        const triggerEvent = initialEvent; 
        
        if (!document.body.classList.contains("dragging-active")) {
          const tooltip = await TooltipFactory.create(item);
          if (tooltip) {
            // Pass the event captured when timer fired (or initial)
            tooltip.attach(cell, triggerEvent); 
            resolve(tooltip);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
        this.pendingTooltipTimers.delete(item.type || "base");
      }, tooltipDelay);
      this.pendingTooltipTimers.set(item.type || "base", timer);
    });
  }

  static getPinnedTooltip(item) {
    const itemId = item.uuid || item.id;
    return this.pinnedTooltips.get(itemId);
  }

  static registerPinnedTooltip(item, tooltip) {
    const itemId = item.uuid || item.id;
    this.pinnedTooltips.set(itemId, tooltip);
  }

  static unregisterPinnedTooltip(item) {
    const itemId = item.uuid || item.id;
    this.pinnedTooltips.delete(itemId);
  }

  async attach(cell, event) {
    if (document.body.classList.contains("dragging-active")) return;
    BaseTooltip.cleanup(this.tooltipType);
    if (cell._hotbarTooltips?.get(this.tooltipType)) {
      const existingTooltip = cell._hotbarTooltips.get(this.tooltipType);
      if (existingTooltip._pinned) {
        existingTooltip.highlight(true);
        return;
      }
      existingTooltip.remove();
      cell._hotbarTooltips.delete(this.tooltipType);
    }
    BaseTooltip.currentTooltips.set(this.tooltipType, this);
    let tooltipContainer = document.getElementById("bg3-tooltip-container");
    if (!tooltipContainer) {
      tooltipContainer = document.createElement("div");
      tooltipContainer.id = "bg3-tooltip-container";
      tooltipContainer.classList.add("bg3-hud");
      document.body.appendChild(tooltipContainer);
    }
    this.element = document.createElement("div");
    this.element.classList.add("bg3-hud", "custom-tooltip");
    this.element.dataset.type = this.tooltipType;
    this.element._tooltip = this;
    this._cell = cell;
    if (!cell._hotbarTooltips) {
      cell._hotbarTooltips = new Map();
    }
    
    tooltipContainer.appendChild(this.element);

    // Build content first
    await this.buildContent(); 
    
    // Store the initial event for positioning
    const initialEvent = event; 
    
    // Position using the *initial* event, after content is built
    if(this.element && initialEvent) { 
        this.positionTooltip(initialEvent);
    }
    
    // Setup listeners AFTER initial positioning
    this._setupEventListeners(); 
    cell._hotbarTooltips.set(this.tooltipType, this);
  }

  buildContent() {
    return new Promise((resolve) => {
        if (!this.item) {
            resolve();
            return;
        }
        if (this._contentUpdateTimeout) {
            clearTimeout(this._contentUpdateTimeout);
        }
        this._contentUpdateTimeout = setTimeout(async () => {
            try {
                await this._actuallyBuildContent();
            } catch (err) {
                console.error("Error building tooltip content:", err);
            }
            resolve(); // Resolve after _actuallyBuildContent finishes
        }, 100); 
    });
  }

  async _actuallyBuildContent() {
    if (!this.item || !this.element) return;
    
    // Clear existing content
    this.element.innerHTML = "";

    // Create content wrapper
    const content = document.createElement("div");
    content.classList.add("tooltip-content");

    // Icon
    const icon = document.createElement("img");
    icon.src = this.item.img || this.item.icon || "";
    icon.alt = this.item.name || "";
    icon.classList.add("tooltip-icon");
    content.appendChild(icon);

    // Name
    const nameEl = document.createElement("div");
    nameEl.classList.add("tooltip-name");
    nameEl.textContent = this.item.name || "";
    content.appendChild(nameEl);

    // Details (activation, range, target, duration)
    const details = getItemDetails(this.item);
    const detailsEl = document.createElement("div");
    detailsEl.classList.add("tooltip-details-list");
    const detailsHTML = []; // SHOVEL
    if (details.castingTime && details.castingTime !== "N/A") detailsHTML.push(`<div><strong>${game.i18n.localize("BG3.Hotbar.Tooltips.Action")}:</strong> ${details.castingTime}</div>`);
    if (details.range && details.range !== "N/A") detailsHTML.push(`<div><strong>${game.i18n.localize("BG3.Hotbar.Tooltips.Range")}:</strong> ${details.range}</div>`);
    if (details.target && details.target !== "N/A") detailsHTML.push(`<div><strong>${game.i18n.localize("BG3.Hotbar.Tooltips.Target")}:</strong> ${details.target}</div>`);
    if (details.duration && details.duration !== "N/A") detailsHTML.push(`<div><strong>${game.i18n.localize("BG3.Hotbar.Tooltips.Duration")}:</strong> ${details.duration}</div>`);
    if (detailsHTML.length > 0) {
      detailsEl.innerHTML = detailsHTML.join("");
      content.appendChild(detailsEl);
    }

    // Description
    if (this.item.system?.description?.value) {
      const descHeader = document.createElement("div");
      descHeader.classList.add("tooltip-description-header");
      descHeader.textContent = game.i18n.localize("BG3.Hotbar.Tooltips.Description");
      content.appendChild(descHeader);

      const descContainer = document.createElement("div");
      descContainer.classList.add("tooltip-description-container");

      const descEl = document.createElement("div");
      descEl.classList.add("tooltip-description");
      descEl.textContent = game.i18n.localize("BG3.Hotbar.Tooltips.LoadingDescription");
      
      // Get roll data from the item
      const rollData = this.item.getRollData ? this.item.getRollData() : {};

      // Use enrichHTMLClean for consistent enrichment across all tooltips
      try {
        const enrichedHTML = await enrichHTMLClean(this.item.system.description.value, rollData, this.item);
        descEl.innerHTML = enrichedHTML || game.i18n.localize("BG3.Hotbar.Tooltips.NoDescription");
      } catch (err) {
        console.warn("BG3 Hotbar - Failed to enrich description:", err);
        descEl.textContent = game.i18n.localize("BG3.Hotbar.Tooltips.NoDescription");
      }

      descContainer.appendChild(descEl);
      content.appendChild(descContainer);
    } else {
      const noDesc = document.createElement("div");
      noDesc.classList.add("tooltip-description");
      noDesc.textContent = game.i18n.localize("BG3.Hotbar.Tooltips.NoDescription");
      content.appendChild(noDesc);
    }
    
    this.element.appendChild(content);
  }

  positionTooltip(event) {
    if (!this.element || !event) return;

    const padding = { right: 15, bottom: 10 }; 
    const tooltipRect = this.element.getBoundingClientRect();
    
    // Default target: right of cursor
    let targetLeft = event.clientX + padding.right;
    // Default target: above cursor
    let targetTop = event.clientY - padding.bottom - tooltipRect.height;

    // Check screen bounds
    if (targetLeft + tooltipRect.width > window.innerWidth) {
        // Flip horizontally if needed
        targetLeft = event.clientX - padding.right - tooltipRect.width;
    }
    if (targetTop < 0) {
        // Flip vertically if needed (place below cursor)
        targetTop = event.clientY + 20;
        // Re-check bottom bound after vertical flip
        if (targetTop + tooltipRect.height > window.innerHeight) {
             targetTop = window.innerHeight - tooltipRect.height - 5; // Place at bottom edge
        }
    } else if (targetTop + tooltipRect.height > window.innerHeight) {
         // Ensure it doesn't go off bottom even in default placement
         targetTop = window.innerHeight - tooltipRect.height - 5;
    }
    // Ensure it doesn't go off left edge
    if (targetLeft < 0) targetLeft = 5;
    
    this.element.style.setProperty('--tooltip-left', `${targetLeft}px`);
    this.element.style.setProperty('--tooltip-top', `${targetTop}px`);
    this.element.classList.add("visible");
  }

  _setupEventListeners() {
    this.element.addEventListener("mousedown", (evt) => {
      if (evt.button === 1) {
        evt.preventDefault();
        evt.stopPropagation();
        if (this._pinned) this.unpin();
        else this.pin();
      } else if (evt.button === 0 && this._pinned) {
        evt.preventDefault();
        evt.stopPropagation();
        this.onMouseDown(evt);
      }
    });

    // Remove throttling variables
    // let lastMoveTime = 0; 
    // const MOVE_THROTTLE = 50; 

    const onMouseMove = (evt) => {
      // Store the latest mouse move event - still potentially useful if needed elsewhere
      // this._lastMouseMoveEvent = evt; 
      
      // Check element validity and state
      if (!this.element || this._pinned || this._isDragging) return;
      
      // Remove throttle check
      // const now = Date.now();
      // if (now - lastMoveTime < MOVE_THROTTLE) return;
      // lastMoveTime = now;
      
      // Directly call onCellMouseMove with the current event
      this.onCellMouseMove(evt); 
    };
    this._cell.addEventListener("mousemove", onMouseMove);

    const onMouseLeave = () => {
      if (!this._pinned || this._isDragging) {
        setTimeout(() => {
          if (!this.element?.matches(':hover')) {
            this.remove();
          }
        }, 50);
      } else {
        this.highlight(false);
      }
    };
    this._cell.addEventListener("mouseleave", onMouseLeave);
    this._cell.addEventListener("mousedown", (evt) => {
      if (evt.button === 1) {
        evt.preventDefault();
        evt.stopPropagation();
        if (this._pinned) this.unpin();
        else this.pin();
      }
    });
    this._eventHandlers = { onMouseMove, onMouseLeave };
  }

  onMouseDown(evt) {
    if (evt.button !== 0) return;
    evt.preventDefault();
    if (!this._pinned) return;
    this.element.classList.add("dragging");
    const startX = evt.clientX, startY = evt.clientY;
    const origRect = this.element.getBoundingClientRect();
    const origLeft = origRect.left, origTop = origRect.top;
    const onDragMove = (e) => {
      let newX = origLeft + e.clientX - startX;
      let newY = origTop + e.clientY - startY;
      const tooltipRect = this.element.getBoundingClientRect();
      if (newX + tooltipRect.width > window.innerWidth - 10)
        newX = window.innerWidth - tooltipRect.width - 10;
      if (newY + tooltipRect.height > window.innerHeight - 10)
        newY = window.innerHeight - tooltipRect.height - 10;
      if (newX < 10) newX = 10;
      if (newY < 10) newY = 10;
      this.element.style.setProperty('--tooltip-left', `${newX}px`);
      this.element.style.setProperty('--tooltip-top', `${newY}px`);
    };
    const onDragEnd = () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragEnd);
      this.element.classList.remove("dragging");
    };
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
  }

  onCellMouseMove(evt) {
    // Mouse move updates should be immediate, no timeout needed here
    if (!this.element || this._pinned || this._isDragging) return;
    
    const padding = { right: 15, bottom: 10 }; 
    const tooltipRect = this.element.getBoundingClientRect();
    
    // Default target: right of cursor
    let targetLeft = evt.clientX + padding.right;
    // Default target: above cursor
    let targetTop = evt.clientY - padding.bottom - tooltipRect.height;

    // Check screen bounds
    if (targetLeft + tooltipRect.width > window.innerWidth) {
        targetLeft = evt.clientX - padding.right - tooltipRect.width;
    }
    if (targetTop < 0) {
        targetTop = evt.clientY + 20; // Correctly use evt
        if (targetTop + tooltipRect.height > window.innerHeight) {
             targetTop = window.innerHeight - tooltipRect.height - 5;
        }
    } else if (targetTop + tooltipRect.height > window.innerHeight) {
         targetTop = window.innerHeight - tooltipRect.height - 5;
    }
    if (targetLeft < 0) targetLeft = 5;
    
    this.element.style.setProperty('--tooltip-left', `${targetLeft}px`);
    this.element.style.setProperty('--tooltip-top', `${targetTop}px`);
  }

  pin() {
    if (!this.element) return;
    this._pinned = true;
    this.element.classList.add("pinned");
    BaseTooltip.registerPinnedTooltip(this.item, this);
  }

  unpin() {
    if (!this.element) return;
    this._pinned = false;
    this.element.classList.remove("pinned");
    BaseTooltip.unregisterPinnedTooltip(this.item);
    
    // Clear cell reference to this tooltip
    if (this._cell && this._cell._hotbarTooltip === this) {
      this._cell._hotbarTooltip = null;
    }
    
    this.remove();
  }

  remove() {
    if (this._contentUpdateTimeout) {
      clearTimeout(this._contentUpdateTimeout);
      this._contentUpdateTimeout = null;
    }
    
    // Clean up observers
    this.element?.querySelectorAll("*").forEach((el) => {
      if (el._bgObserver) {
        el._bgObserver.disconnect();
        delete el._bgObserver;
      }
    });
    
    // Clean up tooltip registrations
    if (BaseTooltip.currentTooltips.get(this.tooltipType) === this) {
      BaseTooltip.currentTooltips.delete(this.tooltipType);
    }
    if (this._pinned) {
      BaseTooltip.unregisterPinnedTooltip(this.item);
    }
    
    // Clean up cell reference
    if (this._cell) {
      if (this._eventHandlers) {
        this._cell.removeEventListener("mousemove", this._eventHandlers.onMouseMove);
        this._cell.removeEventListener("mouseleave", this._eventHandlers.onMouseLeave);
      }
      if (this._cell._hotbarTooltip === this) {
        this._cell._hotbarTooltip = null;
      }
      if (this._cell._hotbarTooltips?.has(this.tooltipType)) {
        this._cell._hotbarTooltips.delete(this.tooltipType);
      }
      if (this._cell._hotbarTooltips?.size === 0) {
        delete this._cell._hotbarTooltips;
      }
      this._cell = null;
    }
    
    // Remove from DOM
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      const container = document.getElementById("bg3-tooltip-container");
      if (container && !container.hasChildNodes()) {
        container.remove();
      }
    }
    
    this.element = null;
  }

  highlight(show) {
    if (!this.element) return;
    if (this._isHighlighted === show) return;
    this._isHighlighted = show;
    if (show) this.element.classList.add("highlighted");
    else this.element.classList.remove("highlighted");
  }

  unhighlight() {
    this.highlight(false);
  }
}
