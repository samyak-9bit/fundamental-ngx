// BEING UPDATED WITH THE SAP-COMPONENT SCHEMATIC; DO NOT MODIFY THE STRUCTURE!

/**
 * Files to display in the API tab of each component.
 * Names should be without hyphens, and capitalized where hyphens occur normally.
 * Include the suffix i.e. Directive or Component.
 * Names are sorted in the ApiComponent so order does not matter.
 */
export const API_FILES = {
    navigation: [],
    toolHeader: [
        'ToolHeaderComponent',
        'ToolHeaderAutoModeDirective',
        'ToolHeaderActionComponent',
        'ToolHeaderUserDirective',
        'ToolHeaderProductSwitchComponent',
        'ToolHeaderLogoDirective'
    ],
    toolLayout: [],
    searchField: ['SearchFieldComponent']
} as const;
