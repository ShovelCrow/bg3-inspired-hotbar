import { CONFIG } from '../utils/config.js';

class AbilityCard {
    // Static configuration for DnD5e system skill mappings
    static SKILL_MAP = {
        "Athletics": "ath",
        "Acrobatics": "acr",
        "Sleight of Hand": "slt",
        "Stealth": "ste",
        "Arcana": "arc",
        "History": "his",
        "Investigation": "inv",
        "Nature": "nat",
        "Religion": "rel",
        "Animal Handling": "ani",
        "Insight": "ins",
        "Medicine": "med",
        "Perception": "prc",
        "Survival": "sur",
        "Deception": "dec",
        "Intimidation": "itm",
        "Performance": "prf",
        "Persuasion": "per"
    };

    // Static configuration for ability scores
    static ABILITY_CONFIG = {
        str: { label: "Strength", skills: ["Athletics"] },
        dex: { label: "Dexterity", skills: ["Acrobatics", "Sleight of Hand", "Stealth"] },
        con: { label: "Constitution", skills: [] },
        int: { label: "Intelligence", skills: ["Arcana", "History", "Investigation", "Nature", "Religion"] },
        wis: { label: "Wisdom", skills: ["Animal Handling", "Insight", "Medicine", "Perception", "Survival"] },
        cha: { label: "Charisma", skills: ["Deception", "Intimidation", "Performance", "Persuasion"] }
    };

    constructor(portraitContainer) {
        this.portraitContainer = portraitContainer;
        this.gridContainer = portraitContainer.gridContainer;
        this.element = null;
        this.isVisible = false;
        this.expandedAbility = null;
        this._createCard();
        this._setupClickOutside();
    }

    _createCard() {
        // Create the container with bg3-hud class
        const container = document.createElement("div");
        container.classList.add("bg3-hud");
        
        // Create the card element
        this.element = document.createElement("div");
        this.element.classList.add("ability-card", "menu-container");
        
        // Only set the data-container-index if it exists
        if (this.gridContainer?.index !== undefined) {
            this.element.setAttribute("data-container-index", this.gridContainer.index);
        }
        
        // Create a wrapper for the ability rows
        const abilityRowsWrapper = document.createElement("div");
        abilityRowsWrapper.classList.add("ability-rows-wrapper");
        this.element.appendChild(abilityRowsWrapper);

        // Create a separate container for popups as a sibling to the ability card
        const popupsWrapper = document.createElement("div");
        popupsWrapper.classList.add("popups-wrapper");

        container.appendChild(this.element);
        container.appendChild(popupsWrapper);
        
        this.render();
        return container;
    }

