import React from 'react';
import { FieldComponentProps } from '../../plugins/pluginRegistry'; // Import shared props
import styles from './Field.module.css'; // Reuse shared styles
import FieldError from './FieldError'; // Import the FieldError component
// import toggleStyles from './Toggle.module.css'; // Optional: for specific switch styles

// Extend FieldComponentProps, overriding types as needed
interface ToggleFieldProps extends Omit<FieldComponentProps, 'value' | 'onChange'> {
    value: boolean; // Override value type
    onChange: (path: string, value: boolean) => void; // Override onChange type
    // required, error, className, style, onFieldBlur are inherited
    // Add other props like disabled, etc. as needed
}

const ToggleField: React.FC<ToggleFieldProps> = ({
    path,
    label,
    value,
    onChange,
    onFieldBlur, // Destructure onFieldBlur
    // required, // Toggles usually aren't required
    error,
    className, // Destructure className
    style, // Destructure style
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(path, event.target.checked);
        // Optionally trigger blur immediately after change?
        // handleBlur();
    };

    const handleBlur = () => {
        // Call the handler from props
        onFieldBlur?.(path);
    };

    // Basic implementation using a checkbox, can be styled as a switch later
    // using toggleStyles
    // Combine base class with potential custom class
    const containerClass = `${styles.fieldContainer} ${className || ''}`.trim();

    return (
        <div className={containerClass} style={style}>
            <label htmlFor={path} className={styles.fieldLabel}>
                 {/* Consider a different structure/styling for switch appearance */}
                 <input
                    type="checkbox"
                    id={path}
                    name={path}
                    checked={!!value} // Ensure boolean value
                    onChange={handleChange}
                    onBlur={handleBlur} // Attach the blur handler
                    role="switch" // ARIA role for accessibility
                    // className={toggleStyles.input} // Apply switch-specific styles
                />
                {/* <span className={toggleStyles.slider}></span> */} {/* Example slider part */}
                {label}
                {/* Required indicator might not make sense for a toggle */}
            </label>
            {/* Use FieldError component */}
            <FieldError error={error} path={path} />
        </div>
    );
};

export default ToggleField;
