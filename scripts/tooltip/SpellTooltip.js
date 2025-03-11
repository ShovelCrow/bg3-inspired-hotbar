// SpellTooltip.js

import { BaseTooltip } from "./BaseTooltip.js";
import { getSpellLevelString, getSpellSchool, getItemDetails } from "../utils/tooltipUtils.js";

export class SpellTooltip extends BaseTooltip {
  buildContent() {
    // Early return if no item data
    if (!this.item) return;

    // Set tooltip type
    this.element.dataset.type = "spell";

    // Get details early for preparation info
    const details = getItemDetails(this.item.selectedActivity?.data || this.item);

    // Add preparation tag if present
    if (details.preparation) {
      const prepTag = document.createElement("div");
      prepTag.classList.add("tooltip-preparation-tag");
      prepTag.textContent = details.preparation;
      this.element.appendChild(prepTag);
    }

    // Icon
    const icon = document.createElement("img");
    icon.src = this.item.img || this.item.icon || "";
    icon.alt = this.item.name || "";
    icon.classList.add("tooltip-icon");
    this.element.appendChild(icon);

    // Name (show activity name if selected)
    const nameEl = document.createElement("div");
    nameEl.classList.add("tooltip-name");
    if (this.item.selectedActivity) {
      const activity = this.item.selectedActivity.data;
      nameEl.textContent = `${activity.name || "Activity"} (${this.item.name})`;
    } else {
      nameEl.textContent = this.item.name || "";
    }
    this.element.appendChild(nameEl);

    // Spell level and school
    const level = this.item.system?.level ?? 0;
    const school = this.item.system?.school || "";
    const levelStr = getSpellLevelString(level);
    const schoolStr = getSpellSchool(school);

    const infoEl = document.createElement("div");
    infoEl.classList.add("tooltip-spell-info");
    infoEl.textContent = `${levelStr}${schoolStr ? ` - ${schoolStr}` : ''}`;
    this.element.appendChild(infoEl);

    // Spell Components and Special Properties
    const componentsEl = document.createElement("div");
    componentsEl.classList.add("tooltip-spell-components");
    
    const components = [];
    const specialProps = [];

    // Debug: Log the raw spell data
    console.log("Spell data for", this.item.name, {
        system: this.item.system,
        properties: this.item.system?.properties,
        materials: this.item.system?.materials
    });

    // Safely get properties with validation and convert Set to Array if needed
    const properties = this.item.system?.properties ? 
        (this.item.system.properties instanceof Set ? 
            Array.from(this.item.system.properties) : 
            this.item.system.properties) : 
        [];
    console.log("Spell properties array for", this.item.name, properties);

    // Only process properties if they exist
    if (properties.length > 0) {
        // Handle components
        if (properties.includes("vocal")) components.push("V");
        if (properties.includes("somatic")) components.push("S");
        if (properties.includes("material")) {
            const materials = this.item.system?.materials;
            console.log("Material components for", this.item.name, materials);
            if (materials?.value) {
                const cost = materials.cost ? ` (${materials.cost}gp)` : '';
                components.push(`M${cost}`);
            } else {
                components.push("M");
            }
        }

        // Handle special properties
        if (properties.includes("concentration")) specialProps.push("Concentration");
        if (properties.includes("ritual")) specialProps.push("Ritual");
    } else {
        console.warn("No valid spell properties found for", this.item.name);
    }
    
    let componentText = components.join(", ");
    if (specialProps.length > 0) {
        componentText += ` • ${specialProps.join(" • ")}`;
    }
    
    // Debug: Log the final component text
    console.log("Final component text for", this.item.name, componentText);

    if (componentText) {
      componentsEl.textContent = componentText;
      this.element.appendChild(componentsEl);
    }

    // Get details for display
    const detailsEl = document.createElement("div");
    detailsEl.classList.add("tooltip-details-list");

    // Add activity-specific data attributes if available
    if (this.item.selectedActivity) {
      detailsEl.dataset.activityId = this.item.selectedActivity.id;
    }

    // Add damage/healing if present in spell data or activities
    let effectsHtml = [];

    // Add material components description if enabled in settings and present
    if (game.settings.get('bg3-inspired-hotbar', 'showMaterialDescription')) {
        console.log("Material description check for", this.item.name, {
            settingEnabled: true,
            hasMaterialProperty: properties.includes("material"),
            materials: this.item.system?.materials,
            materialsValue: this.item.system?.materials?.value
        });
        
        if (properties.includes("material") && this.item.system?.materials?.value) {
            effectsHtml.push(`<div><strong>Materials:</strong> ${this.item.system.materials.value}</div>`);
        }
    }
    
    // Check spell data first
    if (this.item.system?.damage?.parts?.length > 0) {
        const damagePart = this.item.system.damage.parts[0];
        let damageText;
        
        if (game.settings.get('bg3-inspired-hotbar', 'showDamageRanges')) {
            // Convert dice notation to range
            const diceMatch = damagePart[0].match(/(\d+)d(\d+)/);
            if (diceMatch) {
                const [_, numDice, diceSize] = diceMatch;
                const min = parseInt(numDice);
                const max = parseInt(numDice) * parseInt(diceSize);
                damageText = `${min}-${max}`;
            } else {
                // If it's not dice notation, use as is
                damageText = damagePart[0];
            }
        } else {
            damageText = damagePart[0];
        }

        // Add damage type if present
        if (damagePart[1]) {
            damageText += ` ${damagePart[1]}`;
        }
        
        effectsHtml.push(`<div><strong>Damage:</strong> ${damageText}</div>`);
    }

    // Build and set the HTML content
    const contentHtml = `
      ${details.castingTime ? `<div><strong>Casting Time:</strong> ${details.castingTime}</div>` : ''}
      ${details.range ? `<div><strong>Range:</strong> ${details.range}</div>` : ''}
      ${details.target ? `<div><strong>Target:</strong> ${details.target}</div>` : ''}
      ${details.duration ? `<div><strong>Duration:</strong> ${details.duration}</div>` : ''}
      ${effectsHtml.join('')}
    `.trim();

    detailsEl.innerHTML = contentHtml;
    this.element.appendChild(detailsEl);

    // Description header
    const descHeader = document.createElement("div");
    descHeader.classList.add("tooltip-description-header");
    descHeader.textContent = "Description";
    this.element.appendChild(descHeader);

    // Description container
    const descContainer = document.createElement("div");
    descContainer.classList.add("tooltip-description-container");
    const descEl = document.createElement("div");
    descEl.textContent = "Loading description...";
    descContainer.appendChild(descEl);
    this.element.appendChild(descContainer);

    // Get description - if we have a selected activity, use its description
    const description = this.item.selectedActivity?.data?.description?.value || 
                       this.item.system?.description?.value || "";

    // Prepare roll data with activity context
    const rollData = this.item.getRollData ? this.item.getRollData() : {};
    if (this.item.selectedActivity) {
      rollData.activity = this.item.selectedActivity.id;
      // Include activity-specific data for lookups
      Object.assign(rollData, {
        save: this.item.selectedActivity.data.save || {},
        range: this.item.selectedActivity.data.range || {},
        target: this.item.selectedActivity.data.target || {},
        damage: this.item.selectedActivity.data.damage || {},
        duration: this.item.selectedActivity.data.duration || {}
      });
    }

    // Enrich HTML asynchronously with enhanced context
    TextEditor.enrichHTML(description, {
      rollData: rollData,
      secrets: false,
      entities: true,
      async: true,
      relativeTo: this.item, // Ensure proper context for lookups
      activityId: this.item.selectedActivity?.id // Pass activity ID for custom enrichers
    }).then(enrichedDescription => {
      descEl.innerHTML = enrichedDescription || "No description available.";
    });
  }
}
