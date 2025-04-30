import React from 'react';
import { FieldComponentProps } from '../../plugins/pluginRegistry'; // Import shared props
import styles from './Field.module.css'; // Shared or specific styles
import FieldError from './FieldError'; // Import the FieldError component

// Use FieldComponentProps and extend if necessary, or redefine if simpler
interface TextFieldProps extends Omit<FieldComponentProps, 'value' | 'onChange'> {
    value: string; // Override value to be string
    onChange: (path: string, value: string) => void; // Override onChange
    // Allow standard HTML input types including date/time
    type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'date' | 'time' | 'datetime-local';
    placeholder?: string;
    error?: string;
    className?: string; // Add className prop
    style?: React.CSSProperties; // Add style prop
    // onFieldBlur is inherited from FieldComponentProps
    // Add other props like disabled, etc. as needed
}

const TextField: React.FC<TextFieldProps> = ({
    path,
    label,
    value,
    onChange,
    onFieldBlur, // Destructure onFieldBlur
    required,
    type = 'text',
    placeholder,
    error,
    className, // Destructure className
    style, // Destructure style
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
            <input
                type={type} // Use the passed type prop
                id={path}
                name={path}
                value={value || ''} // Ensure controlled component
                onChange={handleChange}
                onBlur={handleBlur} // Attach the blur handler
                required={required}
                placeholder={placeholder}
                className={`${styles.fieldInput} ${error ? styles.inputError : ''}`} // Add error class conditionally
                aria-invalid={!!error} // Accessibility
                aria-describedby={error ? `${path}-error` : undefined} // Accessibility
            />
            <FieldError error={error} path={path} /> {/* Use FieldError component */}
        </div>
    );
};

export default TextField;
