import { JSONSchema7 } from 'json-schema';

// Define the structure for conditional visibility rules
export interface VisibilityCondition {
    fieldPath: string; // Path to the controlling field
    operator: 'equals' | 'notEquals' | 'exists' | 'doesNotExist'; // Supported operators
    value?: unknown; // Value to compare against (required for 'equals', 'notEquals')
}

// Define a type for the interpreted field structure we want
export interface InterpretedField {
    path: string; // e.g., "user.firstName" or "address"
    type: string; // e.g., "string", "number", "boolean", "object"
    label?: string;
    required?: boolean;
    componentType?: string; // Hint for which component to render (e.g., 'text', 'fieldset')
    options?: { value: string | number; label: string }[]; // Options for enum types (radio/select)
    schema: JSONSchema7; // Original schema fragment
    placeholder?: string; // Placeholder text
    classNames?: string; // Custom CSS classes from schema (e.g., "ui:classNames": "col-md-6")
    style?: React.CSSProperties; // Custom inline styles from schema (e.g., "ui:style": { "color": "blue" })
    visibleWhen?: VisibilityCondition; // Add conditional visibility rule
    // Add other relevant properties extracted from the schema
    // e.g., minLength, maxLength, pattern, enum, format, default etc.
}

// Define structure for layout groups (e.g., tabs)
export interface InterpretedLayoutGroup {
    title: string;
    fields: InterpretedField[]; // References fields by path? Or contains the fields? Let's keep containing for now.
}

// Define a type for the overall interpreted schema structure
export interface InterpretedSchema {
    fields: InterpretedField[]; // Flat list of all fields, including object containers
    layout?: {
        view: 'tabs'; // Currently only supporting 'tabs'
        groups: InterpretedLayoutGroup[];
    };
}

/**
 * Recursively processes schema properties to build a flat list of interpreted fields.
 * @param schema The current schema/sub-schema object.
 * @param pathPrefix The prefix for field paths (e.g., "user" or "address.street").
 * @param requiredParent Array of required properties in the parent schema.
 * @param allFields Accumulator array for all interpreted fields.
 */
function processProperties(
    schema: JSONSchema7,
    pathPrefix: string,
    requiredParent: string[],
    allFields: InterpretedField[]
): void {
    if (schema.type !== 'object' || !schema.properties) {
        return; // Only process objects with properties
    }

    Object.entries(schema.properties).forEach(([key, propSchema]) => {
        if (typeof propSchema !== 'object' || Array.isArray(propSchema)) {
            return; // Skip invalid property schemas
        }

        const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;
        const isRequired = requiredParent.includes(key);

        // Extract potential UI hints *before* determining component type
        // Use unknown for better type safety when accessing non-standard props
        // const uiOptions = (propSchema as Record<string, unknown>)['ui:options'] as Record<string, unknown> | undefined || {}; // Removed unused variable
        const uiWidget = (propSchema as Record<string, unknown>)['ui:widget'] as string | undefined;
        const uiClassNames = (propSchema as Record<string, unknown>)['ui:classNames'] as string | undefined;
        const uiStyle = (propSchema as Record<string, unknown>)['ui:style'] as React.CSSProperties | undefined;
        const uiPlaceholder = (propSchema as Record<string, unknown>)['ui:placeholder'] as string | undefined || propSchema.description; // Use description as fallback placeholder
        const uiVisibleWhen = (propSchema as Record<string, unknown>)['ui:visibleWhen'] as VisibilityCondition | undefined; // Extract visibility rule

        // Determine component type, potentially influenced by UI hints
        // Remove uiOptions from signature as it's not used in the current logic
        const componentType = mapSchemaTypeToComponent(propSchema, uiWidget);

        // Create the field entry
        const field: InterpretedField = {
            path: currentPath,
            type: propSchema.type as string || 'string', // Handle potential array types later
            label: propSchema.title || key,
            required: isRequired,
            schema: propSchema,
            componentType: componentType, // Use determined component type
            options: propSchema.enum
                ? propSchema.enum.map(val => ({
                      value: val as string | number,
                      label: String(val)
                  }))
                : undefined,
            placeholder: uiPlaceholder, // Add placeholder
            classNames: uiClassNames, // Add classNames
            style: uiStyle, // Add style
            visibleWhen: uiVisibleWhen, // Add visibility rule
        };

        allFields.push(field);

        // If it's a nested object (but not an array object), recurse
        if (propSchema.type === 'object' && propSchema.properties) {
            // Note: The 'fieldset' componentType is now assigned based on type:'object' in mapSchemaTypeToComponent
            processProperties(propSchema, currentPath, propSchema.required || [], allFields);
        } else if (propSchema.type === 'array' && typeof propSchema.items === 'object' && !Array.isArray(propSchema.items) && propSchema.items.type === 'object') {
            // If it's an array of objects, stop recursion here; DynaForm will handle rendering items.
            // The 'repeatingSection' componentType is assigned in mapSchemaTypeToComponent.
            // Don't recurse into items here. The field definition for the array itself is sufficient.
        }
    }); // End of forEach loop
}


/**
 * Parses a JSON schema and extracts relevant information for form rendering.
 * Handles nested objects and creates a flat list of fields.
 *
 * @param schema The JSON schema object
 * @returns An InterpretedSchema object or throws an error if schema is invalid
 */
