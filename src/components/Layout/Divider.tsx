import React from 'react';
import styles from './Divider.module.css'; // Create this CSS module next

interface DividerProps {
  className?: string; // Optional custom class
  style?: React.CSSProperties; // Optional inline styles
}

const Divider: React.FC<DividerProps> = ({ className, style }) => {
  // Combine base class with potential custom class
  const dividerClass = `${styles.divider} ${className || ''}`.trim();

  return (
    <hr
      className={dividerClass}
      style={style}
      role="separator" // Accessibility: Indicate the role
    />
  );
};

export default Divider;
