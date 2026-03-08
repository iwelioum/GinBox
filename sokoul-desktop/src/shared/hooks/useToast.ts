// useToast.ts — Hook for dispatching toast notifications

import { useCallback } from 'react';
import { useToastStore } from '../stores/toastStore';
import type { ToastType } from '../stores/toastStore';
import { ToastContainer } from '../components/ui/Toast';

let counter = 0;

function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  const removeToast = useToastStore((s) => s.removeToast);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `toast-${++counter}-${Date.now()}`;
      addToast({ id, type, message, duration });
      return id;
    },
    [addToast],
  );

  const dismiss = useCallback(
    (id: string) => removeToast(id),
    [removeToast],
  );

  return { toast, dismiss, ToastContainer };
}

export { useToast, ToastContainer };
