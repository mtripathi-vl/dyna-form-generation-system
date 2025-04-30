import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Ensure CSS is imported
import { FieldComponentProps } from '../../plugins/pluginRegistry'; // Import shared props
import styles from './Field.module.css';
import FieldError from './FieldError'; // Import the FieldError component

// Extend FieldComponentProps, overriding types as needed
interface TimeFieldProps extends Omit<FieldComponentProps, 'value' | 'onChange'> {
    value: Date | string | null | undefined; // Override value type
    onChange: (path: string, value: Date | null) => void; // Override onChange type
    timeFormat?: string; // Allow custom time format
    timeIntervals?: number; // Allow custom time intervals
    // required, error, className, style, onFieldBlur are inherited
    // Add other props like disabled, etc. as needed
}

const TimeField: React.FC<TimeFieldProps> = ({
    path,
    label,
    value,
    onChange,
    onFieldBlur, // Destructure onFieldBlur
    required,
    error,
    className,
    style,
    timeFormat = "h:mm aa", // Default format (e.g., 1:30 PM)
    timeIntervals = 15, // Default interval
}) => {
    const handleChange = (date: Date | null) => {
        onChange(path, date);
    };

    const handleBlur = () => {
        // react-datepicker's onBlur triggers when the input field loses focus
        onFieldBlur?.(path);
    };

    // Convert string value to Date object if necessary
    // For time-only, the date part doesn't matter as much, but DatePicker uses Date objects
    const selectedTime = value instanceof Date ? value : (typeof value === 'string' ? new Date(`1970-01-01T${value}`) : null); // Use a fixed date for time parsing
    const isValidTime = selectedTime instanceof Date && !isNaN(selectedTime.getTime());

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
                selected={isValidTime ? selectedTime : null}
                onChange={handleChange}
                onBlur={handleBlur} // Attach the blur handler
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={timeIntervals}
                timeCaption="Time"
                dateFormat={timeFormat}
                className={inputClass}
                wrapperClassName={styles.datePickerWrapper}
                placeholderText={`Select ${label.toLowerCase()}`}
                aria-invalid={!!error}
                aria-describedby={error ? `${path}-error` : undefined}
                autoComplete="off"
            />
            <FieldError error={error} path={path} /> {/* Use FieldError component */}
        </div>
    );
};

export default TimeField;
