import React from 'react';

interface HeadingProps {
  level?: number; // Heading level (1-6)
  text?: string; // Heading text
  className?: string; // Optional custom class
  style?: React.CSSProperties; // Optional inline styles
}

const Heading: React.FC<HeadingProps> = ({
  level = 2, // Default to h2
  text,
  className,
  style,
}) => {
  if (!text) {
    return null; // Don't render if no text is provided
  }

  // Ensure level is within the valid range (1-6)
  const validLevel = Math.max(1, Math.min(6, level));
  const Tag = `h${validLevel}` as keyof JSX.IntrinsicElements;

  return (
    <Tag className={className} style={style}>
      {text}
    </Tag>
  );
};

export default Heading;
