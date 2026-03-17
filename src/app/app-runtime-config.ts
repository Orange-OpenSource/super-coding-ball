/*
 * Software Name : SuperCodingBall
 * Version: 1.0.0
 * SPDX-FileCopyrightText: Copyright (c) 2025 Orange
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * This software is distributed under the BSD 3-Clause "New" or "Revised" License,
 * the text of which is available at https://spdx.org/licenses/BSD-3-Clause.html
 * or see the "LICENSE.txt" file for more details.
 */

import {isDevMode as angularIsDevMode} from '@angular/core';

export const appRuntimeConfig = {
  devModeEnabled: angularIsDevMode(),
  leaderboard: {
    topCountedWins: 5,
    highestScoringRank: 50,
    maxPointsPerWin: 50
  }
};

export function isRuntimeDevMode(): boolean {
  return appRuntimeConfig.devModeEnabled;
}
