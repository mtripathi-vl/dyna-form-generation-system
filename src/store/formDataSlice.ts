import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import set from 'lodash-es/set';
import get from 'lodash-es/get';
import cloneDeep from 'lodash-es/cloneDeep';
// We might need RootState type if we use selectors that depend on other state parts
// import type { RootState } from './index';

// Define a type for the slice state
interface FormDataState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values: Record<string, any>; // Use 'any' for flexibility with nested structures
    errors: Record<string, string>; // Map field path to error message string
    schema?: JSONSchema7; // Store the schema for reference
}

// Define the initial state using that type
const initialState: FormDataState = {
    values: {},
    errors: {},
    schema: undefined,
};

// Helper function to get default value for a schema type
function getDefaultValue(schema: JSONSchema7Definition): unknown {
    if (typeof schema !== 'object' || Array.isArray(schema)) {
        return undefined; // Cannot determine default for boolean/invalid schemas
    }

    if (schema.default !== undefined) {
        return cloneDeep(schema.default); // Use deep clone for objects/arrays
    }

    switch (schema.type) {
        case 'object':
            return generateDefaults(schema); // Recursively generate defaults for objects
        case 'array': { // Add braces here
            // Handle default for array based on minItems
            const minItems = schema.minItems ?? 0;
            if (minItems > 0 && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
                // Create minItems default entries
                return Array.from({ length: minItems }, () => getDefaultValue(schema.items as JSONSchema7));
            }
            return []; // Default to empty array
        } // Add closing brace
        case 'string':
            return '';
        case 'number':
        case 'integer':
            return schema.minimum ?? 0; // Or undefined? Let's use minimum or 0
        case 'boolean':
            return false;
        case 'null':
            return null;
        default:
            // Handle multiple types? For now, return undefined
            return undefined;
    }
}

// Helper function to generate default values from schema (renamed from getInitialValuesRecursive for clarity)
function generateDefaults(schema: JSONSchema7): Record<string, unknown> {
    const defaults: Record<string, unknown> = {};
    if (schema.type === 'object' && schema.properties) {
        Object.entries(schema.properties).forEach(([key, propSchema]) => {
            defaults[key] = getDefaultValue(propSchema); // Use the new helper
        });
    }
    return defaults;
}


// Removed the unused getInitialValuesRecursive function.


// Main function called by the reducer - NOW USES generateDefaults
function getInitialValues(schema: JSONSchema7): Record<string, unknown> {
    // Ensure the top level is always an object
    if (schema.type === 'object') {
        return generateDefaults(schema);
    }
    // Fallback if the root schema wasn't an object
    console.warn("Root schema is not an object, returning empty object for initial values.");
    return {};
}

// Removed setNestedValue helper function, using lodash/set instead.

