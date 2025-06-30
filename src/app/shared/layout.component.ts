import { Component, inject, signal, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  imports: [RouterModule, CommonModule],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {

  mobileMenuOpen = signal(false);
  userMenuOpen = signal(false);

  private _authState = inject(AuthService);
  private _router = inject(Router);

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

    // Si el click no es dentro del contenedor del menú de usuario, cerrar el menú
    if (this.userMenuOpen() && userMenuContainer && !userMenuContainer.contains(target)) {
      this.userMenuOpen.set(false);
    }
  }

  async logOut() {
    await this._authState.signOut();
    this._router.navigate(['/auth/sign-in']);
  }
}
