import React from 'react';
import { FieldComponentProps } from '../../plugins/pluginRegistry'; // Import shared props
import styles from './Field.module.css'; // Reuse shared styles
import FieldError from './FieldError'; // Import the FieldError component

// Extend FieldComponentProps, overriding types as needed
interface CheckboxFieldProps extends Omit<FieldComponentProps, 'value' | 'onChange'> {
    value: boolean; // Override value type
    onChange: (path: string, value: boolean) => void; // Override onChange type
    // required, error, className, style, onFieldBlur are inherited
    // Add other props like disabled, etc. as needed
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({
    path,
    label,
    value,
    onChange,
    onFieldBlur, // Destructure onFieldBlur
    required,
    error,
    className, // Destructure className
    style, // Destructure style
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(path, event.target.checked);
        // Optionally trigger blur immediately after change for checkboxes?
        // handleBlur();
    };

    const handleBlur = () => {
        // Call the handler from props, even for checkbox
        onFieldBlur?.(path);
    };

    // Combine base class with potential custom class
    const containerClass = `${styles.fieldContainer} ${className || ''}`.trim();

    // Apply a different container style if needed, or adjust label placement
    return (
        <div className={containerClass} style={style}>
             {/* For checkboxes, often the input comes before the label text */}
            <label htmlFor={path} className={styles.fieldLabel}>
                 <input
                    type="checkbox"
                    id={path}
                    name={path}
                    checked={!!value} // Ensure boolean value
                    onChange={handleChange}
                    onBlur={handleBlur} // Attach the blur handler
                    required={required}
                    aria-describedby={error ? `${path}-error` : undefined} // Link error message
                    // Add a specific class if needed: className={styles.checkboxInput}
                />
                {label}
                {required && <span className={styles.requiredIndicator}>*</span>}
            </label>
            {/* Use the FieldError component */}
            <FieldError error={error} path={path} />
        </div>
    );
};

export default CheckboxField;
