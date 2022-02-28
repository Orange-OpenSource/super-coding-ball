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

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/analytics';
import {environment} from '../environments/environment';
import {SwUpdate} from '@angular/service-worker';
import {TranslateService} from '@ngx-translate/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LocalStorageService} from './services/local-storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('content') private content: any;

  constructor(
    private swUpdate: SwUpdate,
    public translate: TranslateService,
    private modalService: NgbModal,
    localStorageService: LocalStorageService
  ) {

    this.translate.addLangs(['fr', 'en']);
    if (this.translate.getBrowserLang()) {
      this.translate.use(this.translate.getBrowserLang() ?? 'en');
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
    firebase.initializeApp(firebaseConfig);
    if (environment.production && !localStorageService.getTrackingDisabledStatus()) {
      firebase.analytics();
    }
  }

  ngOnInit(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.available.subscribe((event) => {
        console.log('current version is', event.current);
        console.log('available version is', event.available);
        this.modalService.open(this.content, {size: 'sm'})
          .result.then((updateValidated: boolean) => {
          if (updateValidated) {
            window.location.reload();
          }
        });
      });
    }
  }

  ngOnDestroy(): void {
    this.modalService.dismissAll();
  }
}
