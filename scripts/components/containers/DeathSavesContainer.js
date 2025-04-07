import { BG3Component } from "../component.js";

export class DeathSavesContainer extends BG3Component {
    constructor(data) {
        super(data);
        this.isStabilizing = false;
    }

    get classes() {
        return ["bg3-death-saves-container"]
    }

    get actor() {
        return ui.BG3HOTBAR.manager.actor;
    }

    async getData() {
        return {success: this.actor.system.attributes.death.success || 0, failure: this.actor.system.attributes.death.failure || 0};
    }

    get visible() {
        if (!this.actor || this.actor.type !== 'character') return false;
        // Get current HP and death saves state
        const currentHP = this.actor.system.attributes?.hp?.value || 0;

        // Always show death saves UI when at 0 HP, even during stabilization
        if (currentHP <= 0) return true;
        else if (!this.isStabilizing) return false;
    }

    async _registerEvents() {
        this.element.querySelector('.death-saves-skull').addEventListener('click', async (event) => {
            // Get current death save count before the roll
            const currentSuccesses = this.actor.system.attributes.death.success || 0;

            try {
                // Determine roll mode based on modifiers
                let rollMode = "roll";
                if (event.altKey) rollMode = "advantage";
                if (event.ctrlKey) rollMode = "disadvantage";
                if (event.shiftKey) rollMode = "gmroll";

                // Roll the death save with the appropriate mode
                const roll = await this.actor.rollDeathSave({
                    event: event,  // Pass the original event
                    advantage: event.altKey,
                    disadvantage: event.ctrlKey,
                    fastForward: event.shiftKey
                });
                
                if(!roll) return;
                
                // Only handle our UI updates after system processes are complete
                if (roll.total >= 10 && currentSuccesses === 2) {  // This would be the third success
                    this.isStabilizing = true;
                    
                    const successBoxes = this.element.querySelectorAll('.death-save-box.success');
                    const failureBoxes = this.element.querySelectorAll('.death-save-box.failure');

                    // Force all success boxes to be marked
                    successBoxes.forEach(box => box.classList.add('marked'));
                    
                    // Keep any existing failure marks
                    const currentFailures = this.actor.system.attributes.death.failure || 0;
                    failureBoxes.forEach((box, index) => {
                        box.classList.toggle('marked', index + 1 <= currentFailures);
                    });

                    // Clear any existing timer
                    if (this.stabilizationTimer) {
                        clearTimeout(this.stabilizationTimer);
                    }

                    // Set new timer
                    this.stabilizationTimer = setTimeout(() => {
                        this.isStabilizing = false;
                        // Check current HP state when timer completes
                        if (this.actor.system.attributes.hp.value > 0) {
                            this.element.style.display = 'none';
                        }
                    }, 5000);
                }
            } catch (error) {
                console.error("Error during death save roll:", error);
            }
        });

        this.element.querySelector('.death-saves-skull').addEventListener('contextmenu', async (event) => {
            event.preventDefault();
            event.stopPropagation();
                
            if (!this.actor || this.actor.type !== 'character') return;

            // Reset both successes and failures to 0
            await this.actor.update({
                'system.attributes.death.success': 0,
                'system.attributes.death.failure': 0
            });

            // Update the UI
            const successBoxes = this.element.querySelectorAll('.death-save-box.success');
            const failureBoxes = this.element.querySelectorAll('.death-save-box.failure');

            // Unmark all boxes
            successBoxes.forEach(box => box.classList.remove('marked'));
            failureBoxes.forEach(box => box.classList.remove('marked'));
        });

        this.element.querySelectorAll('.death-save-box.success').forEach((s) => s.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                if (!this.actor || this.actor.type !== 'character') return;

                // Get all success boxes
                const successBoxes = [...this.element.querySelectorAll('.death-save-box.success')];
                const clickedIndex = successBoxes.indexOf(event.currentTarget);

                // Update all boxes based on clicked position
                successBoxes.forEach((box, index) => {
                    // Mark boxes from the bottom up to the clicked box, unmark the rest
                    box.classList.toggle('marked', index >= clickedIndex);
                });

                // Update the actor with the number of successes (3 - clicked index)
                await this.actor.update({
                    'system.attributes.death.success': 3 - clickedIndex
                });
            })
        );

        this.element.querySelectorAll('.death-save-box.failure').forEach((s) => s.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                if (!this.actor || this.actor.type !== 'character') return;

                // Get all failure boxes
                const failureBoxes = [...this.element.querySelectorAll('.death-save-box.failure')];
                const clickedIndex = failureBoxes.indexOf(event.currentTarget);

                // Update all boxes based on clicked position
                failureBoxes.forEach((box, index) => {
                    // Mark boxes from the top up to the clicked box, unmark the rest
                    box.classList.toggle('marked', index <= clickedIndex);
                });

                // Update the actor with the number of failures (clicked index + 1)
                await this.actor.update({
                    'system.attributes.death.failure': clickedIndex + 1
                });
            })
        );
    }
}