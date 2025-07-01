import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../shared/services/loading.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-verification.component.html',
  styleUrl: './email-verification.component.css'
})
export class EmailVerificationComponent implements OnInit {

  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _loadingService = inject(LoadingService);
  private _toastService = inject(ToastService);

  isEmailVerified = this._authService.isEmailVerified;
  currentUserEmail = this._authService.currentUserEmail;
  isResending = false;

  async ngOnInit() {
    // Si no hay usuario logueado, redirigir al login
    if (!this.currentUserEmail()) {
      await this._loadingService.showFullScreenTransition('Redirigiendo al login...', 800);
      this._router.navigate(['/auth/sign-in']);
      this._loadingService.hidePageTransition();
      return;
    }

    // Si el email ya está verificado, mostrar mensaje y redirigir después de un momento
    if (this.isEmailVerified()) {
      this._toastService.success('Tu email ya está verificado', 'Serás redirigido a la lista de canarios.');
      setTimeout(async () => {
        await this._loadingService.showFullScreenTransition('Accediendo a tus canarios...', 1000);
        this._router.navigate(['/birds/birds-list']);
        this._loadingService.hidePageTransition();
      }, 2000);
    }
  }

  async resendVerificationEmail() {
    if (this.isResending) return;

    this.isResending = true;
    try {
      await this._authService.sendEmailVerification();
      // El toast de éxito ya se maneja en el AuthService
    } catch (error: any) {
      // El toast de error ya se maneja en el AuthService
      console.error('Error al enviar email de verificación:', error);
    } finally {
      this.isResending = false;
    }
  }

  async checkVerification() {
    try {
      const isVerified = await this._authService.checkEmailVerification();
      if (isVerified) {
        this._toastService.success('¡Email verificado exitosamente!');
        this._router.navigate(['/birds/birds-list']);
      } else {
        this._toastService.info('El email aún no ha sido verificado', 'Por favor, revisa tu correo y haz clic en el enlace de verificación.');
      }
    } catch (error) {
      this._toastService.error('Error al verificar el estado del email');
    }
  }

  logout() {
    this._authService.signOut();
    this._router.navigate(['/auth/sign-in']);
  }
}
