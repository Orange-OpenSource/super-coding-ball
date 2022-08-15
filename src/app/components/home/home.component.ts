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
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';
import {LocalStorageService} from '../../services/local-storage.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnDestroy {
  @ViewChild('online_info') private onlineInfoModal: any;
  @ViewChild('offline_info') private offlineInfoModal: any;
  public appName = environment.APP_NAME;

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
