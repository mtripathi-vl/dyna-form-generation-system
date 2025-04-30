import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Ensure CSS is imported
import { FieldComponentProps } from '../../plugins/pluginRegistry'; // Import shared props
import styles from './Field.module.css';
import FieldError from './FieldError'; // Import the FieldError component

// Extend FieldComponentProps, overriding types as needed
interface DateTimeFieldProps extends Omit<FieldComponentProps, 'value' | 'onChange'> {
    value: Date | string | null | undefined; // Override value type
    onChange: (path: string, value: Date | null) => void; // Override onChange type
    dateFormat?: string; // Allow custom date format
    timeFormat?: string; // Allow custom time format
    timeIntervals?: number; // Allow custom time intervals
    // required, error, className, style, onFieldBlur are inherited
    // Add other props like disabled, minDate, maxDate as needed
}

const DateTimeField: React.FC<DateTimeFieldProps> = ({
    path,
    label,
    value,
    onChange,
    onFieldBlur, // Destructure onFieldBlur
    required,
    error,
    className,
    style,
    dateFormat = "yyyy-MM-dd h:mm aa", // Default format (e.g., 2023-10-27 1:30 PM)
    timeFormat = "h:mm aa", // Separate time format for the time list
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
    const selectedDateTime = value instanceof Date ? value : (typeof value === 'string' ? new Date(value) : null);
    const isValidDateTime = selectedDateTime instanceof Date && !isNaN(selectedDateTime.getTime());

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
                selected={isValidDateTime ? selectedDateTime : null}
                onChange={handleChange}
                onBlur={handleBlur} // Attach the blur handler
                showTimeSelect
                dateFormat={dateFormat}
                timeFormat={timeFormat}
                timeIntervals={timeIntervals}
                timeCaption="Time"
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

export default DateTimeField;
