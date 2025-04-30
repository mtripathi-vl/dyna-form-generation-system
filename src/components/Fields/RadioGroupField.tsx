import React from 'react';
import { FieldComponentProps } from '../../plugins/pluginRegistry'; // Import shared props
import styles from './Field.module.css'; // Reuse shared styles
import FieldError from './FieldError'; // Import the FieldError component

// Define the shape of each option (can remain specific or use FieldComponentProps['options'])
interface RadioOption {
    value: string | number;
    label: string;
}

// Extend FieldComponentProps, overriding types as needed
interface RadioGroupFieldProps extends Omit<FieldComponentProps, 'value' | 'onChange' | 'options'> {
    value: string | number | undefined; // Override value type
    onChange: (path: string, value: string | number) => void; // Override onChange type
    options: RadioOption[]; // Keep specific options type or use FieldComponentProps['options']
    // required, error, className, style, onFieldBlur are inherited
    // Add other props like disabled, etc. as needed
}

const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
    path,
    label,
    value,
    onChange,
    onFieldBlur, // Destructure onFieldBlur
    options = [],
    required,
    error,
    className, // Destructure className
    style, // Destructure style
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Input value is always string, parse if needed based on original option type?
        // For simplicity, let's assume string value for now, or handle parsing if required.
        onChange(path, event.target.value);
        // Optionally trigger blur immediately after change?
        // handleBlur();
    };

    const handleBlur = () => {
        // Call the handler from props when any radio button blurs
        onFieldBlur?.(path);
    };

    // Combine base class with potential custom class
    const containerClass = `${styles.fieldContainer} ${className || ''}`.trim();

    return (
        // Using fieldset and legend for semantic grouping
        <fieldset
            className={containerClass}
            style={style}
            aria-describedby={error ? `${path}-error` : undefined} // Link error message
        >
            <legend className={styles.fieldLabel}>
                {label}
                {required && <span className={styles.requiredIndicator}>*</span>}
            </legend>
            {options.map((option) => (
                // Wrapper div for each radio option for styling/layout
                <div key={option.value} className={styles.radioOptionContainer}>
                    <label htmlFor={`${path}-${option.value}`} className={styles.radioLabel}>
                        <input
                            type="radio"
                            id={`${path}-${option.value}`}
                            name={path} // All radios in the group share the same name
                            value={option.value}
                            checked={String(option.value) === String(value)} // Compare as strings for safety
                            onChange={handleChange}
                            onBlur={handleBlur} // Attach the blur handler
                            required={required}
                            className={styles.radioInput} // Add specific class if needed
                        />
                        {option.label}
                    </label>
                </div>
            ))}
            <FieldError error={error} path={path} /> {/* Use FieldError component */}
        </fieldset>
    );
};

export default RadioGroupField;
