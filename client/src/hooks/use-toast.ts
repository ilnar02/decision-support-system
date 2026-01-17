import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastFunction {
  (props: Omit<Toast, 'id'>): void;
}

let toastCount = 0;
const toasts: Toast[] = [];
const listeners: Array<(toasts: Toast[]) => void> = [];

function addToast(toast: Omit<Toast, 'id'>) {
  const id = (++toastCount).toString();
  const newToast = { ...toast, id };
  toasts.push(newToast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    const index = toasts.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.splice(index, 1);
      listeners.forEach(listener => listener([...toasts]));
    }
  }, 5000);
  
  listeners.forEach(listener => listener([...toasts]));
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>([]);

  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const toast: ToastFunction = useCallback((props) => {
    addToast(props);
  }, []);

  return { toast, toasts: toastList };
}