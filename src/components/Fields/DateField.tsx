import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Import CSS here or globally
import { FieldComponentProps } from '../../plugins/pluginRegistry'; // Import shared props
import styles from './Field.module.css';
import FieldError from './FieldError'; // Import the FieldError component

// Extend FieldComponentProps, overriding types as needed
interface DateFieldProps extends Omit<FieldComponentProps, 'value' | 'onChange'> {
    value: Date | string | null | undefined; // Override value type
    onChange: (path: string, value: Date | null) => void; // Override onChange type
    dateFormat?: string; // Allow custom date format
    // required, error, className, style, onFieldBlur are inherited
    // Add other props like disabled, minDate, maxDate as needed
}

const DateField: React.FC<DateFieldProps> = ({
    path,
    label,
    value,
    onChange,
    onFieldBlur, // Destructure onFieldBlur
    required,
    error,
    className,
    style,
    dateFormat = "yyyy-MM-dd", // Default format
}) => {
    const handleChange = (date: Date | null) => {
        onChange(path, date);
    };

    const handleBlur = () => {
        // react-datepicker's onBlur triggers when the input field loses focus
        onFieldBlur?.(path);
    };

    // Convert string value to Date object if necessary
    const selectedDate = value instanceof Date ? value : (typeof value === 'string' ? new Date(value) : null);
    // Handle invalid date strings resulting in Invalid Date object
    const isValidDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime());

    const containerClass = `${styles.fieldContainer} ${className || ''}`.trim();
    const inputClass = `${styles.fieldInput} ${error ? styles.inputError : ''}`;

    return (
        <div className={containerClass} style={style}>
            <label htmlFor={path} className={styles.fieldLabel}>
                {label}
                {required && <span className={styles.requiredIndicator}>*</span>}
            </label>
            <DatePicker
                id={path}
                selected={isValidDate ? selectedDate : null}
                onChange={handleChange}
                onBlur={handleBlur} // Attach the blur handler
                dateFormat={dateFormat}
                className={inputClass} // Apply input styling
                wrapperClassName={styles.datePickerWrapper} // Optional: for wrapper styling if needed
                placeholderText={`Select ${label.toLowerCase()}`}
                aria-invalid={!!error}
                aria-describedby={error ? `${path}-error` : undefined}
                autoComplete="off" // Prevent browser autocomplete
            />
            <FieldError error={error} path={path} /> {/* Use FieldError component */}
        </div>
    );
};

export default DateField;
