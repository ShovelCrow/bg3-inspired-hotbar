/**
 * Converts a numeric spell level into an ordinal string or "Cantrip" if level 0.
 */
export function getSpellLevelString(level) {
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

/**
 * Maps abbreviated spell school codes to their full names.
 */
export function getSpellSchool(schoolCode) {
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

/**
 * Formats the activation/casting time information.
 */
export function formatCastingTime(activation, itemType) {
  if (!activation || !activation.type) return "N/A";
  const type = activation.type.charAt(0).toUpperCase() + activation.type.slice(1);
  return activation.value ? `${activation.value} ${type}` : type;
}

/**
 * Formats the target details for spells or features.
 */
export function formatSpellTarget(target, itemType) {
  if (!target) return "N/A";
  
  // Special handling for self-targeting (e.g. feats or equipment)
  if ((itemType === "feat" || itemType === "equipment") && target.affects?.type?.toLowerCase() === "self") {
    return "Self";
  }
  
  // Template targeting (commonly used with spells)
  if (target.template?.type) {
    const type = target.template.type.charAt(0).toUpperCase() + target.template.type.slice(1);
    return target.template.size && target.template.units 
      ? `${target.template.size} ${target.template.units} ${type}`.trim()
      : type;
  }
  
  // Creature or object targeting
  if (target.affects?.type) {
    let type = target.affects.type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^\s+/, '')
      .trim();
    
    type = type.charAt(0).toUpperCase() + type.slice(1);
    const count = target.affects.count ? `${target.affects.count} ` : "";
    const special = target.affects.special ? ` ${target.affects.special}` : "";
    return `${count}${type}${special}`.trim();
  }
  
  // SHOVEL
  if (target?.type) {
    if (target.type.toLowerCase() === "self") return "Self";

    let type = target.type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^\s+/, '')
      .trim();
    
    type = type.charAt(0).toUpperCase() + type.slice(1);
    const units = target.units && target.units.toLowerCase() !== "touch" ? `${target.units} ` : "";
    const value = target.value ? `${target.value} ` : "";
    return `${value}${units}${type}`.trim();
  }

  return "N/A";
}

/**
 * Formats a property value that might contain measurements or special values.
 */
export function formatSpellProperty(prop, itemType) {
  if (!prop) return "N/A";
  
  const propStr = String(prop.value || prop.units || prop.special).toLowerCase();
  if (propStr === "self") return "Self";
  if (propStr === "touch") return "Touch";
  
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
  
  if (prop.value && prop.units) {
    const measurementUnits = ['ft', 'feet', 'mi', 'mile', 'miles', 'm', 'meter', 'meters', 'km', 'yards', 'yd'];
    const firstWord = String(prop.value).toLowerCase();
    if (!measurementUnits.includes(firstWord)) {
      return `${String(prop.value).charAt(0).toUpperCase() + String(prop.value).slice(1)} ${prop.units}`.trim();
    }
    return `${prop.value} ${prop.units}`.trim();
  } else if (prop.value != null && prop.value !== "") {
    return String(prop.value).charAt(0).toUpperCase() + String(prop.value).slice(1);
  } else if (prop.units) {
    if (prop.units.toLowerCase() === "inst") return "Instantaneous";
    if (prop.units.toLowerCase() === "touch") return "Touch";
    return prop.units;
  } else if (prop.special) {
    return prop.special;
  }
  
  return "N/A";
}

/**
 * Gets the preparation mode string for spells.
 */
export function getSpellPreparationMode(preparation) {
  if (!preparation) return "";
  
  const modes = {
    "prepared": "Prepared",
    "pact": "Pact Magic",
    "innate": "Innate",
    "always": "Always Prepared",
    "atwill": "At Will"
  };
  
  return modes[preparation.mode] || "";
}

/**
 * Get consume
 */
export function getConsumeData(item) {
  // Get consume target and type
  const firstActivity = item?.system?.activities?.contents[0] ?? item?.system;
  const firstTarget = firstActivity?.consumption?.targets?.[0] ?? firstActivity?.consume;
  const consumeId = firstTarget?.target;
  const consumeType = firstTarget?.type;
  const consumeAmount = firstTarget?.value ?? firstTarget?.amount;

  if (!consumeId || !consumeType || consumeId === item.id) return {};

  // Return resources
  if (consumeType === "attribute") {
    const parentId = consumeId.substr(0, consumeId.lastIndexOf("."));
    const target = foundry.utils.getProperty(item.actor.system, parentId);

    if (target) {
      const text = `${target.value ?? "0"}${target.max ? `/${target.max}` : ""}`;
      return {
        text: text,
        title: `${text} (${target.label ?? ''})`,
        value: target.value ?? 0,
        max: target.max ?? 0
      };
    }
  } else {
    const target = item.actor.items?.get(consumeId);

    // Return charges
    if (target && (consumeType === "charges" || consumeType === "itemUses")) {
      const text = `${target.system.uses.value ?? "0"}${target.system.uses.max ? `/${target.system.uses.max}` : ""}`;
      return {
        text: text,
        title: `${text} (${target.name})`,
        value: target.system.uses.value ?? 0,
        max: target.system.uses.max ?? 0
      }
    }

    // Return quantity
    if (target?.system?.quantity) {
      const text = `${consumeAmount > 1 ? `${consumeAmount} ${game.i18n.localize("DND5E.of")} ` : ""}${target.system.quantity}`;
      return {
        text: text,
        title: `${text} (${target.name})`,
        value: target.system.quantity ?? 0
      }
    }
  }

  return {};
}

