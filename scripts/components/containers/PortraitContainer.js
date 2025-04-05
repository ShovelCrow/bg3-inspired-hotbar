import { BG3Component } from "../component.js";

export class PortraitContainer extends BG3Component {
    constructor(data) {
        super(data);
    }

    get classes() {
        return ["bg3-portrait-container"]
    }
}