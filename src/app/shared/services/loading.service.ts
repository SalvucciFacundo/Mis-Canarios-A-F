import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  // Signals para controlar el estado del spinner
  isLoading = signal(false);
  loadingMessage = signal<string>('');
  isFullScreen = signal(false);

  /**
   * Muestra el spinner para transiciones de página completa (auth)
   * @param message Mensaje personalizado (opcional)
   * @param minDuration Duración mínima en ms (default: 1200ms)
   */
  async showFullScreenTransition(message?: string, minDuration: number = 1200): Promise<void> {
    this.isFullScreen.set(true);
    this.loadingMessage.set(message || 'Cargando...');
    this.isLoading.set(true);

    // Duración mínima para dar tiempo al cache/datos
    await new Promise(resolve => setTimeout(resolve, minDuration));
  }

  /**
   * Muestra el spinner solo en el área de contenido (manteniendo navbar)
   * @param message Mensaje personalizado (opcional) 
   * @param minDuration Duración mínima en ms (default: 1200ms)
   */
  async showContentTransition(message?: string, minDuration: number = 1000): Promise<void> {
    this.isFullScreen.set(false);
    this.loadingMessage.set(message || 'Cargando...');
    this.isLoading.set(true);

    // Duración mínima para dar tiempo al cache/datos
    await new Promise(resolve => setTimeout(resolve, minDuration));
  }

  /**
   * Método para compatibilidad con código existente
   * @param message Mensaje personalizado (opcional)
   * @param minDuration Duración mínima en ms (default: 1200ms)
   */
  async showPageTransition(message?: string, minDuration: number = 1200): Promise<void> {
    // Por defecto usa content transition (para navegación interna)
    await this.showContentTransition(message, minDuration);
  }

  /**
   * Oculta el spinner
   */
  hidePageTransition(): void {
    this.isLoading.set(false);
    this.loadingMessage.set('');
  }

  /**
   * Muestra spinner durante una operación async
   * @param operation Función async a ejecutar
   * @param message Mensaje personalizado
   * @param minDuration Duración mínima en ms
   * @param fullScreen Si debe ocupar toda la pantalla
   */
  async withLoading<T>(
    operation: () => Promise<T>,
    message?: string,
    minDuration: number = 1200,
    fullScreen = false
  ): Promise<T> {
    if (fullScreen) {
      await this.showFullScreenTransition(message, minDuration);
    } else {
      await this.showContentTransition(message, minDuration);
    }

    try {
      const result = await operation();
      return result;
    } finally {
      this.hidePageTransition();
    }
  }
}
