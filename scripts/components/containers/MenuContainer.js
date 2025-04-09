import { BG3Component } from "../component.js";

export class MenuContainer extends BG3Component {
    constructor(data, parent, closeParent) {
        super(data);
        this._parent = parent;
        this.closeParent = closeParent;
        this._setupClickOutside();
    }

    get classes() {
        return ['bg3-menu-container'];
    }

    get visible() {
        return $(this.element).hasClass('hidden') !== true;
    }

    get parentElement() {
        return this._parent?.element ?? this._parent;
    }

    async getData() {
        return {buttons: this.data.buttons};
    }
    
    async _registerEvents() {
        this.parentElement.addEventListener(this.data.event, (event) => {
            event.preventDefault();
            event.stopPropagation();
            if(this._parent.locked) return;
            if(this.data.verify !== undefined && this.data.verify()) return;
            if(this.data.position === 'mouse') {
                this.element.style.top = `${event.offsetY}px`;
                this.element.style.left = `${event.offsetX}px`;
            }
            this.setVisibility();
            if(this.data.position === 'target') {
                const target = event.target;
                this.element.style.top = `${target.offsetTop}px`;
                this.element.style.left = `${target.offsetLeft + target.offsetWidth}px`;
            }
        });

        Object.entries(this.data.buttons).forEach(([k,b]) => {
            if(b.click) {
                const btn = this.element.querySelector(`[data-key="${k}"]`);
                if(btn) btn.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    return b.click()
                });
            }
        })
    }

    setVisibility() {
        this.element.classList.toggle("hidden", this.visible);
        if(this.visible && this.data.name) {
            document.querySelectorAll(`[name="${this.data.name}"]`).forEach(c => c !== this.element && c.classList.add('hidden'))
        }
        if(!this.visible) {
            this.element.querySelectorAll('.bg3-menu-container').forEach(c => {
                if($(c).hasClass('hidden') !== true) c.classList.add('hidden');
            })
        }
    }

    _setupClickOutside() {
        document.addEventListener('click', (e) => {
            if (!this.visible) return;
            
            // Check if the click is outside both the ability card and the ability button
            const isClickMenu = this.element.contains(e.target);
            const isClickOnButton = this.closeParent === true ? false : this.parentElement.contains(e.target);
            
            if (!isClickMenu && !isClickOnButton) this.setVisibility();
        });
    }

    async _renderInner() {
        await super._renderInner();
        this.element.dataset.menuPosition = this.data.position;
        if(this.data.name) this.element.setAttribute('name', this.data.name);
        this.parentElement.appendChild(this.element);
        Object.entries(this.data.buttons).forEach(([k, b]) => {
            if(b?.subMenu?.length) {
                b.subMenu.forEach(sb => {
                    this.subMenu = new MenuContainer(sb, this.element.querySelector(`[data-key="${k}"]`));
                    this.subMenu.render();
                });
            }
        });
        this.element.classList.add('hidden');
    }
}