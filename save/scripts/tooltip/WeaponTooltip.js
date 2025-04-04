// WeaponTooltip.js
import { BaseTooltip } from "./BaseTooltip.js";
import { getItemDetails, enrichHTMLClean } from "../utils/tooltipUtils.js";

export class WeaponTooltip extends BaseTooltip {
  async buildContent() {
    if (!this.item) return;

    this.element.dataset.type = "weapon";
    
    // Clear existing content
    this.element.innerHTML = "";
    
    // Create content wrapper
    const content = document.createElement("div");
    content.classList.add("tooltip-content");

    // Icon and Name
    const icon = document.createElement("img");
    icon.src = this.item.img || this.item.icon || "";
    icon.alt = this.item.name || "";
    icon.classList.add("tooltip-icon");
    content.appendChild(icon);

    const nameEl = document.createElement("div");
    nameEl.classList.add("tooltip-name");
    nameEl.textContent = this.item.name || "";
    content.appendChild(nameEl);

    const details = getItemDetails(this.item);
    const detailsEl = document.createElement("div");
    detailsEl.classList.add("tooltip-details-list");
    if (details.activityId) {
      detailsEl.dataset.activityId = details.activityId;
    }

    const damageData = this.item.system?.damage;
    let damageText = "N/A";
    if (damageData?.base && damageData.base.number && damageData.base.denomination) {
      if (game.settings.get("bg3-inspired-hotbar", "showDamageRanges")) {
        const min = parseInt(damageData.base.number);
        const max = parseInt(damageData.base.number) * parseInt(damageData.base.denomination);
        damageText = `${min}-${max}`;
      } else {
        damageText = `${damageData.base.number}d${damageData.base.denomination}`;
      }
      if (damageData.base.types && damageData.base.types.length > 0) {
        damageText += ` (${damageData.base.types.join(", ")})`;
      }
    }

    let versatileText = "";
    if (damageData?.versatile && damageData.versatile.number && damageData.versatile.denomination) {
      if (game.settings.get("bg3-inspired-hotbar", "showDamageRanges")) {
        const min = parseInt(damageData.versatile.number);
        const max = parseInt(damageData.versatile.number) * parseInt(damageData.versatile.denomination);
        versatileText = `Versatile: ${min}-${max}`;
      } else {
        versatileText = `Versatile: ${damageData.versatile.number}d${damageData.versatile.denomination}`;
      }
    }

    detailsEl.innerHTML = `
      ${details.castingTime ? `<div><strong>Action:</strong> ${details.castingTime}</div>` : ""}
      ${details.range ? `<div><strong>Range:</strong> ${details.range}</div>` : ""}
      <div><strong>Damage:</strong> ${damageText}</div>
      ${versatileText ? `<div><strong>${versatileText}</strong></div>` : ""}
      ${this.item.system?.properties && this.item.system.properties.length ? `<div><strong>Properties:</strong> ${this.item.system.properties.join(', ')}</div>` : ""}
    `;
    content.appendChild(detailsEl);

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
    content.appendChild(descContainer);

    // Add the content wrapper to the element
    this.element.appendChild(content);

    const description = this.item.system?.description?.value || "";
    const rollData = this.item.getRollData ? this.item.getRollData() : {};
    
    try {
      const cleanedHTML = await enrichHTMLClean(description, rollData, this.item);
      descEl.innerHTML = cleanedHTML || "No description available.";
    } catch (err) {
      console.warn("BG3 Hotbar - Failed to enrich weapon description:", err);
      descEl.textContent = "No description available.";
    }
  }
}
