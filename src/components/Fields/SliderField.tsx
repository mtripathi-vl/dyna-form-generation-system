import React from 'react';
import { FieldComponentProps } from '../../plugins/pluginRegistry'; // Import shared props
import styles from './Field.module.css'; // Reuse shared styles
import FieldError from './FieldError'; // Import the FieldError component

// Extend FieldComponentProps, overriding types as needed
interface SliderFieldProps extends Omit<FieldComponentProps, 'value' | 'onChange'> {
    value: number | undefined; // Override value type
    onChange: (path: string, value: number | undefined) => void; // Override onChange type
    // min, max, step, required, error, className, style, onFieldBlur are inherited
    // Add other props like disabled, etc. as needed
}

const SliderField: React.FC<SliderFieldProps> = ({
    path,
    label,
    value,
    onChange,
    onFieldBlur, // Destructure onFieldBlur
    // required, // Sliders usually aren't required
    min = 0,
    max = 100,
    step = 1,
    error,
    className, // Destructure className
    style, // Destructure style
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const numberValue = parseFloat(event.target.value);
        onChange(path, isNaN(numberValue) ? undefined : numberValue);
    };

    const handleBlur = () => {
        // Call the handler from props when the slider loses focus
        onFieldBlur?.(path);
    };

    // Display current value next to the slider
    const displayValue = value !== undefined ? value : 'N/A';

    // Combine base class with potential custom class
    const containerClass = `${styles.fieldContainer} ${className || ''}`.trim();

    return (
        <div className={containerClass} style={style}>
            <label htmlFor={path} className={styles.fieldLabel}>
                {label}: <span className={styles.sliderValue}>{displayValue}</span>
                {/* Required indicator might not make sense */}
            </label>
            <input
                type="range"
                id={path}
                name={path}
                value={value ?? ''} // Render empty string if value is undefined/null
                onChange={handleChange}
                onBlur={handleBlur} // Attach the blur handler
                min={min}
                max={max}
                step={step}
                className={`${styles.fieldInput} ${error ? styles.inputError : ''}`} // Add error class conditionally? Slider might not show error state visually
                aria-invalid={!!error} // Accessibility
                aria-describedby={error ? `${path}-error` : undefined} // Accessibility
            />
            <FieldError error={error} path={path} /> {/* Use FieldError component */}
        </div>
    );
};

export default SliderField;
