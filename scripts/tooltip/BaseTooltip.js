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
    if (this.pendingTooltipTimers.has(tooltipType)) {
      clearTimeout(this.pendingTooltipTimers.get(tooltipType));
      this.pendingTooltipTimers.delete(tooltipType);
    }
    const existingTooltip = this.currentTooltips.get(tooltipType);
    if (existingTooltip && !existingTooltip._pinned) {
      existingTooltip.remove();
      this.currentTooltips.delete(tooltipType);
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
    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        if (!document.body.classList.contains("dragging-active")) {
          const tooltip = await TooltipFactory.create(item);
          if (tooltip) {
            tooltip.attach(cell, event);
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

  attach(cell, event) {
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
    this.buildContent();
    this._setupEventListeners();
    tooltipContainer.appendChild(this.element);
    this.positionTooltip(event);
    cell._hotbarTooltips.set(this.tooltipType, this);
  }

  buildContent() {
    if (!this.item) return;
    
    // Clear any pending content update
    if (this._contentUpdateTimeout) {
      clearTimeout(this._contentUpdateTimeout);
    }

    // Debounce the content update
    this._contentUpdateTimeout = setTimeout(() => {
      this._actuallyBuildContent();
    }, 100); // 100ms debounce
  }

  _actuallyBuildContent() {
    if (!this.item || !this.element) return;
    
    // Clear existing content
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }

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
    const detailsHTML = [];
    if (details.castingTime) detailsHTML.push(`<div><strong>Action:</strong> ${details.castingTime}</div>`);
    if (details.range) detailsHTML.push(`<div><strong>Range:</strong> ${details.range}</div>`);
    if (details.target) detailsHTML.push(`<div><strong>Target:</strong> ${details.target}</div>`);
    if (details.duration) detailsHTML.push(`<div><strong>Duration:</strong> ${details.duration}</div>`);
    if (detailsHTML.length > 0) {
      detailsEl.innerHTML = detailsHTML.join("");
      content.appendChild(detailsEl);
    }

    // Description
    if (this.item.system?.description?.value) {
      const descHeader = document.createElement("div");
      descHeader.classList.add("tooltip-description-header");
      descHeader.textContent = "Description";
      content.appendChild(descHeader);

      const descContainer = document.createElement("div");
      descContainer.classList.add("tooltip-description-container");

      const descEl = document.createElement("div");
      descEl.classList.add("tooltip-description");
      descEl.textContent = "Loading description...";
      descContainer.appendChild(descEl);

      // Prepare roll data and enrich description using our helper
      const rollData = this.item.getRollData ? this.item.getRollData() : {};
      if (this.item.selectedActivity) {
        rollData.activity = this.item.selectedActivity.id;
        Object.assign(rollData, {
          save: this.item.selectedActivity.data.save || {},
          range: this.item.selectedActivity.data.range || {},
          target: this.item.selectedActivity.data.target || {},
          damage: this.item.selectedActivity.data.damage || {},
          duration: this.item.selectedActivity.data.duration || {}
        });
      }
      enrichHTMLClean(this.item.system.description.value, rollData).then((cleanedHTML) => {
        descEl.innerHTML = cleanedHTML || "No description available.";
      });
      content.appendChild(descContainer);
    } else {
      const noDesc = document.createElement("div");
      noDesc.classList.add("tooltip-description");
      noDesc.textContent = "No description available.";
      content.appendChild(noDesc);
    }

    this.element.appendChild(content);
  }

  positionTooltip(event) {
    const padding = { right: 15, top: -10 };
    requestAnimationFrame(() => {
      if (!this.element) return;
      const tooltipRect = this.element.getBoundingClientRect();
      let left = event.clientX + padding.right;
      let top = event.clientY + padding.top - tooltipRect.height;
      if (left + tooltipRect.width > window.innerWidth) {
        left = event.clientX - tooltipRect.width - padding.right;
      }
      if (top < 0) top = event.clientY + 20;
      this.element.style.left = `${left}px`;
      this.element.style.top = `${top}px`;
      this.element.classList.add("visible");
    });
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

    // Throttle mousemove events
    let lastMoveTime = 0;
    const MOVE_THROTTLE = 50; // Only update every 50ms
    
    const onMouseMove = (evt) => {
      if (!this.element || this._pinned || this._isDragging) return;
      
      const now = Date.now();
      if (now - lastMoveTime < MOVE_THROTTLE) return;
      lastMoveTime = now;
      
      this.onCellMouseMove(evt);
    };
    
    this._cell.addEventListener("mousemove", onMouseMove);
    
    const onMouseLeave = () => {
      if (!this._pinned || this._isDragging) {
        // Add a small delay before removing to prevent flicker
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

  onCellMouseMove(evt) {
    if (!this.element || this._pinned || this._isDragging) return;
    const padding = { right: 15, top: -10 };
    const tooltipRect = this.element.getBoundingClientRect();
    let left = evt.clientX + padding.right;
    let top = evt.clientY + padding.top - tooltipRect.height;
    if (left + tooltipRect.width > window.innerWidth)
      left = evt.clientX - tooltipRect.width - padding.right;
    if (top < 0) top = evt.clientY + 20;
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
  }

  onCellMouseLeave() {
    if (!this._pinned || this._isDragging) this.remove();
    else this.highlight(false);
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
    this.remove();
  }

  remove() {
    if (this._contentUpdateTimeout) {
      clearTimeout(this._contentUpdateTimeout);
      this._contentUpdateTimeout = null;
    }
    
    this.element?.querySelectorAll("*").forEach((el) => {
      if (el._bgObserver) {
        el._bgObserver.disconnect();
        delete el._bgObserver;
      }
    });
    if (BaseTooltip.currentTooltips.get(this.tooltipType) === this) {
      BaseTooltip.currentTooltips.delete(this.tooltipType);
    }
    if (this._pinned) {
      BaseTooltip.unregisterPinnedTooltip(this.item);
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      const container = document.getElementById("bg3-tooltip-container");
      if (container && !container.hasChildNodes()) {
        container.remove();
      }
    }
    if (this._cell) {
      if (this._eventHandlers) {
        this._cell.removeEventListener("mousemove", this._eventHandlers.onMouseMove);
        this._cell.removeEventListener("mouseleave", this._eventHandlers.onMouseLeave);
      }
      this._cell._hotbarTooltips?.delete(this.tooltipType);
      if (this._cell._hotbarTooltips?.size === 0) {
        delete this._cell._hotbarTooltips;
      }
      this._cell = null;
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