export function interpretSchema(schema: JSONSchema7): InterpretedSchema {
    const allInterpretedFields: InterpretedField[] = [];

    // Start recursive processing from the root
    processProperties(schema, '', schema.required || [], allInterpretedFields);

    // --- Process Layout (Tabs) ---
    // This part remains the same, but it now operates on the potentially larger flat list
    // containing fields from nested structures.
    let layout: InterpretedSchema['layout'] | undefined = undefined;
    interface RawLayoutGroup { title: string; fields: string[]; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemaLayout = (schema as any)?.layout as { view: string; groups: RawLayoutGroup[] } | undefined;

    if (schemaLayout?.view === 'tabs' && Array.isArray(schemaLayout.groups)) {
        const interpretedGroups: InterpretedLayoutGroup[] = schemaLayout.groups
            .map((group: RawLayoutGroup) => {
                if (!group || typeof group.title !== 'string' || !Array.isArray(group.fields)) {
                    console.warn('Invalid group definition in schema layout:', group);
                    return null;
                }
                // Find the corresponding InterpretedField objects from the flat list
                const groupFields = group.fields
                    .map((fieldName: string) => allInterpretedFields.find(f => f.path === fieldName))
                    .filter((field: InterpretedField | undefined): field is InterpretedField => !!field);

                // Important: We might need to filter out 'fieldset' container fields from groupFields
                // if we only want leaf nodes within tabs. Or adjust rendering logic.
                // For now, let's include everything found.

                return { title: group.title, fields: groupFields };
            })
            .filter((group: InterpretedLayoutGroup | null): group is InterpretedLayoutGroup => !!group);

        if (interpretedGroups.length > 0) {
            layout = {
                view: 'tabs',
                groups: interpretedGroups,
            };
        }
    }

    return {
        fields: allInterpretedFields, // Return the complete flat list
        layout: layout,
    };
}

// Helper function to suggest a component type based on schema type/format/ui:widget
// Export this function so DynaForm can use it for repeating sections
export function mapSchemaTypeToComponent(
    propSchema: JSONSchema7,
    uiWidget?: string
    // uiOptions?: Record<string, unknown> // Removed unused parameter
): string {
    // Prioritize ui:widget hint
    if (uiWidget === 'heading') return 'heading'; // Added Heading
    if (uiWidget === 'divider') return 'divider'; // Added Divider
    if (uiWidget === 'textarea') return 'textarea';
    if (uiWidget === 'password') return 'password';
    if (uiWidget === 'radio') return 'radio';
    if (uiWidget === 'select') return 'select';
    if (uiWidget === 'checkbox') return 'checkbox';
    if (uiWidget === 'toggle') return 'toggle';
    if (uiWidget === 'range' || uiWidget === 'slider') return 'slider';
    if (uiWidget === 'multiselect') return 'multiselect';
    if (uiWidget === 'date') return 'date';
    if (uiWidget === 'datetime-local') return 'datetime-local';
    if (uiWidget === 'email') return 'email';
    // Add more ui:widget mappings if needed

    // Handle enum based on type and potential ui:widget hint (if not already handled)
    if (propSchema.enum) {
        // If ui:widget wasn't 'radio', default enum to 'select'
        return 'select';
    }

    // Fallback to type and format
    switch (propSchema.type) {
        case 'string':
            // Map specific string formats to component types
            if (propSchema.format === 'textarea') return 'textarea';
            if (propSchema.format === 'date') return 'date'; // Use 'date' component type
            if (propSchema.format === 'time') return 'time'; // Use 'time' component type
            if (propSchema.format === 'date-time') return 'datetime-local'; // Use 'datetime-local' component type
            if (propSchema.format === 'password') return 'password';
            if (propSchema.format === 'email') return 'email';
            return 'text';
        case 'number':
        case 'integer':
            // Check format if ui:widget wasn't 'range'/'slider'
            if (propSchema.format === 'range') return 'slider';
            return 'number';
        case 'boolean':
             // Check format if ui:widget wasn't 'toggle'/'checkbox'
            if (propSchema.format === 'toggle') return 'toggle';
            return 'checkbox';
        case 'object':
            // Check if it has properties, otherwise it might be a complex object handled by a plugin
            if (propSchema.properties) {
                return 'fieldset'; // Render objects with properties as fieldsets
            }
            return 'complex'; // Placeholder for objects without properties (e.g., file map)
        case 'array':
            // Check if items is an object with an enum and ui:widget wasn't 'multiselect'
            if (typeof propSchema.items === 'object' &&
                !Array.isArray(propSchema.items) &&
                propSchema.items.enum) {
                // Could also check for uiOptions.widget === 'checkboxes' here for checkbox group
                return 'multiselect'; // Default for array of enums
            }
            // Check for array of objects specifically for repeating sections
            if (typeof propSchema.items === 'object' &&
                !Array.isArray(propSchema.items) &&
                propSchema.items.type === 'object') {
                return 'repeatingSection'; // Specific type for array of objects
            }
            // Handle other array types (like array of strings, numbers, or enums for multiselect)
            return 'array'; // Generic placeholder for other/unhandled array types
        default:
            if (Array.isArray(propSchema.type) || propSchema.type === null) {
                return 'text'; // Or 'unknown'
            }
            return propSchema.type || 'text'; // Fallback
    }
}