export const formDataSlice = createSlice({
    name: 'formData',
    initialState,
    reducers: {
        // Action to initialize form data based on a schema
        initializeForm: (state, action: PayloadAction<{ schema: JSONSchema7 }>) => {
            state.schema = action.payload.schema; // Store the schema
            state.values = getInitialValues(action.payload.schema); // Use updated getInitialValues
            state.errors = {}; // Clear errors on initialization
        },
        // Action to update a specific field's value
        updateFieldValue: (state, action: PayloadAction<{ path: string; value: unknown }>) => { // Payload value is unknown
            // Use lodash/set for safe deep updates
            set(state.values, action.payload.path, action.payload.value);
            // Optionally clear the error for this specific field upon update
            // TODO: Consider clearing errors for child paths if a parent object/array changes significantly
            delete state.errors[action.payload.path];
        },
        // Action to set validation errors
        setValidationErrors: (state, action: PayloadAction<Record<string, string>>) => {
            state.errors = action.payload;
        },
        // Action to clear all validation errors
        clearValidationErrors: (state) => {
            state.errors = {};
        },
        // --- Reducers for Repeating Sections ---
        addArrayItem: (state, action: PayloadAction<{ path: string }>) => {
            const { path } = action.payload;
            const currentArray = get(state.values, path, []); // Get current array or default to []
            // Find schema for the array itself. Need to traverse properties based on path.
            const pathSegments = path.split('.');
            let schemaForArray: JSONSchema7 | undefined = state.schema; // Start with root schema
            try {
                for (const segment of pathSegments) {
                    if (!schemaForArray || typeof schemaForArray !== 'object' || !schemaForArray.properties) throw new Error('Invalid schema path');
                    const nextSchema = schemaForArray.properties[segment];
                    if (typeof nextSchema !== 'object') throw new Error('Invalid schema path segment');
                    schemaForArray = nextSchema;
                }
            } catch (e) {
                console.error(`Error finding schema for path "${path}":`, e);
                schemaForArray = undefined;
            }

            const itemSchema = schemaForArray?.items;

            if (!Array.isArray(currentArray)) {
                console.error(`State at path "${path}" is not an array.`);
                // Initialize as an array if it's not? Or rely on initialization?
                // For now, let's assume initialization sets it correctly. If not, log error.
                 if (schemaForArray?.type === 'array') {
                     set(state.values, path, []); // Initialize if schema expects array but it's not
                     // currentArray = get(state.values, path); // Re-get the initialized array - This won't work directly with Immer draft
                     // Instead, push to the newly set array
                     const newArray = get(state.values, path);
                     if (Array.isArray(newArray)) {
                         if (!itemSchema || typeof itemSchema !== 'object' || Array.isArray(itemSchema)) {
                             console.error(`Could not find valid item schema for array at path "${path}".`);
                             newArray.push({}); // Push empty object fallback
                         } else {
                             const newItemDefault = getDefaultValue(itemSchema);
                             newArray.push(newItemDefault);
                         }
                     }
                     return; // Exit after initializing and pushing the first item
                 } else {
                     return; // Don't proceed if path doesn't point to an array schema
                 }
            }
            // If it is already an array, push a new item
            if (!itemSchema || typeof itemSchema !== 'object' || Array.isArray(itemSchema)) {
                 console.error(`Could not find valid item schema for array at path "${path}".`);
                 currentArray.push({}); // Push empty object fallback
            } else {
                // Generate default value for the new item based on its schema
                const newItemDefault = getDefaultValue(itemSchema);
                currentArray.push(newItemDefault);
            }
            // No need to use set() here as we are mutating the draft state directly (Immer)
            // TODO: Clear validation errors related to array counts (minItems/maxItems) if applicable
        },
        removeArrayItem: (state, action: PayloadAction<{ path: string; index: number }>) => {
            const { path, index } = action.payload;
            const currentArray = get(state.values, path);

            if (!Array.isArray(currentArray)) {
                console.error(`State at path "${path}" is not an array.`);
                return;
            }
            if (index < 0 || index >= currentArray.length) {
                console.error(`Invalid index ${index} for array at path "${path}".`);
                return;
            }

            currentArray.splice(index, 1);
            // No need to use set() here as we are mutating the draft state directly (Immer)
            // TODO: Clear validation errors related to the removed item and its children
            // This might require iterating through state.errors and removing keys starting with `${path}.${index}`
            const errorPrefix = `${path}.${index}`;
            Object.keys(state.errors).forEach(errorPath => {
                if (errorPath.startsWith(errorPrefix)) {
                    delete state.errors[errorPath];
                }
                // TODO: Adjust indices for subsequent errors? This is complex.
                // Maybe re-validation is the best approach after removal.
            });
        },
    },
});

// Export actions
export const {
    initializeForm,
    updateFieldValue,
    setValidationErrors,
    clearValidationErrors,
    addArrayItem, // Export new actions
    removeArrayItem, // Export new actions
} = formDataSlice.actions;

// Selectors (optional, but good practice)
// Example: Select the value of a specific field
// export const selectFieldValue = (state: RootState, path: string) => get(state.formData.values, path); // Use lodash/get
// Example: Select all form values
// export const selectFormValues = (state: RootState) => state.formData.values;

// Export the reducer
export default formDataSlice.reducer;
