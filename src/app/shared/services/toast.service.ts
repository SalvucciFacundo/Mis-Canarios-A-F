import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<Toast[]>([]);

  readonly toastList = this.toasts.asReadonly();

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Muestra un toast de éxito
   */
  success(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'success',
      message,
      title,
      duration: duration || 6000 // Aumentado de 4000 a 6000ms
    });
  }

  /**
   * Muestra un toast de error
   */
  error(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'error',
      message,
      title,
      duration: duration || 8000 // Aumentado de 6000 a 8000ms
    });
  }

  /**
   * Muestra un toast de advertencia
   */
  warning(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'warning',
      message,
      title,
      duration: duration || 7000 // Aumentado de 5000 a 7000ms
    });
  }

  /**
   * Muestra un toast informativo
   */
  info(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'info',
      message,
      title,
      duration: duration || 6000 // Aumentado de 4000 a 6000ms
    });
  }

  /**
   * Muestra un toast con acción personalizada
   */
  showWithAction(
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    actionLabel: string,
    actionHandler: () => void,
    title?: string,
    duration?: number
  ): void {
    this.show({
      type,
      message,
      title,
      duration: duration || 0, // No auto-dismiss si tiene acción
      action: {
        label: actionLabel,
        handler: actionHandler
      }
    });
  }

  /**
   * Muestra un toast genérico
   */
  private show(toast: Omit<Toast, 'id'>): void {
    const newToast: Toast = {
      ...toast,
      id: this.generateId()
    };

    // Agregar el toast a la lista
    this.toasts.update(current => [...current, newToast]);

    // Auto-dismiss si tiene duración
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.dismiss(newToast.id);
      }, newToast.duration);
    }
  }

  /**
   * Cierra un toast específico
   */
  dismiss(id: string): void {
    this.toasts.update(current => current.filter(toast => toast.id !== id));
  }

  /**
   * Cierra todos los toasts
   */
  dismissAll(): void {
    this.toasts.set([]);
  }

  /**
   * Muestra un toast de confirmación (con botones Sí/No)
   */
  confirm(
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title?: string
  ): void {
    this.show({
      type: 'warning',
      message,
      title: title || 'Confirmación',
      duration: 0, // No auto-dismiss
      action: {
        label: 'Confirmar',
        handler: () => {
          onConfirm();
          // El toast se cerrará automáticamente al hacer click en la acción
        }
      }
    });
  }
}
