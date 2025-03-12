// FeatureTooltip.js
import { BaseTooltip } from "./BaseTooltip.js";
import { getItemDetails, enrichHTMLClean } from "../utils/tooltipUtils.js";

export class FeatureTooltip extends BaseTooltip {
  buildContent() {
    if (!this.item) return;

    this.element.dataset.type = "feature";

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

    // Common Details
    const details = getItemDetails(this.item);
    if (Object.keys(details).length > 0) {
      const detailsEl = document.createElement("div");
      detailsEl.classList.add("tooltip-details-list");

      const detailsHTML = [];
      if (details.castingTime)
        detailsHTML.push(`<div><strong>Action:</strong> ${details.castingTime}</div>`);
      if (details.range)
        detailsHTML.push(`<div><strong>Range:</strong> ${details.range}</div>`);
      if (details.target)
        detailsHTML.push(`<div><strong>Target:</strong> ${details.target}</div>`);
      if (details.duration)
        detailsHTML.push(`<div><strong>Duration:</strong> ${details.duration}</div>`);

      // Activity-specific details for damage/healing
      if (details.activity) {
        if (details.activity.damage?.parts?.length > 0) {
          const damagePart = details.activity.damage.parts[0];
          if (damagePart.number && damagePart.denomination) {
            let damageText;
            if (game.settings.get("bg3-inspired-hotbar", "showDamageRanges")) {
              const min = parseInt(damagePart.number);
              const max = parseInt(damagePart.number) * parseInt(damagePart.denomination);
              damageText = `${min}-${max}`;
            } else {
              damageText = `${damagePart.number}d${damagePart.denomination}`;
            }
            if (damagePart.bonus) damageText += ` + ${damagePart.bonus}`;
            if (damagePart.types?.length > 0) {
              damageText += ` (${damagePart.types.join(", ")})`;
            }
            detailsHTML.push(`<div><strong>Damage:</strong> ${damageText}</div>`);
          }
        }
        if (details.activity.healing) {
          const healing = details.activity.healing;
          if (healing.number && healing.denomination) {
            let healText;
            if (game.settings.get("bg3-inspired-hotbar", "showDamageRanges")) {
              const min = parseInt(healing.number);
              const max = parseInt(healing.number) * parseInt(healing.denomination);
              healText = `${min}-${max}`;
            } else {
              healText = `${healing.number}d${healing.denomination}`;
            }
            if (healing.bonus) healText += ` + ${healing.bonus}`;
            if (healing.types?.length > 0) {
              healText += ` (${healing.types.join(", ")})`;
            }
            detailsHTML.push(`<div><strong>Healing:</strong> ${healText}</div>`);
          } else if (healing.custom?.enabled && healing.custom.formula) {
            detailsHTML.push(`<div><strong>Healing:</strong> ${healing.custom.formula}</div>`);
          }
        }
      }

      if (this.item.system?.uses) {
        detailsHTML.push(
          `<div><strong>Uses:</strong> ${this.item.system.uses.value || 0}/${
            this.item.system.uses.max || 0
          }</div>`
        );
      }

      if (detailsHTML.length > 0) {
        detailsEl.innerHTML = detailsHTML.join("");
        content.appendChild(detailsEl);
      }
    }

    // Description Section
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
      content.appendChild(descContainer);

      const description = this.item.system.description.value;
      const rollData = this.item.getRollData ? this.item.getRollData() : {};
      enrichHTMLClean(description, rollData).then((cleanedHTML) => {
        descEl.innerHTML = cleanedHTML || "No description available.";
      });
    } else {
      const noDesc = document.createElement("div");
      noDesc.classList.add("tooltip-description");
      noDesc.textContent = "No description available.";
      content.appendChild(noDesc);
    }

    this.element.appendChild(content);
  }
}
