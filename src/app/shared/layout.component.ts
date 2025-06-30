import { Component, inject, signal, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { LoadingService } from './services/loading.service';
import { UserLimitsIndicatorComponent } from './components/user-limits-indicator/user-limits-indicator.component';
import { LimitsAlertComponent } from './components/limits-alert/limits-alert.component';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-layout',
  imports: [RouterModule, CommonModule, UserLimitsIndicatorComponent, LimitsAlertComponent],
  templateUrl: './layout.component.html',
  styles: [`
    /* Efectos de brillo para los menús */
    .menu-container-glow {
      transition: all 0.3s ease;
    }

    .menu-container-glow:hover {
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
    }

    .user-menu-glow:hover {
      box-shadow: 0 0 25px rgba(34, 197, 94, 0.4), 0 0 50px rgba(16, 185, 129, 0.2);
    }

    /* Animaciones mejoradas */
    button {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    button:active {
      transform: scale(0.98);
    }

    /* Efectos para tooltips */
    .group:hover .group-hover\\:opacity-100 {
      animation: tooltipFadeIn 0.2s ease-out;
    }

    @keyframes tooltipFadeIn {
      from {
        opacity: 0;
        transform: translateY(5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Mejorar contraste en texto */
    .drop-shadow-sm {
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {

  mobileMenuOpen = signal(false);
  userMenuOpen = signal(false);
  private destroy$ = new Subject<void>();

  // Componentes requeridos para evitar warning de compilación
  LimitsAlertComponent = LimitsAlertComponent;

  private _authState = inject(AuthService);
  public _router = inject(Router);
  private _loadingService = inject(LoadingService);

  // Acceso al usuario actual
  currentUser = this._authState.currentUser;
  currentUserEmail = this._authState.currentUserEmail;
  isEmailVerified = this._authState.isEmailVerified;

  // Configuración de navegación con rutas e iconos
  navigationLinks = [
    {
      label: 'Canarios',
      route: '/birds/birds-list',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      exact: false
    },
    {
      label: 'Parejas',
      route: '/couples/couples-list',
      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
      exact: true
    },
    {
      label: 'Nomencladores',
      route: '/nomenclator/nomenclator-list',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      exact: false
    },
    {
      label: 'Contáctanos',
      route: '/contact',
      icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      exact: true
    }
  ];

  ngOnInit() {
    // Escuchar eventos de navegación para ocultar loading automáticamente
    this._router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Ocultar loading después de cada navegación completada
        // Usar un timeout más corto para mejorar la responsividad
        setTimeout(() => {
          this._loadingService.hidePageTransition();
        }, 50);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(open => !open);
    if (this.mobileMenuOpen()) {
      this.userMenuOpen.set(false);
    }
  }

  toggleUserMenu() {
    this.userMenuOpen.update(open => !open);
    if (this.userMenuOpen()) {
      this.mobileMenuOpen.set(false);
    }
  }

  closeMenus() {
    this.mobileMenuOpen.set(false);
    this.userMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const userMenuContainer = document.getElementById('user-menu-container');
    const userMenuMobileContainer = document.getElementById('user-menu-mobile-container');

    // Si el click no es dentro de ningún contenedor del menú de usuario, cerrar el menú
    if (this.userMenuOpen() &&
      userMenuContainer && !userMenuContainer.contains(target) &&
      userMenuMobileContainer && !userMenuMobileContainer.contains(target)) {
      this.userMenuOpen.set(false);
    }
  }

  async logOut() {
    await this._loadingService.showFullScreenTransition('Cerrando sesión...', 800);
    await this._authState.signOut();
    this._router.navigate(['/auth/sign-in']);
    this._loadingService.hidePageTransition();
  }

  async navigateWithLoading(route: string, message?: string) {
    this.closeMenus();
    await this._loadingService.showContentTransition(message, 800);
    this._router.navigate([route]);
    this._loadingService.hidePageTransition();
  }

  async navigateToSection(route: string, label: string) {
    this.closeMenus();

    // Solo aplicar spinner para cambios de sección principales
    const currentSection = this._router.url.split('/')[1];
    const targetSection = route.split('/')[1];

    // Si es el mismo módulo, navegación rápida sin spinner
    if (currentSection === targetSection) {
      this._router.navigate([route]);
      return;
    }

    // Solo para cambios de sección principales
    const message = `Cargando ${label.toLowerCase()}...`;
    await this._loadingService.showContentTransition(message, 600);
    this._router.navigate([route]);
    this._loadingService.hidePageTransition();
  }

  async navigateToEmailVerification() {
    this.closeMenus();
    await this._loadingService.showContentTransition('Cargando verificación de email...', 600);
    this._router.navigate(['/auth/email-verification']);
    this._loadingService.hidePageTransition();
  }
}
