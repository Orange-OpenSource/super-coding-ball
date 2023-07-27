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

import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  getTrackingDisabledStatus(): boolean {
    return localStorage.getItem('tracking-disabled') === 'true';
  }

  setTrackingDisabledStatus(disabled: boolean): void {
    localStorage.setItem('tracking-disabled', String(disabled));
  }

  getLocalStrategies(): {id: string, won: boolean}[] {
    return [
      'do-nothing',
      '1player-only',
      'all-defenders',
      'defenders-pass-to-attackers',
      'only-passes',
      '3attackers',
      'column',
      'sprinters'
    ].map(opponentId => ({
      id: opponentId,
      won: this.getOfflineWonStatus(opponentId)
    }));
  }

  isStrongEnough(): boolean {
    return this.getLocalStrategies().filter(it => it.won).length >= 3;
  }

  loadBlocks(): string {
    return localStorage.getItem('savedBlocks') || '{}';
  }

  saveBlocks(savedBlocks: string): void {
    if (!environment.production) {
      console.log(savedBlocks);
    }
    localStorage.setItem('savedBlocks', savedBlocks);
  }

  getOfflineWonStatus(opponentId: string): boolean {
    return !!localStorage.getItem(opponentId);
  }

  setOfflineWonStatus(opponentId: string): void {
    localStorage.setItem(opponentId, 'won');
  }

  clearLocalStorage(): void {
    localStorage.clear();
  }

  getAcceleratedGameStatus(): boolean {
    return localStorage.getItem('accelerated') === 'true';
  }

  setAcceleratedGameStatus(accelerated: boolean): void {
    localStorage.setItem('accelerated', String(accelerated));
  }
}
