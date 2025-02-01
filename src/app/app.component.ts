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

import {Component, isDevMode, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {initializeApp} from 'firebase/app';
import {getAnalytics} from 'firebase/analytics';
import {SwUpdate, VersionReadyEvent} from '@angular/service-worker';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LocalStorageService} from './services/local-storage.service';
import {filter} from 'rxjs/operators';
import {SupportedLanguagesServices} from './services/supported-languages-service';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslatePipe],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('content') private content: any;

  constructor(
    private swUpdate: SwUpdate,
    public translate: TranslateService,
    supportedLanguagesServices: SupportedLanguagesServices,
    private modalService: NgbModal,
    localStorageService: LocalStorageService
  ) {

    let currentLang = supportedLanguagesServices.getCurrentLang().lang
    if (currentLang.rtl) {
      document.dir = 'rtl';
    }

    const firebaseConfig = {
      apiKey: 'AIzaSyBJYl1nuRbzgwjewoCaqYPc_5Sr17ussoc',
      authDomain: 'supercodingball.firebaseapp.com',
      projectId: 'supercodingball',
      storageBucket: 'supercodingball.appspot.com',
      messagingSenderId: '488172291868',
      appId: '1:488172291868:web:48fcb92d01c23ef3695cd9',
      measurementId: 'G-N0RFS9M9XJ'
    };
    const app = initializeApp(firebaseConfig);
    if (!isDevMode() && !localStorageService.getTrackingDisabledStatus()) {
      getAnalytics(app);
    }
  }

  ngOnInit(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
        .subscribe((event) => {
          console.log('current version is', event.currentVersion);
          console.log('available version is', event.latestVersion);
          this.modalService.open(this.content, {size: 'sm'})
            .result.then((updateValidated: boolean) => {
              if (updateValidated) {
                window.location.reload();
              }
            }, () => { });
        });
    }
  }

  ngOnDestroy(): void {
    this.modalService.dismissAll();
  }
}
