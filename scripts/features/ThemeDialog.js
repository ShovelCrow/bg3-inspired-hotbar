import { CONFIG } from "../utils/config.js";

export class ThemeSettingDialog extends FormApplication {
    constructor () {
        super();
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            title: 'Theme settings',
            id: "bg3-inspired-hotbar-theme-settings",
            template: `modules/bg3-inspired-hotbar/templates/theme-dialog.hbs`,
            height: "auto",
            submitOnClose: false
        };
    }

    getData() {
        const dataKeys = ['themeOption'],
            configData = {};
        for(let i = 0; i < dataKeys.length; i++) {
            const setting = game.settings.settings.get(`${CONFIG.MODULE_NAME}.${dataKeys[i]}`);
            if(setting.scope === 'client' || game.user.isGM) configData[dataKeys[i]] = game.settings.get(CONFIG.MODULE_NAME, dataKeys[i]);
        }

        const dataInput = [
            {
                name: 'Global',
                hint: 'Parameters applied to all others below if not specified.',
                categories: [
                    {
                        headers: ['', 'Normal', 'Hover'],
                        fields: [
                            { id: 'bg3-border-color', label: 'Border Color', field: {type: 'color', css: '', value: '', value2: ''}},
                            { id: 'bg3-background-color', label: 'Background Color', field: {type: 'color', css: '', value: '', value2: ''}},
                            { id: 'bg3-text-color', label: 'Text Color', field: {type: 'color', css: '', value: '', value2: ''}}
                        ]
                    },
                    {
                        fields: [{ id:'bg3-cell-size', label: 'Cell size', field: {type: 'number', css: '', value: 50, min: 10, max: 200, unit:'px'}},
                        { id:'bg3-border-size', label: 'Border size', field: {type: 'number', css: '', value: 2, min: 0, max: 10, unit:'px'}}]
                    }
                ]
            },
            {
                name: 'Portrait',
                hint: '',
                categories: [
                    {
                        fields: [{ id:'bg3-Portrait-cell-size', label: 'Size', field: {type: 'number', css: '', value: 175, min: 100, max: 300, unit:'px'}}]
                    }
                ]
            },
            {
                name: 'Hotbar',
                hint: '',
                categories: [
                    {
                        headers: ['', 'Normal', 'Hover'],
                        fields: [{ id:'bg3-hotbar-border-color', label: 'Border Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-hotbar-background-color', label: 'Background Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-hotbar-text-color', label: 'Text Color', field: {type: 'color', css: '', value: '', value2: ''}}]
                    },
                    {
                        fields: [{ id:'bg3-hotbar-cell-size', label: 'Cell size', field: {type: 'number', css: '', value: 50, min: 10, max: 200, unit:'px'}},
                        { id:'bg3-hotbar-border-size', label: 'Border size', field: {type: 'number', css: '', value: 2, min: 0, max: 10, unit:'px'}}]
                    }
                ]
            },
            {
                name: 'Weapons Sets',
                hint: '',
                categories: [
                    {
                        headers: ['', 'Normal', 'Hover'],
                        fields: [{ id:'bg3-weapon-border-color', label: 'Border Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-weapon-background-color', label: 'Background Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-weapon-text-color', label: 'Text Color', field: {type: 'color', css: '', value: '', value2: ''}}]
                    },
                    {
                        fields: [{ id:'bg3-weapon-cell-size', label: 'Cell size', field: {type: 'number', css: '', value: 50, min: 10, max: 200, unit:'px'}},
                            { id:'bg3-weapon-border-size', label: 'Border size', field: {type: 'number', css: '', value: 2, min: 0, max: 10, unit:'px'}}]
                    }
                ]
            },
            /* {
                name: 'Common Actions',
                hint: '',
                categories: [
                    {
                        headers: ['', 'Normal', 'Hover'],
                        fields: [{ id:'bg3-common-border-color', label: 'Border Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-common-background-color', label: 'Background Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-common-text-color', label: 'Text Color', field: {type: 'color', css: '', value: '', value2: ''}}]
                    },
                    {
                        fields: [{ id:'bg3-common-cell-size', label: 'Cell size', field: {type: 'number', css: '', value: 50, min: 10, max: 200, unit:'px'}},
                            { id:'bg3-common-border-size', label: 'Border size', field: {type: 'number', css: '', value: 2, min: 0, max: 10, unit:'px'}}]
                    }
                ]
            }, */
            {
                name: 'Filters',
                hint: '',
                categories: [
                    {
                        headers: ['', 'Normal', 'Hover'],
                        fields: [{ id:'bg3-filter-border-color', label: 'Border Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-filter-background-color', label: 'Background Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-filter-text-color', label: 'Text Color', field: {type: 'color', css: '', value: '', value2: ''}}]
                    },
                    {
                        fields: [{ id:'bg3-filter-cell-size', label: 'Cell size', field: {type: 'number', css: '', value: 50, min: 10, max: 200, unit:'px'}},
                            { id:'bg3-filter-border-size', label: 'Border size', field: {type: 'number', css: '', value: 2, min: 0, max: 10, unit:'px'}}]
                    }
                ]
            },
            {
                name: 'Passive Effects',
                hint: '',
                categories: [
                    {
                        headers: ['', 'Normal', 'Hover'],
                        fields: [{ id:'bg3-passive-border-color', label: 'Border Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-passive-background-color', label: 'Background Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-passive-text-color', label: 'Text Color', field: {type: 'color', css: '', value: '', value2: ''}}]
                    },
                    {
                        fields: [{ id:'bg3-passive-cell-size', label: 'Cell size', field: {type: 'number', css: '', value: 50, min: 10, max: 200, unit:'px'}},
                            { id:'bg3-passive-border-size', label: 'Border size', field: {type: 'number', css: '', value: 2, min: 0, max: 10, unit:'px'}}]
                    }
                ]
            },
            {
                name: 'Active Effects',
                hint: '',
                categories: [
                    {
                        headers: ['', 'Normal', 'Hover'],
                        fields: [{ id:'bg3-active-border-color', label: 'Border Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-active-background-color', label: 'Background Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-active-text-color', label: 'Text Color', field: {type: 'color', css: '', value: '', value2: ''}}]
                    },
                    {
                        fields: [{ id:'bg3-active-cell-size', label: 'Cell size', field: {type: 'number', css: '', value: 50, min: 10, max: 200, unit:'px'}},
                            { id:'bg3-active-border-size', label: 'Border size', field: {type: 'number', css: '', value: 2, min: 0, max: 10, unit:'px'}}]
                    }
                ]
            },
            {
                name: 'Rest Turn Buttons',
                hint: '',
                categories: [
                    {
                        headers: ['', 'Normal', 'Hover'],
                        fields: [{ id:'bg3-rest-border-color', label: 'Border Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-rest-background-color', label: 'Background Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-rest-text-color', label: 'Text Color', field: {type: 'color', css: '', value: '', value2: ''}}]
                    },
                    {
                        fields: [{ id:'bg3-rest-border-size', label: 'Border size', field: {type: 'number', css: '', value: 2, min: 0, max: 10, unit:'px'}}]
                    }
                ]
            },
            {
                name: 'Tooltip',
                hint: '',
                categories: [
                    {
                        headers: ['', 'Normal', 'Hover'],
                        fields: [{ id:'bg3-tooltip-border-color', label: 'Border Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-tooltip-background-color', label: 'Background Color', field: {type: 'color', css: '', value: '', value2: ''}},
                        { id:'bg3-tooltip-text-color', label: 'Text Color', field: {type: 'color', css: '', value: '', value2: ''}}]
                    },
                    {
                        fields: [{ id:'bg3-tooltip-border-size', label: 'Border size', field: {type: 'number', css: '', value: 2, min: 0, max: 10, unit:'px'}}]
                    }
                ]
            }
        ]

        return {configData, dataInput};
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.css-var').on('change', event => {
            const themeInput = this.element[0].querySelector('[name="bg3-inspired-hotbar.themeOption"]');
            if(themeInput?.value !== 'custom') themeInput.value = 'custom';
        });
    }

    async _onSubmit(event) {
        event.preventDefault();
        const themeInput = this.element[0].querySelector('[name="bg3-inspired-hotbar.themeOption"]');
        if(themeInput?.value) game.settings.set(CONFIG.MODULE_NAME, 'themeOption', themeInput.value);
        if(themeInput.value === 'custom') {
            const form = this.element[0].querySelectorAll('.css-var'),
                cssVars = {};
            for (let i = 0; i < form.length; i++) {
                const value = form[i].type == 'checkbox' ? form[i].checked : form[i].value;
                if(value) {
                    value = form[i].min && form[i].min !== 0 && value < form[i].min ? form[i].min : (form[i].max && form[i].max !== 0 && value > form[i].max ? form[i].max : value);
                    cssVars[`--${form[i].name}`] = value;
                }
                // game.settings.set(CONFIG.MODULE_NAME, input.name.split('.')[1], value);
            }
            console.log(cssVars);
        }
        this.close();
    }
}