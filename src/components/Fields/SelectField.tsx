import React from 'react';
import { FieldComponentProps } from '../../plugins/pluginRegistry'; // Import shared props
import styles from './Field.module.css'; // Reuse shared styles
import FieldError from './FieldError'; // Import the FieldError component

// Define the shape of each option (can remain specific or use FieldComponentProps['options'])
interface SelectOption {
    value: string | number;
    label: string;
}

// Extend FieldComponentProps, overriding types as needed
interface SelectFieldProps extends Omit<FieldComponentProps, 'value' | 'onChange' | 'options'> {
    value: string | number | undefined; // Override value type
    onChange: (path: string, value: string | number) => void; // Override onChange type
    options: SelectOption[]; // Keep specific options type or use FieldComponentProps['options']
    // placeholder, required, error, className, style, onFieldBlur are inherited
    // Add other props like disabled, etc. as needed
}

const SelectField: React.FC<SelectFieldProps> = ({
    path,
    label,
    value,
    onChange,
    onFieldBlur, // Destructure onFieldBlur
    options = [],
    required,
    placeholder,
    error,
    className, // Destructure className
    style, // Destructure style
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedStringValue = event.target.value;
        // Find the original option to determine the correct type (string or number)
        const selectedOption = options.find(option => String(option.value) === selectedStringValue);

        // If a matching option is found, use its original value type.
        // Otherwise (e.g., placeholder selected), pass the string value.
        const valueToPass = selectedOption ? selectedOption.value : selectedStringValue;

        onChange(path, valueToPass);
    };

    const handleBlur = () => {
        onFieldBlur?.(path); // Call the handler from props
    };

    // Combine base class with potential custom class
    const containerClass = `${styles.fieldContainer} ${className || ''}`.trim();

    return (
        <div className={containerClass} style={style}>
            <label htmlFor={path} className={styles.fieldLabel}>
                {label}
                {required && <span className={styles.requiredIndicator}>*</span>}
            </label>
            <select
                id={path}
                name={path}
                value={value ?? ''} // Use empty string for undefined/null to match placeholder option
                onChange={handleChange}
                onBlur={handleBlur} // Attach the blur handler
                required={required}
                className={`${styles.fieldInput} ${error ? styles.inputError : ''}`} // Add error class conditionally
                aria-invalid={!!error} // Accessibility
                aria-describedby={error ? `${path}-error` : undefined} // Accessibility
            >
                {/* Add a placeholder option if specified and not required, or if value is undefined */}
                {/* Let's adjust placeholder logic slightly: show if placeholder exists, make it selectable if not required */}
                {placeholder && <option value="" disabled={required}>{placeholder}</option>}
                {/* Render options */}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <FieldError error={error} path={path} /> {/* Use FieldError component */}
        </div>
    );
};

export default SelectField;
