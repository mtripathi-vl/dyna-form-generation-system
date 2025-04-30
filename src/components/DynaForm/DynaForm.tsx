import React, { useEffect, useCallback } from 'react';
import { JSONSchema7 } from 'json-schema'; // Removed JSONSchema7Definition
import { useDispatch, useSelector } from 'react-redux';
import get from 'lodash-es/get'; // Import lodash get
import { AppDispatch, RootState } from '../../store';
import {
    initializeForm,
    updateFieldValue,
    setValidationErrors,
    clearValidationErrors,
    addArrayItem, // Import new actions
    removeArrayItem // Import new actions
} from '../../store/formDataSlice';
import { validateFormData } from '../../services/validationService';
// Import mapSchemaTypeToComponent as well
import { interpretSchema, InterpretedField, VisibilityCondition, mapSchemaTypeToComponent } from '../../services/schemaInterpreter';
import { findMatchingPlugin, FieldComponentProps } from '../../plugins/pluginRegistry'; // Import plugin system
import TextField from '../Fields/TextField';
import CheckboxField from '../Fields/CheckboxField';
import RadioGroupField from '../Fields/RadioGroupField';
import NumberField from '../Fields/NumberField';
import TextareaField from '../Fields/TextareaField';
import SelectField from '../Fields/SelectField';
import ToggleField from '../Fields/ToggleField';
import SliderField from '../Fields/SliderField';
import MultiSelectField from '../Fields/MultiSelectField';
import DateField from '../Fields/DateField'; // Import DateField
import TimeField from '../Fields/TimeField'; // Import TimeField
import DateTimeField from '../Fields/DateTimeField'; // Import DateTimeField
import Tabs from '../Layout/Tabs';
import CardSection from '../Layout/CardSection'; // Import the new component
import Heading from '../Layout/Heading'; // Import Heading
import Divider from '../Layout/Divider'; // Import Divider

// Use lodash get instead of custom getNestedValue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNestedValue = (obj: Record<string, any>, path: string): unknown => get(obj, path);

// Helper function to evaluate visibility conditions
function evaluateVisibility(
    condition: VisibilityCondition | undefined,
    formValues: Record<string, unknown>
): boolean {
    if (!condition) {
        return true; // Always visible if no condition is defined
    }

    const controllingValue = getNestedValue(formValues, condition.fieldPath);

    switch (condition.operator) {
        case 'equals':
            // Use loose equality (==) to handle potential type differences (e.g., '1' == 1)
            // eslint-disable-next-line eqeqeq
            return controllingValue == condition.value;
        case 'notEquals':
            // eslint-disable-next-line eqeqeq
            return controllingValue != condition.value;
        case 'exists':
            // Check if the value is not undefined or null
            return controllingValue !== undefined && controllingValue !== null;
        case 'doesNotExist':
            // Check if the value is undefined or null
            return controllingValue === undefined || controllingValue === null;
        default:
            console.warn(`Unsupported visibility operator: ${condition.operator}`);
            return true; // Default to visible if operator is unknown
    }
}


interface DynaFormProps {
  schema: JSONSchema7;
  onSubmit?: (formData: Record<string, unknown>) => void;
}

