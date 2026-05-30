import { create } from 'zustand';

export type ToastVariant = 'error' | 'warning' | 'success' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastInput {
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  show: (input: ToastInput) => void;
  dismiss: (id: string) => void;
}

// Ventana de dedup: si llega el mismo mensaje dentro de este lapso se ignora,
// para que varias requests que fallan a la vez (p.ej. dos 401 simultáneos)
// no apilen toasts repetidos.
const DEDUP_MS = 2_500;
const lastShownAt = new Map<string, number>();

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: ({ message, variant = 'error', duration = 3_500 }) => {
    const now = Date.now();
    const previous = lastShownAt.get(message);
    if (previous && now - previous < DEDUP_MS) return;
    lastShownAt.set(message, now);

    const id = `${now}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant, duration }] }));
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Helper para disparar toasts desde fuera de React (interceptores, servicios). */
export const showToast = (input: ToastInput) => useToastStore.getState().show(input);