    _createAbilityScores() {
        let actor = null;

        // Try to get the actor from lastKnownActorId
        if (this.portraitContainer?.lastKnownActorId) {
            actor = game.actors.get(this.portraitContainer.lastKnownActorId);
        }

        // If not, then get it from the current token
        if (!actor) {
            const token = canvas.tokens.get(this.gridContainer?.ui?.manager?.currentTokenId);
            if (token?.actor) {
                actor = game.actors.get(token.actor.id);
                this.portraitContainer.lastKnownActorId = actor.id;
                console.log("Got actor from current token:", actor?.name);
            }
        }
            
        if (!actor) {
            return;
        }

        // Get the ability rows wrapper and popups wrapper
        const abilityRowsWrapper = this.element.querySelector('.ability-rows-wrapper');
        const popupsWrapper = this.element.parentNode.querySelector('.popups-wrapper');
        if (!abilityRowsWrapper || !popupsWrapper) {
            return;
        }

        // Clear existing popups
        while (popupsWrapper.firstChild) {
            popupsWrapper.removeChild(popupsWrapper.firstChild);
        }


        Object.entries(AbilityCard.ABILITY_CONFIG).forEach(([key, data]) => {
            const abilityRow = document.createElement("div");
            abilityRow.classList.add("menu-item", "ability-row");
            abilityRow.setAttribute('data-ability', key);

            const abilityScore = actor.system.abilities?.[key] || { value: 10, proficient: false };
            const mod = Math.floor((abilityScore.value - 10) / 2);
            const modString = mod >= 0 ? `+${mod}` : mod.toString();

            // Main ability score display
            const scoreDisplay = document.createElement("div");
            scoreDisplay.classList.add("ability-score-display");
            
            // Add tooltip to indicate click functionality
            scoreDisplay.title = "Click to show ability checks and saving throws";

            const labelSpan = document.createElement("span");
            labelSpan.classList.add("ability-label");
            if (abilityScore.proficient) {
                labelSpan.classList.add("proficient");
            }
            labelSpan.textContent = data.label;

            const modSpan = document.createElement("span");
            modSpan.classList.add("ability-value");
            if (abilityScore.proficient) {
                modSpan.classList.add("proficient");
            }
            modSpan.textContent = modString;

            scoreDisplay.appendChild(labelSpan);
            scoreDisplay.appendChild(modSpan);
            abilityRow.appendChild(scoreDisplay);
            
            // Create popups container in the popups wrapper
            const popupsContainer = document.createElement("div");
            popupsContainer.classList.add("popup-container");
            popupsContainer.setAttribute('data-ability', key);

            // Create skills popup if ability has associated skills
            if (data.skills.length > 0) {
                const skillsPopup = this._createSkillsPopup(actor, key, data.skills, mod);
                skillsPopup.classList.add("skills");
                popupsContainer.appendChild(skillsPopup);
            }

            // Create saving throw popup
            const savePopup = this._createSavePopup(actor, key, mod, abilityScore.proficient);
            savePopup.classList.add("saves");
            popupsContainer.appendChild(savePopup);

            popupsWrapper.appendChild(popupsContainer);

            // Toggle popups on click
            abilityRow.addEventListener("click", (e) => {
                e.stopPropagation();

                // If clicking the same ability that's already expanded, just close it
                if (this.expandedAbility === key) {
                    const currentPopups = popupsWrapper.querySelector(`.popup-container[data-ability="${key}"]`);
                    if (currentPopups) {
                        currentPopups.classList.remove("visible");
                        currentPopups.querySelectorAll('.popup-panel').forEach(panel => {
                            panel.classList.remove("visible");
                        });
                    }
                    abilityRow.classList.remove("expanded");
                    this.expandedAbility = null;
                    return;
                }

                // Close all popups and reset all ability rows
                popupsWrapper.querySelectorAll(".popup-container").forEach(popup => {
                    popup.classList.remove("visible");
                    popup.querySelectorAll('.popup-panel').forEach(panel => {
                        panel.classList.remove("visible");
                    });
                });
                abilityRowsWrapper.querySelectorAll(".ability-row").forEach(row => {
                    row.classList.remove("expanded");
                });

                // Get the clicked row's position relative to the popups wrapper
                const rowRect = abilityRow.getBoundingClientRect();
                const wrapperRect = popupsWrapper.getBoundingClientRect();
                const scale = window.getComputedStyle(abilityRow).getPropertyValue("--bg3-scale-ui");
                
                // Position and show the popup
                const targetPopups = popupsWrapper.querySelector(`.popup-container[data-ability="${key}"]`);
                if (targetPopups) {
                    // Position the popup container at the same height as the ability row
                    targetPopups.style.top = `${(rowRect.top - wrapperRect.top) * (1 / scale)}px`;
                    targetPopups.classList.add("visible");
                    targetPopups.querySelectorAll('.popup-panel').forEach(panel => {
                        panel.classList.add("visible");
                    });
                }
                
                abilityRow.classList.add("expanded");
                this.expandedAbility = key;
            });

            abilityRowsWrapper.appendChild(abilityRow);
        });
    }

    _createSkillsPopup(actor, abilityKey, skills, abilityMod) {
        const popup = document.createElement("div");
        popup.classList.add("popup-panel");

        skills.forEach(skillName => {
            // Get the system skill key from our mapping
            const systemSkillKey = AbilityCard.SKILL_MAP[skillName];
            if (!systemSkillKey) {
                return;
            }

            // Get the skill data using the system key
            const skill = actor.system.skills?.[systemSkillKey] || { proficient: false };
            const profBonus = actor.system.attributes?.prof || 0;
            const totalMod = abilityMod + (skill.proficient ? profBonus : 0);
            const modStr = totalMod >= 0 ? `+${totalMod}` : totalMod.toString();

            const skillRow = document.createElement("div");
            skillRow.classList.add("menu-item", "skill-row");
            if (skill.proficient) {
                skillRow.classList.add("proficient");
            }
            
            // Add tooltip for skill roll
            skillRow.title = "Roll skill check (Alt: Advantage, Ctrl: Disadvantage, Shift: Fast Forward)";

            // Create left group for icon and label
            const leftGroup = document.createElement("div");
            leftGroup.classList.add("left-group");

            const diceIcon = document.createElement("i");
            diceIcon.classList.add("fas", "fa-dice-d20", "menu-item-icon");

            const skillNameSpan = document.createElement("span");
            skillNameSpan.classList.add("menu-item-label");
            skillNameSpan.textContent = skillName;

            leftGroup.appendChild(diceIcon);
            leftGroup.appendChild(skillNameSpan);

            const skillModSpan = document.createElement("span");
            skillModSpan.classList.add("menu-item-value");
            skillModSpan.textContent = modStr;

            skillRow.appendChild(leftGroup);
            skillRow.appendChild(skillModSpan);

            skillRow.addEventListener("click", (e) => {
                e.stopPropagation();
                
                try {
                    actor.rollSkill(systemSkillKey);
                } catch (error) {
                    ui.notifications.error(`Error rolling ${skillName} skill. See console for details.`);
                }
            });

            popup.appendChild(skillRow);
        });

        return popup;
    }

