import React from 'react';
import { InterpretedField } from '../services/schemaInterpreter';

// Define the structure for props passed to field components
// (This might need refinement based on actual props used)
export interface FieldComponentProps {
    path: string;
    label: string;
    value: unknown; // Use unknown instead of any
    onChange: (path: string, value: unknown) => void; // Use unknown instead of any
    required?: boolean;
    error?: string;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
    options?: { value: string | number; label: string }[];
    min?: number;
    max?: number;
    step?: number;
    rows?: number;
    type?: string; // Add optional type prop (for TextField)
    // Include schema details if plugins need them
    schema: InterpretedField['schema'];
    onFieldBlur?: (path: string) => void; // Handler for blur event
    // Add other common props
}


// Define the structure of a plugin
export interface DynaFormPlugin {
    name: string; // Unique name for the plugin
    // Determines if this plugin should be applied to a field
    match: (fieldConfig: InterpretedField) => boolean;
    // Optional: Provide a custom component to render
    component?: React.ComponentType<FieldComponentProps>; // Use a defined props type
    // Optional: Modify props before passing to the component (default or custom)
    processProps?: (props: FieldComponentProps, fieldConfig: InterpretedField) => FieldComponentProps;
    // Optional: Add custom validation logic (run after standard validation?)
    // validate?: (value: any, fieldConfig: InterpretedField) => string | null | Promise<string | null>;
}

// Simple registry using a Map
const pluginRegistry = new Map<string, DynaFormPlugin>();

/**
 * Registers a plugin.
 * @param plugin The plugin object to register.
 */
export function registerPlugin(plugin: DynaFormPlugin): void {
    if (pluginRegistry.has(plugin.name)) {
        console.warn(`Plugin with name "${plugin.name}" is already registered. Overwriting.`);
    }
    pluginRegistry.set(plugin.name, plugin);
    console.log(`[PluginSystem] Registered plugin: ${plugin.name}`);
}

/**
 * Finds the first matching plugin for a given field configuration.
 * @param fieldConfig The interpreted field configuration.
 * @returns The matching plugin or undefined if none match.
 */
export function findMatchingPlugin(fieldConfig: InterpretedField): DynaFormPlugin | undefined {
    for (const plugin of pluginRegistry.values()) {
        if (plugin.match(fieldConfig)) {
            return plugin;
        }
    }
    return undefined;
}

// Example of registering a simple plugin (e.g., in main.tsx or a dedicated plugins file)
/*
import { registerPlugin } from './plugins/pluginRegistry';

registerPlugin({
    name: 'EmailLinkPlugin',
    match: (fieldConfig) => fieldConfig.schema.format === 'email' && fieldConfig.schema['ui:widget'] === 'emailLink',
    component: ({ value, label }) => (
        <div>
            <label>{label}</label>
            {value ? <a href={`mailto:${value}`}>{value}</a> : <span>N/A</span>}
        </div>
    ),
});
*/
