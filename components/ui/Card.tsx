import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700';
  const hoverClasses = hover ? 'transition-shadow hover:shadow-lg cursor-pointer' : '';
  const clickableProps = onClick ? { onClick, role: 'button', tabIndex: 0 } : {};

  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`}
      {...clickableProps}
    >
      {children}
    </div>
  );
}