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

import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {LocalStorageService} from '../../services/local-storage.service';

@Component({
  selector: 'app-offline-opponents',
  templateUrl: './offline-opponents.component.html',
  styleUrls: ['./offline-opponents.component.scss']
})
export class OfflineOpponentsComponent implements OnInit {
  strategies: { id: string, won: boolean }[] = [];

  constructor(
    private router: Router,
    private localStorageService: LocalStorageService
  ) {
  }

  ngOnInit(): void {
    this.strategies = this.localStorageService.getLocalStrategies();
  }

  getLetter(index: number): string {
    return String.fromCharCode(index + 65);
  }
}
