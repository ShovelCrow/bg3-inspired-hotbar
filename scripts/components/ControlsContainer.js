import { CONFIG } from '../utils/config.js';

export class ControlsContainer {
    constructor(ui) {
        this.ui = ui;
        this.element = null;
        this._createControlColumn();
    }

    _createControlColumn() {
        // Create the control column container
        this.element = document.createElement('div');
        this.element.classList.add('hotbar-control-column');
        
        // Create all buttons in order
        const buttons = [
            this._createAddButton(),
            this._createRemoveButton(),
            this._createLockButton(),
            this._createSettingsButton()
        ];

        // Add all buttons to the column
        buttons.forEach(button => this.element.appendChild(button));

        // Add the column to the document
        document.body.appendChild(this.element);
    }

    _createAddButton() {
        return this._createButton('fa-plus', 'Add Row', () => {
            this.ui.gridContainers.forEach(container => {
                container.data.rows++;
                container.render();
            });
            this.ui.manager.persist();
        });
    }

    _createRemoveButton() {
        const removeButton = this._createButton('fa-minus', 'Remove Row', () => {
            if (this.ui.gridContainers[0].data.rows > 1) {
                this.ui.gridContainers.forEach(container => {
                    container.data.rows--;
                    container.render();
                });
                this.ui.manager.persist();
            } else {
                removeButton.classList.add('disabled');
            }
        });
        return removeButton;
    }

