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

import {Component, OnInit, OnDestroy} from '@angular/core';
import {interval, Subscription} from 'rxjs';

@Component({
  selector: 'app-dancing-monsters',
  templateUrl: './dancing-monsters.component.html'
})
export class DancingMonstersComponent implements OnInit, OnDestroy {
  danceSubscription?: Subscription;
  danceStep = 1;

  ngOnInit(): void {
    this.danceSubscription = interval(50).subscribe(count => this.danceStep = this.getDanceStep(count));
  }

  ngOnDestroy(): void {
    this.danceSubscription?.unsubscribe();
  }

  getDanceStep(count: number): number {
    const time = count % 15;
    if (time <= 4) {
      return 1;
    } else if (time === 5) {
      return 2;
    } else if (time === 6) {
      return 3;
    } else if (time <= 12) {
      return 4;
    } else if (time === 13) {
      return 3;
    } else {
      return 2;
    }
  }
}
