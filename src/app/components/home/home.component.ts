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

import {Component, OnDestroy, ViewChild} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {LocalStorageService} from '../../services/local-storage.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslateModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnDestroy {
  @ViewChild('online_info') private onlineInfoModal: any;
  @ViewChild('offline_info') private offlineInfoModal: any;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private localStorageService: LocalStorageService) {
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
