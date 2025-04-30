import React from 'react';
import styles from './Field.module.css'; // Import shared styles

interface FieldErrorProps {
  error?: string; // Error message string (optional)
  path: string;   // Field path used for generating the id
}

const FieldError: React.FC<FieldErrorProps> = ({ error, path }) => {
  if (!error) {
    return null; // Don't render anything if there's no error
  }

  return (
    <p id={`${path}-error`} className={styles.errorMessage} role="alert">
      {error}
    </p>
  );
};

export default FieldError;
