import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'mis-canarios-579c4',
        appId: '1:926970099974:web:3200f39f7b932b40074687',
        storageBucket: 'mis-canarios-579c4.firebasestorage.app',
        apiKey: 'AIzaSyC89Pkzj6J9-_Obn6c7uXQeFo43gPP0uVo',
        authDomain: 'mis-canarios-579c4.firebaseapp.com',
        messagingSenderId: '926970099974',
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};
