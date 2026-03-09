import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { Notification, NotificationType } from '../types';

interface ToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} className="text-emerald-500" />;
      case 'error':
        return <AlertCircle size={18} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-500" />;
      default:
        return <Info size={18} className="text-blue-500" />;
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 max-w-sm p-4 rounded-lg shadow-lg border animate-in slide-in-from-bottom-2 fade-in duration-300 ${getStyles(notification.type)}`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{notification.message}</p>
        {notification.details && (
          <p className="text-xs mt-1 opacity-80 break-all">
            {notification.details}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="opacity-50 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
