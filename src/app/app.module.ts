/*
 * Software Name : SuperCodingBall
 * Version: 1.0.0
 * SPDX-FileCopyrightText: Copyright (c) 2021 Orange
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * This software is distributed under the BSD 3-Clause "New" or "Revised" License,
 * the text of which is available at https://spdx.org/licenses/BSD-3-Clause.html
 * or see the "LICENSE.txt" file for more details.
 */

import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HomeComponent} from './components/home/home.component';
import {HowtoComponent} from './components/howto/howto.component';
import {HowtoDemoComponent} from './components/howto-demo/howto-demo.component';
import {AboutComponent} from './components/about/about.component';
import {PrivacyComponent} from './components/privacy/privacy.component';
import {TermsComponent} from './components/terms/terms.component';
import {LegalComponent} from './components/legal/legal.component';
import {OfflineOpponentsComponent} from './components/offline-opponents/offline-opponents.component';
import {OnlineOpponentsComponent} from './components/online-opponents/online-opponents.component';
import {BlocklyComponent} from './components/blockly/blockly.component';
import {GameComponent} from './components/game/game.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';

import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {ServiceWorkerModule} from '@angular/service-worker';
import {environment} from '../environments/environment';
import {AnonPicturePipe} from './services/anon-picture.pipe';
import {CustomTranslateLoader} from './services/custom-translate-loader';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HowtoComponent,
    HowtoDemoComponent,
    AboutComponent,
    PrivacyComponent,
    TermsComponent,
    LegalComponent,
    OfflineOpponentsComponent,
    OnlineOpponentsComponent,
    BlocklyComponent,
    GameComponent,
    AnonPicturePipe,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useClass: CustomTranslateLoader,
        deps: [HttpClient]
      },
      defaultLanguage: 'en'
    }),
    AppRoutingModule,
    NgbModule,
    FormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerImmediately'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
