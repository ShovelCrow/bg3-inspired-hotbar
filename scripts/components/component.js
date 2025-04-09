import { CONFIG } from '../utils/config.js';

export class BG3Component {
    constructor(data) {
        this.data = data;
        this.components = [];
        this._parent = null;
        this.element = document.createElement(this.elementType);
        this.element.classList.add(...this.classes);
        // this.element = document.createElement('template');
    }
    
    get template() {
        return `${CONFIG.COMPONENTS_PATH}${this.constructor.name}.hbs`;
    }

    get classes() {
        return [];
    }

    get elementType() {
        return this.data?.type ?? "div";
    }

    async getData() {
        return {};
    }

    /* get locked() {
        return this.locked ?? false;
    }

    set locked(value) {
        // this.locked = value;
    } */

    get visible() {
        return true;
    }

    async loadTemplate(data) {
        try {
            const testTpl = await renderTemplate(this.template, data);
            return testTpl;
        } catch (error) {
            return $(`<${this.elementType}>`).prop('outerHTML');
        }
    }

    /* get components() {
        return this.components;
    }

    set components(components) {
        this.components = components;
    } */

    addComponent(component) {
        this.components.push(component);
    }

    setComponentsVisibility() {
        this.components.forEach(c => c.setVisibility());
    }

    setVisibility() {
        this.element.classList.toggle("hidden", !this.visible);
    }

    async _registerEvents() {
        if(this.data?.events) {
            Object.entries(this.data.events).forEach(([trigger, fn]) => {
                this.element.addEventListener(trigger, fn.bind(this));
            })
        }
    }

    get dataTooltip() {
        return null;
    }

    async setTooltip() {
        if(this.dataTooltip) {
            switch (this.dataTooltip.type) {
                case 'basic':
                    this.element.title = this.dataTooltip.content;
                    break;    
                case 'simple':
                    this.element.dataset.tooltip = this.dataTooltip.content;
                    this.element.dataset.tooltipDirection = this.dataTooltip.direction ?? 'UP';
                    break;   
                case 'advanced':
                    this.element.dataset.title = this.dataTooltip.content;
                    break;        
                default:
                    break;
            }
        } else return;
    }

    async render() {
        await this._renderInner();
        await this._registerEvents();
        await this.setTooltip();
        // await this.activateListeners(this.element);
        // if (this.hasTooltip) await this.activateTooltipListeners();
        // const parentClass = Object.getPrototypeOf(this.constructor);
        // Hooks.callAll(`render${parentClass.name}ArgonComponent`, this, this.element, this.actor);
        // Hooks.callAll(`render${this.constructor.name}ArgonComponent`, this, this.element, this.actor);
        return this.element;
    }

    async _renderInner() {
        const data = await this.getData();
        const rendered = await this.loadTemplate(data);
        const tempElement = document.createElement("div");
        tempElement.innerHTML = rendered;
        this.element.innerHTML = tempElement.firstElementChild.innerHTML;
        // this.element.innerHTML = rendered;
        // this.setColorScheme();
        this.setVisibility();
    }
}