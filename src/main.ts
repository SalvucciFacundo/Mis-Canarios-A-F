import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideHttpClient } from '@angular/common/http';
import { initializeApp } from 'firebase/app';
import { environment } from './environments/environment';

// Inicializar Firebase antes de bootstrapApplication
initializeApp(environment.firebase);

// bootstrapApplication(App, appConfig)
//   .catch((err) => console.error(err));
bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideHttpClient(),
  ],
});
