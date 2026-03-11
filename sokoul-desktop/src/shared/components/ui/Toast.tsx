// Toast.tsx — Lightweight toast notification component

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../stores/toastStore';
import type { Toast as ToastData } from '../../stores/toastStore';

const typeStyles: Record<ToastData['type'], string> = {
  success: 'bg-green-600/90',
  error:   'bg-red-600/90',
  warning: 'bg-amber-500/90',
  info:    'bg-blue-600/90',
};

function ToastItem({ toast }: { toast: ToastData }) {
  const removeToast = useToastStore((s) => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <motion.div
      layout
      role="alert"
      aria-live="polite"
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      className={`${typeStyles[toast.type]} px-4 py-3 rounded-lg text-white text-sm shadow-lg backdrop-blur-sm max-w-xs pointer-events-auto flex items-center gap-2`}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white/60 hover:text-white"
        aria-label="Dismiss"
      >
        ×
      </button>
    </motion.div>
  );
}

function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export { ToastContainer };
export type { ToastData };
