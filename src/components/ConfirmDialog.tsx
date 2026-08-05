import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Trash2, RefreshCw, HelpCircle } from 'lucide-react';

/* ── Types ── */
interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = (): ConfirmContextType => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
};

/* ── Provider ── */
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setDialog(options);
    });
  }, []);

  const handleClose = (result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <ConfirmDialog
          {...dialog}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
};

/* ── Dialog Component ── */
interface ConfirmDialogProps extends ConfirmOptions {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel,
}) => {
  const iconMap = {
    danger: <Trash2 size={22} />,
    warning: <RefreshCw size={22} />,
    info: <HelpCircle size={22} />,
  };

  const iconBgMap = {
    danger: 'rgba(255,59,48,0.12)',
    warning: 'rgba(255,149,0,0.12)',
    info: 'rgba(0,122,255,0.12)',
  };

  const iconColorMap = {
    danger: '#FF3B30',
    warning: '#FF9500',
    info: '#007AFF',
  };

  const confirmBtnClass = variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary';

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div
          className="confirm-icon"
          style={{ background: iconBgMap[variant], color: iconColorMap[variant] }}
        >
          {iconMap[variant]}
        </div>

        {/* Title & Message */}
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>

        {/* Actions */}
        <div className="confirm-actions">
          <button onClick={onCancel} className="btn btn-ghost confirm-btn">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`${confirmBtnClass} confirm-btn`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
