import React from 'react';
import { FieldComponentProps } from '../../plugins/pluginRegistry'; // Import shared props
import styles from './Field.module.css'; // Reuse shared styles
import FieldError from './FieldError'; // Import the FieldError component

// Extend FieldComponentProps, overriding types as needed
interface TextareaFieldProps extends Omit<FieldComponentProps, 'value' | 'onChange'> {
    value: string; // Override value type
    onChange: (path: string, value: string) => void; // Override onChange type
    // placeholder, rows, error, className, style, onFieldBlur are inherited
    // Add other props like disabled, etc. as needed
}

const TextareaField: React.FC<TextareaFieldProps> = ({
    path,
    label,
    value,
    onChange,
    onFieldBlur, // Destructure onFieldBlur
    required,
    placeholder,
    rows = 3, // Default rows (rows might be in FieldComponentProps or specific here)
    error,
    className, // Destructure className
    style, // Destructure style
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(path, event.target.value);
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
            <textarea
                id={path}
                name={path}
                value={value || ''} // Ensure controlled component
                onChange={handleChange}
                onBlur={handleBlur} // Attach the blur handler
                required={required}
                placeholder={placeholder}
                rows={rows}
                className={`${styles.fieldInput} ${error ? styles.inputError : ''}`} // Add error class conditionally
                aria-invalid={!!error} // Accessibility
                aria-describedby={error ? `${path}-error` : undefined} // Accessibility
            />
            <FieldError error={error} path={path} /> {/* Use FieldError component */}
        </div>
    );
};

export default TextareaField;