    _createLockButton() {
        const lockButton = this._createButton(
            this.ui._isLocked ? 'fa-lock' : 'fa-unlock',
            'Lock hotbar settings (Right-click for options)',
            () => this._handleLockClick(lockButton)
        );

        if (this.ui._isLocked) {
            lockButton.classList.add('locked');
        }

        lockButton.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this._showLockMenu(e, lockButton);
        });

        return lockButton;
    }

    _createSettingsButton() {
        return this._createButton('fa-cog', 'Settings', (e, button) => this._showSettingsMenu(button));
    }

    _createButton(iconClass, title, clickHandler) {
        const button = document.createElement('div');
        button.classList.add('hotbar-control-button');
        button.innerHTML = `<i class="fas ${iconClass}"></i>`;
        button.title = title;
        button.addEventListener('click', (e) => clickHandler(e, button));
        return button;
    }

    _handleLockClick(lockButton) {
        this.ui._isLocked = !this.ui._isLocked;
        this.ui.manager._isLocked = this.ui._isLocked;
        
        const newState = this.ui._isLocked;
        this.ui._lockSettings.deselect = newState;
        this.ui._lockSettings.opacity = newState;
        this.ui._lockSettings.dragDrop = newState;
        
        game.settings.set(CONFIG.MODULE_NAME, 'lockSettings', this.ui._lockSettings);
        
        if (newState) {
            lockButton.innerHTML = '<i class="fas fa-lock"></i>';
            lockButton.classList.add('locked');
        } else {
            lockButton.innerHTML = '<i class="fas fa-unlock"></i>';
            lockButton.classList.remove('locked');
            
            if (!canvas.tokens.controlled.length && !this.ui._lockSettings.deselect) {
                this.ui.destroy();
                this.ui.manager.currentTokenId = null;
            }
        }
    }

    _showLockMenu(event, lockButton) {
        event.preventDefault();
        event.stopPropagation();

        // Remove any existing menus
        this._removeExistingMenus();

        // Create menu
        const menu = document.createElement('div');
        menu.classList.add('menu-container', 'lock-context-menu', 'visible');

        const items = [
            {
                name: 'Lock When Deselecting Token',
                key: 'deselect',
                icon: 'fa-user-slash',
                hint: 'Keep hotbar visible when no token is selected'
            },
            {
                name: 'Lock Opacity',
                key: 'opacity',
                icon: 'fa-eye',
                hint: 'Prevent opacity changes when mouse moves away'
            },
            {
                name: 'Lock Drag & Drop',
                key: 'dragDrop',
                icon: 'fa-arrows-alt',
                hint: 'Prevent moving items in the hotbar'
            }
        ];

        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.classList.add('menu-item');
            menuItem.title = item.hint;
            
            const isChecked = this.ui._lockSettings[item.key];
            menuItem.innerHTML = `
                <i class="fas ${item.icon} menu-item-icon"></i>
                <span class="menu-item-label">${item.name}</span>
                <div class="menu-item-checkbox ${isChecked ? 'checked' : ''}">
                    ${isChecked ? '<i class="fas fa-check"></i>' : ''}
                </div>
            `;

            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                this._handleLockOptionClick(item.key, menuItem, lockButton);
            });

            menu.appendChild(menuItem);
        });

        lockButton.appendChild(menu);
        this._addMenuCloseHandler(menu, lockButton);
    }

    _showSettingsMenu(button) {
        // Remove any existing menus
        this._removeExistingMenus();

        const menu = document.createElement('div');
        menu.classList.add('settings-menu', 'visible');

        const menuItems = [
            { label: game.i18n.localize("BG3.Hotbar.SettingsMenu.ResetLayout"), action: () => this.ui.resetLayout(), icon: 'fa-rotate' },
            { label: game.i18n.localize("BG3.Hotbar.SettingsMenu.ClearAllItems"), action: () => this.ui.clearAllItems(), icon: 'fa-trash' },
            { type: 'divider' },
            { label: game.i18n.localize("BG3.Hotbar.SettingsMenu.ImportLayout"), action: () => this.ui.importLayout(), icon: 'fa-file-import' },
            { label: game.i18n.localize("BG3.Hotbar.SettingsMenu.ExportLayout"), action: () => this.ui.exportLayout(), icon: 'fa-file-export' }
        ];

        menuItems.forEach(item => {
            if (item.type === 'divider') {
                const divider = document.createElement('div');
                divider.classList.add('settings-menu-divider');
                menu.appendChild(divider);
                return;
            }

            const menuItem = document.createElement('div');
            menuItem.classList.add('settings-menu-item');
            menuItem.innerHTML = `
                <i class="fas ${item.icon} settings-menu-item-icon"></i>
                <span class="settings-menu-item-label">${item.label}</span>
            `;
            menuItem.addEventListener('click', () => {
                item.action();
                menu.remove();
            });
            menu.appendChild(menuItem);
        });

        button.appendChild(menu);
        this._addMenuCloseHandler(menu, button);
    }

    _handleLockOptionClick(key, menuItem, lockButton) {
        this.ui._lockSettings[key] = !this.ui._lockSettings[key];
        
        // Update checkbox display
        const checkbox = menuItem.querySelector('.menu-item-checkbox');
        
        if (this.ui._lockSettings[key]) {
            checkbox.classList.add('checked');
            checkbox.innerHTML = '<i class="fas fa-check"></i>';
        } else {
            checkbox.classList.remove('checked');
            checkbox.innerHTML = '';
        }

        // Save settings
        game.settings.set(CONFIG.MODULE_NAME, 'lockSettings', this.ui._lockSettings);

        // Update lock button state based on any lock being active
        const anyLocked = Object.values(this.ui._lockSettings).some(v => v);
        if (anyLocked) {
            lockButton.classList.add('locked');
            lockButton.innerHTML = '<i class="fas fa-lock"></i>';
            this.ui._isLocked = true;
            this.ui.manager._isLocked = true;
        } else {
            lockButton.classList.remove('locked');
            lockButton.innerHTML = '<i class="fas fa-unlock"></i>';
            this.ui._isLocked = false;
            this.ui.manager._isLocked = false;

            if (!canvas.tokens.controlled.length && !this.ui._lockSettings.deselect) {
                this.ui.destroy();
                this.ui.manager.currentTokenId = null;
            }
        }

        // Specific actions for each setting
        if (key === 'opacity') {
            this.ui.updateOpacity();
            this.ui.updateFadeState();
        }
    }

    _removeExistingMenus() {
        document.querySelectorAll('.lock-context-menu, .settings-menu').forEach(menu => menu.remove());
    }

    _addMenuCloseHandler(menu, button) {
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== button) {
                menu.remove();
                document.removeEventListener('mousedown', closeMenu);
            }
        };
        document.addEventListener('mousedown', closeMenu);
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
} 