// Correct component definition
const DynaForm: React.FC<DynaFormProps> = ({ schema, onSubmit }) => {
  const dispatch = useDispatch<AppDispatch>();
  const formValues = useSelector((state: RootState) => state.formData.values);
  const formErrors = useSelector((state: RootState) => state.formData.errors);
  // Removed hasSubmitted state

  useEffect(() => {
    if (schema) {
      dispatch(initializeForm({ schema }));
      // Removed setHasSubmitted(false)
    }
  }, [schema, dispatch]);

  const interpretedSchema = interpretSchema(schema);

  const handleFieldChange = useCallback((path: string, value: unknown) => {
    dispatch(updateFieldValue({ path, value }));
  }, [dispatch]);

  // New handler for blur events
  const handleBlur = useCallback(() => {
    // Re-validate the entire form on blur for simplicity
    // A more optimized approach might validate only the specific field
    // or use a debounced validation, but this ensures consistency with AJV's full schema validation
    console.log('Field blurred, re-validating form with data:', formValues);
    const validationResult = validateFormData(schema, formValues);
    console.log('Validation Result on Blur:', validationResult);
    // Update errors in the store regardless of validity
    // This ensures errors are cleared if the field becomes valid
    dispatch(setValidationErrors(validationResult.errors));
  }, [dispatch, schema, formValues]); // Include dependencies

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Removed setHasSubmitted(true);
    console.log('Attempting form submission with data:', formValues);

    const validationResult = validateFormData(schema, formValues);
    console.log('Validation Result:', validationResult);

    if (validationResult.isValid) {
      dispatch(clearValidationErrors());
      console.log('Form is valid. Submitting...');
      onSubmit?.(formValues);
    } else {
      console.log('Form is invalid. Setting errors.');
      dispatch(setValidationErrors(validationResult.errors));
    }
  };

  // Define renderField within DynaForm scope so it can access state/handlers
  const renderField = (field: InterpretedField): React.ReactNode => {
    // --- Visibility Check ---
    const isVisible = evaluateVisibility(field.visibleWhen, formValues);
    if (!isVisible) {
        // TODO: Consider dispatching an action to clear the field's value and errors when hidden
        return null; // Don't render the field if it's not visible
    }

    const rawValue = getNestedValue(formValues, field.path);
    const error = formErrors[field.path];
    const showError = !!error; // Show error if it exists, regardless of submission status

    // --- Plugin Integration ---
    const matchingPlugin = findMatchingPlugin(field);
    const PluginComponent = matchingPlugin?.component;

    // --- Default Component Mapping (Fallback) ---
    // Use 'any' for props type as a pragmatic way to handle component map
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let DefaultComponent: React.ComponentType<any> | undefined = undefined;
    if (!PluginComponent) { // Only map default if no plugin component exists
        switch (field.componentType) {
            case 'text': case 'password': case 'email':
                DefaultComponent = TextField; break;
            case 'date': DefaultComponent = DateField; break; // Use DateField
            case 'time': DefaultComponent = TimeField; break; // Use TimeField
            case 'datetime-local': DefaultComponent = DateTimeField; break; // Use DateTimeField
            case 'number': DefaultComponent = NumberField; break;
            case 'checkbox': DefaultComponent = CheckboxField; break;
            case 'radio': DefaultComponent = RadioGroupField; break;
            case 'textarea': DefaultComponent = TextareaField; break;
            case 'select': DefaultComponent = SelectField; break;
            case 'toggle': DefaultComponent = ToggleField; break;
            case 'slider': DefaultComponent = SliderField; break;
            case 'multiselect': DefaultComponent = MultiSelectField; break;
            case 'heading': DefaultComponent = Heading; break; // Added Heading
            case 'divider': DefaultComponent = Divider; break; // Added Divider
            case 'fieldset': break; // Handled by CardSection rendering logic below
            case 'repeatingSection': break; // Handled by repeating section logic below
            case 'array': // Generic array (e.g., array of strings, handled by multiselect or potentially other widgets)
            case 'complex': // Complex objects potentially handled by plugins
                // If no plugin matched, render nothing or a placeholder for these types for now
                return null;
            default:
                console.warn(`Unsupported component type: ${field.componentType} for path: ${field.path}`);
                return <div key={field.path}>Unsupported field type: {field.componentType}</div>;
        }
    }

    // --- Prepare Props ---
    // Base props for FieldComponentProps interface
    let componentProps: FieldComponentProps = {
        path: field.path,
        label: field.label || field.path,
        value: rawValue, // Pass raw value, component or plugin needs to handle type assertion/conversion
        onChange: handleFieldChange,
        required: field.required,
        error: showError ? error : undefined,
        placeholder: field.placeholder,
        className: field.classNames,
        style: field.style,
        options: field.options,
        min: field.schema.minimum,
        max: field.schema.maximum,
        step: field.schema.multipleOf,
        // rows: (field.schema as any).rows, // Avoid 'any', let components access schema if needed
        schema: field.schema,
        onFieldBlur: handleBlur, // Pass the blur handler
    };

    // --- Apply Plugin Prop Processing ---
    if (matchingPlugin?.processProps) {
        componentProps = matchingPlugin.processProps(componentProps, field);
    }

    // --- Render ---
    const ComponentToRender = PluginComponent || DefaultComponent;

    // Handle fieldset rendering using CardSection
    if (field.componentType === 'fieldset') {
        // Find direct children fields for this fieldset
        const childFields = interpretedSchema.fields.filter(
          (f: InterpretedField) => f.path.startsWith(`${field.path}.`) && !f.path.substring(field.path.length + 1).includes('.')
        );
        // Render children within the CardSection
        return (
          <CardSection
            key={field.path}
            title={field.label || ''}
            className={field.classNames} // Pass custom classes from schema
            style={field.style} // Pass custom styles from schema
          >
            {childFields.map(renderField)}
          </CardSection>
        );
    }

    // --- Handle Repeating Section Rendering ---
    if (field.componentType === 'repeatingSection') {
        const itemsArray = getNestedValue(formValues, field.path) as unknown[];
        const itemSchema = field.schema.items as JSONSchema7; // Schema for one item in the array

        // Ensure itemsArray is actually an array
        const validItemsArray = Array.isArray(itemsArray) ? itemsArray : [];

        // Extract UI options for button text etc.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uiOptions = (field.schema as any)['ui:options'] as { addButtonText?: string; removeButtonText?: string; itemTitle?: string } | undefined;
        const addButtonText = uiOptions?.addButtonText || `Add ${field.label || 'Item'}`;
        const removeButtonText = uiOptions?.removeButtonText || 'Remove';
        const itemTitleBase = uiOptions?.itemTitle || field.label || 'Item';

        return (
            <div key={field.path} className={`repeating-section ${field.classNames || ''}`} style={field.style}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>{field.label}</label>
                {validItemsArray.map((_itemData, index) => {
                    // Generate InterpretedField definitions for this specific item's fields
                    const itemFields: InterpretedField[] = [];
                    if (itemSchema && itemSchema.type === 'object' && itemSchema.properties) {
                        // Use the imported processProperties function (or similar logic)
                        // We need to adapt it slightly or create a specific version if processProperties isn't directly usable
                        // For now, let's assume we can get the properties and map them
                        Object.entries(itemSchema.properties).forEach(([itemKey, itemPropSchema]) => {
                            if (typeof itemPropSchema === 'object' && !Array.isArray(itemPropSchema)) {
                                // Minimal interpretation needed here, renderField will do the heavy lifting
                                // We mainly need the path and the original schema fragment
                                const itemFieldPath = `${field.path}.${index}.${itemKey}`;
                                // We need to reconstruct a minimal InterpretedField or pass necessary props directly
                                // Let's try reconstructing a minimal InterpretedField
                                const tempInterpretedField: InterpretedField = {
                                    path: itemFieldPath,
                                    type: itemPropSchema.type as string || 'string',
                                    label: itemPropSchema.title || itemKey,
                                    required: itemSchema.required?.includes(itemKey),
                                    schema: itemPropSchema,
                                    // Determine componentType for the item field using the imported helper
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    componentType: mapSchemaTypeToComponent(itemPropSchema, (itemPropSchema as any)['ui:widget']),
                                    // Extract UI hints specific to the item property
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    placeholder: (itemPropSchema as any)['ui:placeholder'] || itemPropSchema.description,
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    classNames: (itemPropSchema as any)['ui:classNames'],
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    style: (itemPropSchema as any)['ui:style'],
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    visibleWhen: (itemPropSchema as any)['ui:visibleWhen'], // TODO: Adjust visibleWhen path relative to item data?
                                    options: itemPropSchema.enum
                                        ? itemPropSchema.enum.map(val => ({
                                              value: val as string | number,
                                              label: String(val)
                                          }))
                                        : undefined,
                                };
                                itemFields.push(tempInterpretedField);
                            }
                        });
                    }

                    const itemTitle = `${itemTitleBase} ${index + 1}`;

                    return (
                        <CardSection key={`${field.path}.${index}`} title={itemTitle} className="repeating-section-item" style={{ marginBottom: '1rem', position: 'relative' }}>
                             <button
                                type="button"
                                onClick={() => dispatch(removeArrayItem({ path: field.path, index }))}
                                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'red', color: 'white', border: 'none', padding: '0.2rem 0.5rem', cursor: 'pointer', borderRadius: '3px' }}
                                aria-label={`${removeButtonText} ${itemTitle}`}
                            >
                                {removeButtonText}
                            </button>
                            {itemFields.map(itemField => renderField(itemField))}
                        </CardSection>
                    );
                })}
                <button
                    type="button"
                    onClick={() => dispatch(addArrayItem({ path: field.path }))}
                    style={{ marginTop: '0.5rem' }}
                >
                    {addButtonText}
                </button>
            </div>
        );
    }


    // Render the determined component with the final props
    if (ComponentToRender) {
        // Handle specific prop adjustments needed for default components *after* plugin processing
        // Start with the base props type, specific adjustments might narrow it down
        let finalProps: FieldComponentProps = componentProps;

        // Adjust props based on the *actual* component being rendered
        if (ComponentToRender === TextField) {
            // Determine type for TextField based on componentType (excluding date/time now)
            const textFieldType =
                field.componentType === 'email' ? 'email' :
                field.componentType === 'password' ? 'password' :
                'text'; // Default to text
            finalProps = {
                ...finalProps,
                value: String(componentProps.value ?? ''), // Ensure string
                type: textFieldType,
            };
        } else if (ComponentToRender === CheckboxField || ComponentToRender === ToggleField) {
             finalProps = { ...finalProps, value: Boolean(componentProps.value ?? false) }; // Ensure boolean
        } else if (ComponentToRender === DateField || ComponentToRender === TimeField || ComponentToRender === DateTimeField) {
            // Value is already handled correctly by the wrapper components (accept Date | string | null | undefined)
            // No specific adjustment needed here, but we ensure it doesn't fall into TextField logic.
        } else if (ComponentToRender === MultiSelectField) {
            // Extract options specifically for MultiSelect if not already processed by plugin
            const itemsSchema = field.schema.items as JSONSchema7;
            const multiOptions = finalProps.options || (itemsSchema?.enum // Use existing options if plugin provided them
              ? itemsSchema.enum.map((val: unknown) => ({ // Add type for val
                  value: val as string | number,
                  label: String(val)
                }))
              : []);
            finalProps = {
                ...finalProps,
                options: multiOptions,
                value: componentProps.value as (string | number)[] | undefined, // Expect array
            };
        } else if (ComponentToRender === NumberField) {
             finalProps = { ...finalProps, value: componentProps.value as number | undefined }; // Expect number
        }
        // Add similar type assertions/adjustments for RadioGroupField, SelectField, SliderField if needed

        // Handle Heading rendering separately to avoid type errors with finalProps
        if (ComponentToRender === Heading) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const uiOptions = (field.schema as any)['ui:options'] as { level?: number; text?: string } | undefined;
            return (
                <Heading
                    key={field.path}
                    level={uiOptions?.level}
                    text={uiOptions?.text || field.label} // Use label as fallback text
                    className={finalProps.className} // Pass className from finalProps
                    style={finalProps.style} // Pass style from finalProps
                />
            );
        }

        // Handle Divider specific props (currently none beyond className/style)
        // if (ComponentToRender === Divider) { ... }

        // Use field.path for React key, not part of componentProps interface
        // Render other components using the finalProps
        return <ComponentToRender key={field.path} {...finalProps} />;
    }

    return null; // Fallback if no component could be determined
  };

  // Define renderFormContent within DynaForm scope
  const renderFormContent = () => {
    const topLevelFields = interpretedSchema.fields.filter((f: InterpretedField) => !f.path.includes('.'));

    if (interpretedSchema.layout?.view === 'tabs' && interpretedSchema.layout.groups.length > 0) {
      const tabGroups = interpretedSchema.layout.groups.map((group: { title: string; fields: { path: string }[] }) => { // Add types
        // Find InterpretedField objects for this group
        const groupFields = group.fields
            .map(fieldInfo => interpretedSchema.fields.find((f: InterpretedField) => f.path === fieldInfo.path))
            .filter((f): f is InterpretedField => !!f); // Type guard

        // Render only the top-level fields within this group directly in the tab
        // Nested fields within fieldsets will be handled by the fieldset's renderField call
        const topLevelGroupFields = groupFields.filter((f: InterpretedField) => {
            const parentPath = f.path.substring(0, f.path.lastIndexOf('.'));
            // Check if the parent is *not* also in this group's field list (meaning f is top-level *within the group's scope*)
            // OR if the parent is a fieldset defined within this group
            const parentField = groupFields.find(pf => pf.path === parentPath);
            return !parentPath || !group.fields.some(gf => gf.path === parentPath) || parentField?.componentType === 'fieldset';
        });


        return {
          title: group.title,
          content: <>{topLevelGroupFields.map(renderField)}</>
        };
      });
      return <Tabs groups={tabGroups} />;
    } else {
      return <>{topLevelFields.map(renderField)}</>;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {renderFormContent()}
      <button type="submit" style={{ marginTop: '1rem' }}>Submit</button>
    </form>
  );
};

export default DynaForm;
