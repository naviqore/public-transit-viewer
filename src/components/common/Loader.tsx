import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  text?: string;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({
  text = 'Loading...',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 space-y-3 ${className}`}
    >
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {text}
      </p>
    </div>
  );
};

export default Loader;
