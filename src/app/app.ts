import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CustomSpinnerComponent } from './shared/components/custom-spinner/custom-spinner.component';
import { LoadingService } from './shared/services/loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CustomSpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'Mis Canarios';

  private loadingService = inject(LoadingService);

  // Exponer signals del servicio para el template
  isLoading = this.loadingService.isLoading;
  loadingMessage = this.loadingService.loadingMessage;
  isFullScreen = this.loadingService.isFullScreen;
}
