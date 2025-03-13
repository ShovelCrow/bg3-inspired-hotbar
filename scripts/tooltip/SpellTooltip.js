// SpellTooltip.js
import { BaseTooltip } from "./BaseTooltip.js";
import { getSpellLevelString, getSpellSchool, getItemDetails, enrichHTMLClean } from "../utils/tooltipUtils.js";
import { CONFIG } from "../utils/config.js";

export class SpellTooltip extends BaseTooltip {
  async buildContent() {
    if (!this.item) return;

    this.element.dataset.type = "spell";
    const content = document.createElement("div");
    content.classList.add("tooltip-content");

    // Preparation Tag (if available)
    const details = getItemDetails(this.item.selectedActivity?.data || this.item);
    if (details.preparation) {
      const prepTag = document.createElement("div");
      prepTag.classList.add("tooltip-preparation-tag");
      prepTag.textContent = details.preparation;
      content.appendChild(prepTag);
    }

    // Icon
    const icon = document.createElement("img");
    icon.src = this.item.img || this.item.icon || "";
    icon.alt = this.item.name || "";
    icon.classList.add("tooltip-icon");
    content.appendChild(icon);

    // Name (with activity info if selected)
    const nameEl = document.createElement("div");
    nameEl.classList.add("tooltip-name");
    if (this.item.selectedActivity) {
      const activity = this.item.selectedActivity.data;
      nameEl.textContent = `${activity.name || "Activity"} (${this.item.name})`;
    } else {
      nameEl.textContent = this.item.name || "";
    }
    content.appendChild(nameEl);

    // Spell Level and School
    const level = this.item.system?.level ?? 0;
    const school = this.item.system?.school || "";
    const levelStr = getSpellLevelString(level);
    const schoolStr = getSpellSchool(school);
    const spellInfo = document.createElement("div");
    spellInfo.classList.add("tooltip-spell-info");
    spellInfo.textContent = `${levelStr}${schoolStr ? ` - ${schoolStr}` : ''}`;
    content.appendChild(spellInfo);

    // Spell Components and Special Properties
    const componentsEl = document.createElement("div");
    componentsEl.classList.add("tooltip-spell-components");
    const components = [];
    const specialProps = [];
    const properties = this.item.system?.properties 
      ? (this.item.system.properties instanceof Set 
          ? Array.from(this.item.system.properties) 
          : this.item.system.properties)
      : [];
    if (properties.length > 0) {
      if (properties.includes("vocal")) components.push("V");
      if (properties.includes("somatic")) components.push("S");
      if (properties.includes("material")) {
        const materials = this.item.system?.materials;
        const showMaterialDesc = game.settings.get('bg3-inspired-hotbar', 'showMaterialDescription');
        if (materials?.value && showMaterialDesc) {
          const cost = materials.cost ? ` (${materials.cost}gp)` : '';
          components.push(`M: ${materials.value}${cost}`);
        } else {
          const cost = materials?.cost ? ` (${materials.cost}gp)` : '';
          components.push(`M${cost}`);
        }
      }
      if (properties.includes("concentration")) specialProps.push("Concentration");
      if (properties.includes("ritual")) specialProps.push("Ritual");
    }
    
    // Create separate elements for components and special properties
    if (components.length > 0) {
      const compDiv = document.createElement("div");
      compDiv.textContent = components.join(", ");
      componentsEl.appendChild(compDiv);
    }
    
    if (specialProps.length > 0) {
      const specialDiv = document.createElement("div");
      specialDiv.classList.add("tooltip-special-properties");
      specialDiv.textContent = specialProps.join(" • ");
      componentsEl.appendChild(specialDiv);
    }
    
    if (components.length > 0 || specialProps.length > 0) {
      content.appendChild(componentsEl);
    }

    // Additional Spell Details
    const detailsEl = document.createElement("div");
    detailsEl.classList.add("tooltip-details-list");
    let extraDetails = "";
    extraDetails += details.castingTime ? `<div><strong>Casting Time:</strong> ${details.castingTime}</div>` : "";
    extraDetails += details.range ? `<div><strong>Range:</strong> ${details.range}</div>` : "";
    extraDetails += details.target ? `<div><strong>Target:</strong> ${details.target}</div>` : "";
    extraDetails += details.duration ? `<div><strong>Duration:</strong> ${details.duration}</div>` : "";
    if (this.item.system?.damage?.parts?.length > 0) {
      const damagePart = this.item.system.damage.parts[0];
      let damageText = damagePart[0];
      if (damagePart[1]) damageText += ` ${damagePart[1]}`;
      extraDetails += `<div><strong>Damage:</strong> ${damageText}</div>`;
    }
    detailsEl.innerHTML = extraDetails;
    content.appendChild(detailsEl);

    // Description Section
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

    const description = this.item.selectedActivity?.data?.description?.value ||
                        this.item.system?.description?.value || "";
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

    // Use async/await and pass the item for proper embedding
    try {
      const cleanedHTML = await enrichHTMLClean(description, rollData, this.item);
      descEl.innerHTML = cleanedHTML || "No description available.";
    } catch (err) {
      console.warn("BG3 Hotbar - Failed to enrich spell description:", err);
      descEl.textContent = "No description available.";
    }

    this.element.appendChild(content);
  }
}
