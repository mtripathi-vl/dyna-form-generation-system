import React from 'react';
import Select, { MultiValue } from 'react-select';
import { FieldComponentProps } from '../../plugins/pluginRegistry'; // Import shared props
import styles from './Field.module.css'; // Reuse shared styles
import FieldError from './FieldError'; // Import the FieldError component

// Define the shape of each option (matches react-select's expected format)
interface SelectOption {
    value: string | number;
    label: string;
}

// Extend FieldComponentProps, overriding types as needed
interface MultiSelectFieldProps extends Omit<FieldComponentProps, 'value' | 'onChange' | 'options'> {
    value: (string | number)[] | undefined; // Override value type
    onChange: (path: string, value: (string | number)[]) => void; // Override onChange type
    options: SelectOption[]; // Keep specific options type or use FieldComponentProps['options']
    // placeholder, required, error, className, style, onFieldBlur are inherited
    // Add other props like disabled, isClearable, etc. as needed
}

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
    path,
    label,
    value = [], // Default to empty array if undefined
    onChange,
    onFieldBlur, // Destructure onFieldBlur
    options = [],
    required,
    placeholder = "Select...",
    error,
    className, // Destructure className
    style, // Destructure style
}) => {
    // Map the primitive value array to react-select's option object array
    const selectedOptions = options.filter(option => value.includes(option.value));

    const handleChange = (selected: MultiValue<SelectOption>) => {
        // Extract the primitive values from the selected option objects
        const newValues = selected ? selected.map(option => option.value) : [];
        onChange(path, newValues);
    };

    const handleBlur = () => {
        // react-select's onBlur triggers when the whole component loses focus
        onFieldBlur?.(path);
    };

    // Custom styles for react-select to better match existing fields (optional)
    // Add error state styling
    const customSelectStyles = {
        control: (base: object, state: { isFocused: boolean }) => ({
            ...base,
            minHeight: '38px',
            borderColor: error ? 'red' : state.isFocused ? '#aaa' : '#ccc', // Error border color
             '&:hover': {
                borderColor: error ? 'red' : '#aaa',
            },
            boxShadow: 'none',
        }),
        input: (base: object) => ({
            ...base,
            margin: '0px',
        }),
        valueContainer: (base: object) => ({
            ...base,
            padding: '0 6px',
        }),
        indicatorsContainer: (base: object) => ({
            ...base,
            height: '38px',
        }),
        // Add more style overrides if needed
    };

    // Combine base class with potential custom class for the container
    const containerClass = `${styles.fieldContainer} ${className || ''}`.trim();

    return (
        <div className={containerClass} style={style}>
            <label htmlFor={path} className={styles.fieldLabel}>
                {label}
                {required && <span className={styles.requiredIndicator}>*</span>}
            </label>
            <Select
                inputId={path} // Link label correctly
                isMulti
                name={path}
                options={options}
                value={selectedOptions}
                onChange={handleChange}
                onBlur={handleBlur} // Attach the blur handler
                placeholder={placeholder}
                styles={customSelectStyles} // Apply custom styles
                // Add other react-select props like isClearable, isDisabled etc.
                // Pass className to react-select for wrapper styling (it uses className prop)
                className="react-select-container" // Base class for react-select
                classNamePrefix="react-select" // Prefix for internal elements
                aria-invalid={!!error} // Accessibility
                aria-describedby={error ? `${path}-error` : undefined} // Accessibility
            />
            <FieldError error={error} path={path} /> {/* Use FieldError component */}
        </div>
    );
};

export default MultiSelectField;