/**
 * Extracts common details for an item (spell, weapon, feature, etc.) by looking
 * through its activities first (as per dnd5e 4.0) and then falling back to legacy system data.
 */
export function getItemDetails(itemData) {
  if (!itemData) return {
    castingTime: "N/A",
    range: "N/A",
    target: "N/A",
    duration: "N/A",
    preparation: "",
    consume: {}
  };

  const preparation = itemData.type === "spell" ? getSpellPreparationMode(itemData.system?.preparation) : "";
  const activities = itemData.system?.activities || {};

  const findActivity = (predicate) => {
    const entry = Object.entries(activities).find(([id, act]) => predicate(act));
    return entry ? { _id: entry[0], ...entry[1] } : null;
  };

  let actionActivity = null;
  if (itemData.type === "weapon") {
    actionActivity = findActivity(act => act.type === "attack");
  }
  if (!actionActivity && Object.keys(activities).length > 0) {
    const firstId = Object.keys(activities)[0];
    actionActivity = { _id: firstId, ...activities[firstId] };
  }

  const activation = actionActivity && actionActivity.activation
    ? {
        type: actionActivity.activation.type || "none",
        value: actionActivity.activation.value,
        condition: actionActivity.activation.condition || "",
        activityId: actionActivity._id
      }
    : {
        type: itemData.system?.activation?.type || "none",
        value: itemData.system?.activation?.value,
        condition: itemData.system?.activation?.condition || ""
      };

  let range = {};
  if (actionActivity && actionActivity.range && !actionActivity.range.override) {
    range = {
      value: actionActivity.range.value || "",
      units: actionActivity.range.units || "",
      special: actionActivity.range.special || "",
      long: actionActivity.range.long || null,
      reach: itemData.system?.range?.reach || null,
      activityId: actionActivity._id
    };
  } else {
    range = {
      value: itemData.system?.range?.value || "",
      units: itemData.system?.range?.units || "",
      special: itemData.system?.range?.special || "",
      long: itemData.system?.range?.long || null,
      reach: itemData.system?.range?.reach || null
    };
  }

  let target = {};
  if (actionActivity && actionActivity.target && !actionActivity.target.override) {
    target = {
      ...actionActivity.target,
      activityId: actionActivity._id
    };
  } else {
    target = itemData.system?.target || {};
  }

  let duration = {};
  if (actionActivity && actionActivity.duration && !actionActivity.duration.override) {
    duration = {
      ...actionActivity.duration,
      activityId: actionActivity._id
    };
  } else {
    duration = itemData.system?.duration || {};
  }

  let consume = {};
  consume = getConsumeData(itemData);

  return {
    castingTime: formatCastingTime(activation, itemData.type),
    range: formatSpellProperty(range, itemData.type),
    target: formatSpellTarget(target, itemData.type),
    duration: formatSpellProperty(duration, itemData.type),
    activityId: actionActivity?._id,
    activity: actionActivity,
    preparation,
    consume
  };
}

/**
 * Formats attack data into the extended DND5E style format.
 * @param {Object} attackData - The attack data from the item.
 * @param {string} itemType - The type of item (weapon, spell, etc.)
 * @returns {string} Formatted attack string.
 */
export function formatExtendedAttack(attackData, itemType) {
  if (!attackData) return "N/A";

  const attackBonus = attackData.bonus ? `+${attackData.bonus}` : "+0";
  const attackType = itemType === "weapon" ? 
    (attackData.properties?.includes("ranged") ? "Ranged" : "Melee") : 
    "Spell";
  
  let rangeText = "";
  if (attackData.range) {
    if (attackData.range.reach) {
      rangeText = `, reach ${attackData.range.reach} ${attackData.range.units || 'ft'}`;
    }
    if (attackData.range.value) {
      rangeText = `, range ${attackData.range.value}/${attackData.range.long || attackData.range.value} ${attackData.range.units || 'ft'}`;
    }
  }

  return `${attackType} Attack Roll: [${attackBonus}]${rangeText}`;
}

