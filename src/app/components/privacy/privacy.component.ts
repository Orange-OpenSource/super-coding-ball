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

import {Component} from '@angular/core';
import {LocalStorageService} from '../../services/local-storage.service';
import {Router, RouterLink} from '@angular/router';
import {OnlineService} from '../../services/online.service';
import {TranslatePipe} from '@ngx-translate/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-privacy',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './privacy.component.html'
})
export class PrivacyComponent {
  get trackingDisabled(): boolean {
    return this.localStorageService.getTrackingDisabledStatus();
  }

  set trackingDisabled(disabled: boolean) {
    this.localStorageService.setTrackingDisabledStatus(disabled);
  }

  constructor(
    private onlineService: OnlineService,
    private localStorageService: LocalStorageService,
    private router: Router
  ) {
  }

  removeDeviceData(): void {
    this.onlineService.disconnect();
    this.localStorageService.clearLocalStorage();
    this.router.navigate(['/']);
  }
}
