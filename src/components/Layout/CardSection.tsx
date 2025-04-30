import React from 'react';
import styles from './CardSection.module.css';

interface CardSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string; // Allow passing custom classes
  style?: React.CSSProperties; // Allow passing custom styles
}

const CardSection: React.FC<CardSectionProps> = ({
  title,
  children,
  className = '',
  style = {},
}) => {
  const combinedClassName = `${styles.cardSection} ${className}`.trim();

  return (
    <div className={combinedClassName} style={style}>
      {title && <h3 className={styles.cardHeader}>{title}</h3>}
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
};

export default CardSection;
