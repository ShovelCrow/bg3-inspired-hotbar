
export class BG3Component {
    constructor(data) {
        this.data = data;
        this.element = document.createElement(this.elementType);
        this.element.classList.add(...this.classes);
    }
    
    get template() {
        return `${CONFIG.COMPONENTS_PATH}${Object.getPrototypeOf(this.constructor).name}.hbs`;
    }

    get classes() {
        return [];
    }

    async getData() {
        return {};
    }

    async render() {
        await this._renderInner();
        // await this.activateListeners(this.element);
        // if (this.hasTooltip) await this.activateTooltipListeners();
        // const parentClass = Object.getPrototypeOf(this.constructor);
        // Hooks.callAll(`render${parentClass.name}ArgonComponent`, this, this.element, this.actor);
        // Hooks.callAll(`render${this.constructor.name}ArgonComponent`, this, this.element, this.actor);
        return this.element;
    }

    async _renderInner() {
        const data = await this.getData();
        const rendered = await renderTemplate(this.template, data);
        const tempElement = document.createElement("div");
        tempElement.innerHTML = rendered;
        this.element.innerHTML = tempElement.firstElementChild.innerHTML;
        // this.setColorScheme();
        // this.setVisibility();
    }
}