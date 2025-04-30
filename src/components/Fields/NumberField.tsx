import React from 'react';
import { FieldComponentProps } from '../../plugins/pluginRegistry'; // Import shared props
import styles from './Field.module.css'; // Reuse shared styles
import FieldError from './FieldError'; // Import the FieldError component

// Extend FieldComponentProps, overriding types as needed
interface NumberFieldProps extends Omit<FieldComponentProps, 'value' | 'onChange'> {
    value: number | undefined; // Override value type
    onChange: (path: string, value: number | undefined) => void; // Override onChange type
    // min, max, step are inherited if defined in FieldComponentProps, otherwise define here
    min?: number;
    max?: number;
    step?: number;
    // error, className, style, onFieldBlur are inherited
    // Add other props like placeholder, disabled, etc. as needed
}

const NumberField: React.FC<NumberFieldProps> = ({
    path,
    label,
    value,
    onChange,
    onFieldBlur, // Destructure onFieldBlur
    required,
    min,
    max,
    step,
    error,
    className, // Destructure className
    style, // Destructure style
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const stringValue = event.target.value;
        // Parse the string value to a number
        // Use parseFloat for potential decimals, or parseInt if only integers are expected
        // Handle empty string case - should it be undefined or 0? Let's use undefined.
        const numberValue = stringValue === '' ? undefined : parseFloat(stringValue);

        // Optional: Add validation here to ensure it's a valid number before calling onChange
        // if (stringValue !== '' && !isNaN(numberValue)) {
        onChange(path, numberValue);
        // } else if (stringValue === '') {
        //     onChange(path, undefined);
        // }
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
            <input
                type="number"
                id={path}
                name={path}
                value={value ?? ''} // Render empty string if value is undefined/null
                onChange={handleChange}
                onBlur={handleBlur} // Attach the blur handler
                required={required}
                min={min}
                max={max}
                step={step}
                className={`${styles.fieldInput} ${error ? styles.inputError : ''}`} // Add error class conditionally
                aria-invalid={!!error} // Accessibility
                aria-describedby={error ? `${path}-error` : undefined} // Accessibility
            />
            <FieldError error={error} path={path} /> {/* Use FieldError component */}
        </div>
    );
};

export default NumberField;
