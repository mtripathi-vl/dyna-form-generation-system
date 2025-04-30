import React from 'react';
// Import UISchema type if defined centrally, or redefine locally if needed
// Assuming it's defined in App.tsx for now, adjust import path if different
// If not exported from App.tsx, we might need to define it here or in a shared types file.
// Let's assume for now we need to define it here for simplicity, or adjust if App.tsx exports it.
import { JSONSchema7 } from 'json-schema';
import { registerPlugin, FieldComponentProps } from './pluginRegistry';
import styles from '../components/Fields/Field.module.css'; // Reuse styles for consistency

// Re-define or import UISchema to access custom props safely
type UISchema = JSONSchema7 & {
  'ui:classNames'?: string;
  'ui:style'?: React.CSSProperties;
  'ui:placeholder'?: string;
  'ui:widget'?: string;
  properties?: { [key: string]: UISchema };
  items?: UISchema | UISchema[];
};


// Custom component to render email as a link
const EmailLinkComponent: React.FC<FieldComponentProps> = ({ label, value, schema }) => {
    const emailValue = typeof value === 'string' ? value : '';
    const displayLabel = label || schema?.title || 'Email'; // Use label, title, or default

    return (
        <div className={styles.fieldContainer}> {/* Reuse container style */}
            <label className={styles.fieldLabel}>{displayLabel}</label>
            <div className={styles.fieldValueDisplay}> {/* Add a class for styling display-only values */}
                {emailValue ? (
                    <a href={`mailto:${emailValue}`}>{emailValue}</a>
                ) : (
                    <span>N/A</span> // Display something if value is empty
                )}
            </div>
        </div>
    );
};

// Register the plugin
registerPlugin({
    name: 'EmailLinkWidget',
    // Match if type is string, format is email, and ui:widget is 'emailLink'
    match: (fieldConfig) => {
        // Use safe access, although casting is likely fine here
        const schema = fieldConfig.schema || {};
        const uiWidget = (schema as UISchema)['ui:widget']; // Access via cast

        const isStringType = schema.type === 'string';
        const isEmailFormat = schema.format === 'email';
        const isEmailLinkWidget = uiWidget === 'emailLink';

        const result = isStringType && isEmailFormat && isEmailLinkWidget;

        return result;
    },
    // Provide the custom component
    component: EmailLinkComponent,
});

// Export something to ensure it's treated as a module and executed
export const EmailLinkPluginRegistered = true;
