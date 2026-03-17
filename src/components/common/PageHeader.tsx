import { LucideIcon } from 'lucide-react';
import React from 'react';

interface PageHeaderProps {
  title: string;
  icon: LucideIcon;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon: Icon,
  children,
}) => {
  return (
    <div className="flex-shrink-0 px-4 py-4 border-b-0 md:border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 z-10">
      <h2 className="text-lg font-bold flex items-center justify-center md:justify-start gap-2 text-slate-900 dark:text-white w-full md:w-auto">
        <Icon
          size={20}
          className="text-brand-600 dark:text-brand-400 hidden md:block"
        />{' '}
        {title}
      </h2>
      {children && (
        <div className="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
