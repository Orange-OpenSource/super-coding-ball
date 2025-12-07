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

/* ...license header... */
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LocalStorageService } from '../../services/local-storage.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import {
  SupportedLanguagesServices,
  supportedLangInfo,
} from '../../services/supported-languages-service';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslateModule, NgForOf],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnDestroy {
  @ViewChild('online_info') private onlineInfoModal: any;
  @ViewChild('offline_info') private offlineInfoModal: any;

  // Language selector data
  languages = supportedLangInfo;
  currentLang = this.languages[0].isoId;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private localStorageService: LocalStorageService,
    private supportedLanguages: SupportedLanguagesServices
  ) {
    this.currentLang = this.supportedLanguages.getCurrentLangInfo().isoId;
  }

  changeLanguage(langId: string): void {
    this.supportedLanguages.setLanguage(langId);
    this.currentLang = langId;
  }

  goOnline(): void {
    if (!navigator.onLine) {
      this.modalService.open(this.onlineInfoModal);
    } else if (!this.localStorageService.isStrongEnough()) {
      this.modalService.open(this.offlineInfoModal);
    } else {
      this.router.navigate(['/online-opponents']);
    }
  }

  ngOnDestroy(): void {
    this.modalService.dismissAll();
  }
}
