import { BG3Component } from "../component.js";

export class DragBar extends BG3Component {
    constructor(data) {
        super(data);
        
        // Track drag state
        this.isDragging = false;
        this.startX = 0;
        this.startLeftCols = 0;
        this.startRightCols = 0;
        this.totalCols = 0;
        this.cellWidth = 0;
    }

    get classes() {
        return ['bg3-drag-bar'];
    }

    get indicator() {
        return this.element.querySelector('.drag-indicator');
    }

    get index() {
        return this.data.index;
    }
    
    // Define event handlers
    handleMouseMove(e) {
      if (!this.isDragging) return;
      
      // Calculate the delta in pixels
      const deltaX = e.clientX - this.startX;
      
      // Calculate the delta in columns (can be fractional)
      const deltaColsFractional = deltaX / this.cellWidth;
      
      // Calculate potential new column counts
      const newLeftCols = Math.max(1, Math.min(this.totalCols - 1, this.startLeftCols + deltaColsFractional));
      const newRightCols = Math.max(1, this.startRightCols - deltaColsFractional);
      
      // Only proceed if both containers would have at least 1 column
      if (newLeftCols >= 1 && newRightCols >= 1) {
        // Update the drag indicator position
        const containerRect = ui.BG3HOTBAR.components.hotbar[this.index].element.getBoundingClientRect();
        const containerBounds = this.element.getBoundingClientRect();
        const newX = containerRect.left - containerBounds.left + (newLeftCols * this.cellWidth);
        this.indicator.style.transform = `translateX(${deltaX}px)`;
      }
    };

    handleMouseUp (e) {
        if (!this.isDragging) return;
        
        // Calculate the final delta
        const deltaX = e.clientX - this.startX;
        const deltaColsFractional = deltaX / this.cellWidth;
        
        // Round to the nearest column
        const deltaColsRounded = Math.round(deltaColsFractional);
        
        // Only apply changes if we've moved at least half a column
        if (Math.abs(deltaColsFractional) >= 0.5) {
          // Calculate new column counts
          const newLeftCols = Math.max(1, Math.min(this.totalCols - 1, this.startLeftCols + deltaColsRounded));
          const newRightCols = Math.max(1, this.startRightCols - deltaColsRounded);
          
          // Update both containers' column counts
          ui.BG3HOTBAR.components.hotbar[this.index].data.cols = newLeftCols;
          ui.BG3HOTBAR.components.hotbar[this.index + 1].data.cols = newRightCols;
          
          // Render both containers with new column counts
          ui.BG3HOTBAR.components.hotbar[this.index].render();
          ui.BG3HOTBAR.components.hotbar[this.index + 1].render();
          
          // Save the changes
        //   this.manager.persist();
        }
        
        // Clean up
        this.isDragging = false;
        this.indicator.classList.remove('visible');
        this.indicator.style.transform = '';
        this.element.classList.remove('dragging');
        document.body.classList.remove('dragging-active');
        ui.BG3HOTBAR.element[0].classList.remove('dragging-in-progress');
        
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    };

    _registerEvents() {
        // Mouse down event to start dragging
        this.element.addEventListener("mousedown", async (e) => {
            e.preventDefault();
            
            // Initialize drag state
            this.isDragging = true;
            this.startX = e.clientX;
            this.startLeftCols = ui.BG3HOTBAR.components.hotbar[this.index].data.cols;
            this.startRightCols = ui.BG3HOTBAR.components.hotbar[this.index + 1].data.cols;
            this.totalCols = this.startLeftCols + this.startRightCols;
            
            // Get the cell width from the container
            const containerRect = ui.BG3HOTBAR.components.hotbar[this.index].element.getBoundingClientRect();
            this.cellWidth = containerRect.width / this.startLeftCols;
            
            // Add visual feedback classes
            this.element.classList.add('dragging');
            this.indicator.classList.add('visible');
            document.body.classList.add('dragging-active');
            ui.BG3HOTBAR.element[0].classList.add('dragging-in-progress');
            
            document.addEventListener('mousemove', this.handleMouseMove.bind(this));
            document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        });
    }
}