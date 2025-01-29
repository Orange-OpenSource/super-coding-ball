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
import {LocalStorageService} from '../../services/local-storage.service';
import {TranslatePipe} from '@ngx-translate/core';
import {DancingMonstersComponent} from '../dancing-monsters/dancing-monsters.component';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-offline-opponents',
  imports: [TranslatePipe, RouterLink, DancingMonstersComponent],
  templateUrl: './offline-opponents.component.html'
})
export class OfflineOpponentsComponent implements OnInit {
  strategies: { id: string, won: boolean }[] = [];

  constructor(
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