/**
 * Formats damage data into the extended DND5E style format.
 * @param {Object} damageData - The damage data from the item.
 * @param {boolean} average - Whether to show average damage.
 * @returns {string} Formatted damage string.
 */
export function formatExtendedDamage(damageData, average = false) {
  if (!damageData?.base) return "N/A";

  const { number, denomination, types } = damageData.base;
  if (!number || !denomination) return "N/A";

  let damageText;
  if (average) {
    const avgDamage = Math.floor((number * (parseInt(denomination) + 1)) / 2);
    damageText = `${avgDamage}`;
  } else {
    damageText = `${number}d${denomination}`;
  }

  const damageType = types?.length > 0 ? ` ${types[0]}` : "";
  
  return `Hit: ${damageText} (${number}d${denomination})${damageType} damage`;
}

/**
 * Formats save data into the extended DND5E style format.
 * @param {Object} saveData - The save data from the item.
 * @param {string} ability - The ability to save with (str, dex, etc.).
 * @param {number} dc - The save DC.
 * @returns {string} Formatted save string.
 */
export function formatExtendedSave(saveData, ability, dc) {
  if (!saveData || !ability) return "N/A";
  
  const abilityNames = {
    str: "Strength",
    dex: "Dexterity",
    con: "Constitution",
    int: "Intelligence",
    wis: "Wisdom",
    cha: "Charisma"
  };

  const abilityName = abilityNames[ability.toLowerCase()] || ability;
  return dc ? `DC ${dc} ${abilityName} saving throw` : `[${abilityName}] saving throw`;
}

/**
 * Formats check data into the extended DND5E style format.
 * @param {Object} checkData - The check data.
 * @param {string} ability - The ability to check (str, dex, etc.).
 * @param {string} skill - Optional skill name.
 * @returns {string} Formatted check string.
 */
export function formatExtendedCheck(checkData, ability, skill) {
  if (!checkData || !ability) return "N/A";
  
  const abilityNames = {
    str: "Strength",
    dex: "Dexterity",
    con: "Constitution",
    int: "Intelligence",
    wis: "Wisdom",
    cha: "Charisma"
  };

  const abilityName = abilityNames[ability.toLowerCase()] || ability;
  return skill ? `${skill} (${abilityName}) check` : `${abilityName} check`;
}

/**
 * Formats heal data into the extended DND5E style format.
 * @param {Object} healData - The healing data.
 * @param {boolean} average - Whether to show average healing.
 * @returns {string} Formatted healing string.
 */
export function formatExtendedHeal(healData, average = false) {
  if (!healData?.number || !healData?.denomination) return "N/A";

  const { number, denomination, bonus = 0 } = healData;
  
  let healText;
  if (average) {
    const avgHeal = Math.floor((number * (parseInt(denomination) + 1)) / 2) + parseInt(bonus || 0);
    healText = `${avgHeal}`;
  } else {
    healText = `${number}d${denomination}${bonus ? ` + ${bonus}` : ''}`;
  }
  
  return `Heal: ${healText} hit points`;
}

/**
 * Formats lookup references in the DND5E style.
 * @param {string} type - The type of reference (rule, item, etc.).
 * @param {string} target - The target to look up.
 * @returns {string} Formatted lookup string.
 */
export function formatLookup(type, target) {
  if (!type || !target) return "N/A";
  return `[${target}]`;
}

/**
 * Formats reference links in the DND5E style.
 * @param {string} type - The type of reference (spell, feat, etc.).
 * @param {string} target - The target to reference.
 * @returns {string} Formatted reference string.
 */
export function formatReference(type, target) {
  if (!type || !target) return "N/A";
  return `[${type}: ${target}]`;
}

/**
 * Enriches HTML using Foundry's TextEditor and embed functionality.
 * @param {string} text - The raw description text.
 * @param {Object} rollData - The roll data context.
 * @param {Item} [item] - The optional item document for embedding
 * @returns {Promise<string>} The enriched HTML.
 */
export async function enrichHTMLClean(text, rollData = {}, item = null) {
  if (!text) return "";
  
  // Handle item embedding
  if (item?.uuid && !text.trim().startsWith("@Embed[")) {
    text = `@Embed[${item.uuid}]`;
  }

  // Process through Foundry's enricher
  const enriched = await TextEditor.enrichHTML(text, {
    rollData,
    secrets: false,
    documents: true,
    links: true,
    rolls: true,
    async: true
  });
  
  const div = document.createElement("div");
  div.innerHTML = enriched;

  // Remove figcaptions from embeds
  div.querySelectorAll("figcaption").forEach(el => el.remove());
  
  // Make all interactive elements clickable
  div.querySelectorAll('[data-roll-formula], [data-action], .inline-roll, .content-link, .entity-link').forEach(el => {
    el.style.cursor = 'pointer';
    el.style.pointerEvents = 'auto';
  });
  
  return div.innerHTML;
}