    _createSavePopup(actor, abilityKey, abilityMod, isProficient) {
        const popup = document.createElement("div");
        popup.classList.add("popup-panel");

        const profBonus = actor.system.attributes?.prof || 0;
        const saveModifier = abilityMod + (isProficient ? profBonus : 0);
        const saveModString = saveModifier >= 0 ? `+${saveModifier}` : saveModifier.toString();
        const checkModString = abilityMod >= 0 ? `+${abilityMod}` : abilityMod.toString();

        // Create ability check row
        const checkRow = document.createElement("div");
        checkRow.classList.add("menu-item", "save-row");
        
        // Add tooltip for ability check
        checkRow.title = "Roll ability check (Alt: Advantage, Ctrl: Disadvantage, Shift: Fast Forward)";

        const checkLeftGroup = document.createElement("div");
        checkLeftGroup.classList.add("left-group");

        const checkDiceIcon = document.createElement("i");
        checkDiceIcon.classList.add("fas", "fa-dice-d20", "menu-item-icon");

        const checkTextSpan = document.createElement("span");
        checkTextSpan.classList.add("menu-item-label");
        checkTextSpan.textContent = "Check";

        checkLeftGroup.appendChild(checkDiceIcon);
        checkLeftGroup.appendChild(checkTextSpan);

        const checkModSpan = document.createElement("span");
        checkModSpan.classList.add("menu-item-value");
        checkModSpan.textContent = checkModString;

        checkRow.appendChild(checkLeftGroup);
        checkRow.appendChild(checkModSpan);

        checkRow.addEventListener("click", (e) => {
            e.stopPropagation();
            try {
                actor.rollAbilityCheck(abilityKey);
            } catch (error) {
                ui.notifications.error(`Error rolling ${abilityKey.toUpperCase()} check. See console for details.`);
            }
        });

        // Create saving throw row with same structure
        const saveRow = document.createElement("div");
        saveRow.classList.add("menu-item", "save-row");
        if (isProficient) {
            saveRow.classList.add("proficient");
        }
        
        // Add tooltip for saving throw
        saveRow.title = "Roll saving throw (Alt: Advantage, Ctrl: Disadvantage, Shift: Fast Forward)";

        const saveLeftGroup = document.createElement("div");
        saveLeftGroup.classList.add("left-group");

        const saveDiceIcon = document.createElement("i");
        saveDiceIcon.classList.add("fas", "fa-dice-d20", "menu-item-icon");

        const saveTextSpan = document.createElement("span");
        saveTextSpan.classList.add("menu-item-label");
        saveTextSpan.textContent = "Save";

        saveLeftGroup.appendChild(saveDiceIcon);
        saveLeftGroup.appendChild(saveTextSpan);

        const saveModSpan = document.createElement("span");
        saveModSpan.classList.add("menu-item-value");
        saveModSpan.textContent = saveModString;

        saveRow.appendChild(saveLeftGroup);
        saveRow.appendChild(saveModSpan);

        saveRow.addEventListener("click", (e) => {
            e.stopPropagation();
            try {
                actor.rollAbilitySave(abilityKey);
            } catch (error) {
                ui.notifications.error(`Error rolling ${abilityKey.toUpperCase()} save. See console for details.`);
            }
        });

        popup.appendChild(checkRow);
        popup.appendChild(saveRow);
        
        return popup;
    }

