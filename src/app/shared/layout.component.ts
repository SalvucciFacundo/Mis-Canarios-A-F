import { Component, inject, signal } from '@angular/core';
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

  toggleMobileMenu() {
    this.mobileMenuOpen.update(open => !open);
  }

  toggleUserMenu() {
    this.userMenuOpen.update(open => !open);
  }

  closeMenus() {
    this.mobileMenuOpen.set(false);
    this.userMenuOpen.set(false);
  }
  links = ['Canarios', 'Prejas', 'Estadisticas', 'Nomencladores', 'Contactanos'];


  private _authState = inject(AuthService);
  private _router = inject(Router);

  async logOut() {
    await this._authState.signOut();
    this._router.navigate(['/auth/sign-in']);
  }
}
