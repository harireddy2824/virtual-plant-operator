import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  height?: string;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  count = 1,
  height = '80px',
  className = '',
}) => {
  return (
    <div className={`skeleton-wrap ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton-card mb-3"
          style={{ height }}
          aria-label="Loading..."
        />
      ))}
    </div>
  );
};