    _setupClickOutside() {
        document.addEventListener('click', (e) => {
            if (!this.isVisible) return;
            
            // Check if the click is outside both the ability card and the ability button
            const abilityButton = this.portraitContainer.abilityButton?.element;
            const isClickInsideCard = this.element.contains(e.target);
            const isClickOnButton = abilityButton?.contains(e.target);
            
            if (!isClickInsideCard && !isClickOnButton) {
                this.hide();
                
                // Update the button state
                if (this.portraitContainer.abilityButton) {
                    this.portraitContainer.abilityButton.updateButtonState(false);
                }
            }
        });
    }

    hide() {
        this.isVisible = false;
        this.element.classList.remove("visible");
        this.expandedAbility = null;
        
        // Get the popups wrapper
        const popupsWrapper = this.element.parentNode.querySelector('.popups-wrapper');
        if (popupsWrapper) {
            // Close any open popups
            popupsWrapper.querySelectorAll(".popup-container").forEach(popup => {
                popup.classList.remove("visible");
                popup.querySelectorAll('.popup-panel').forEach(panel => {
                    panel.classList.remove("visible");
                });
            });
        }
        
        // Reset any highlighted ability rows
        this.element.querySelectorAll(".ability-row").forEach(row => {
            row.classList.remove("expanded");
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            this.render();
            this.element.classList.add("visible");
        } else {
            this.hide();
        }
    }

    render() {
        // Get the ability rows wrapper
        const abilityRowsWrapper = this.element.querySelector('.ability-rows-wrapper');
        if (!abilityRowsWrapper) return;

        // Clear existing content
        while (abilityRowsWrapper.firstChild) {
            abilityRowsWrapper.removeChild(abilityRowsWrapper.firstChild);
        }

        // Create ability scores in the wrapper
        this._createAbilityScores();
        
        // Update visibility
        this.element.classList.toggle("visible", this.isVisible);
    }

    destroy() {
        // Remove the bg3-hud container from the DOM if it exists
        const container = this.element?.parentNode;
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        
        // Clear references
        this.portraitContainer = null;
        this.gridContainer = null;
        this.element = null;
    }
}

export class AbilityButton {
    constructor(portraitContainer) {
        this.portraitContainer = portraitContainer;
        this.element = null;
        this.abilityCard = null;
        this._createButton();
        
        // Store reference to this button in the portrait container
        this.portraitContainer.abilityButton = this;
    }

    _createButton() {
        // Create the button element with bg3-hud class
        this.element = document.createElement("div");
        this.element.classList.add("bg3-hud", "ability-button");
        
        // Add d20 icon
        this.element.innerHTML = '<i class="fas fa-dice-d20"></i>';

        // Add click handler
        this.element.addEventListener("click", () => this._toggleAbilityCard());

        // Create the ability card and get its container
        this.abilityCard = new AbilityCard(this.portraitContainer);
        const cardContainer = this.abilityCard._createCard();
        
        // Add the card to the button
        this.element.appendChild(cardContainer);
        
        // Add button to the portrait card
        this.portraitContainer.element.appendChild(this.element);
    }

    updateButtonState(isActive) {
        this.element.classList.toggle('active', isActive);
    }

    _toggleAbilityCard() {
        if (!this.abilityCard) {
            return;
        }

        // Toggle the ability card
        this.abilityCard.toggle();
        
        // Update button state
        this.updateButtonState(this.abilityCard.isVisible);

        // If we're hiding the card, ensure all popups are properly closed
        if (!this.abilityCard.isVisible) {
            // Close any open popups
            this.abilityCard.element.querySelectorAll(".popup-container").forEach(popup => {
                popup.classList.remove("visible");
                // Also ensure the popup panels themselves are hidden
                popup.querySelectorAll(".popup-panel").forEach(panel => {
                    panel.classList.remove("visible");
                });
            });
            
            // Reset any expanded abilities
            this.abilityCard.expandedAbility = null;
            
            // Reset any highlighted ability rows
            this.abilityCard.element.querySelectorAll(".ability-row").forEach(row => {
                row.classList.remove("expanded");
            });
        }
    }

    destroy() {
        if (this.abilityCard) {
            this.abilityCard.destroy();
            this.abilityCard = null;
        }

        // Remove the bg3-hud container instead of just the element
        const container = this.element.parentNode;
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }

        // Remove the reference from the portrait container
        if (this.portraitContainer) {
            this.portraitContainer.abilityButton = null;
        }

        this.portraitContainer = null;
        this.element = null;
    }
} 