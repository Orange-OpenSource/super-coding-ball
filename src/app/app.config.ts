import {ApplicationConfig, provideZoneChangeDetection, isDevMode} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideServiceWorker} from '@angular/service-worker';
import {provideTranslateService, TranslateLoader} from '@ngx-translate/core';
import {HttpClient, provideHttpClient} from '@angular/common/http';
import {CustomTranslateLoader} from "./services/custom-translate-loader";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}), provideRouter(routes), provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideHttpClient(),
    provideTranslateService({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useClass: CustomTranslateLoader,
        deps: [HttpClient]
      }
    })
  ]
};
