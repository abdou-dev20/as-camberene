import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/15 border-t-club-yellow" />
  </div>
);

export default LoadingSpinner;
