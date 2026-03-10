import { ArrowLeft, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useMediaQuery } from '../../hooks/useMediaQuery';

interface ResponsiveDialogProps {
  title: string;
  onClose: () => void;
  /** Called when the desktop backdrop is clicked; defaults to onClose. */
  onBackdropClick?: () => void;
  children: React.ReactNode;
}

const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
  title,
  onClose,
  onBackdropClick,
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      (onBackdropClick ?? onClose)();
    }
  };

  if (!mounted) return null;

  const content = isMobile ? (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-slate-900 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h3 className="font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h3>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
  ) : (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default ResponsiveDialog;
