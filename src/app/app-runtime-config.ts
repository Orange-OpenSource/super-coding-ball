/*
 * Software Name : SuperCodingBall
 * Version: 1.0.0
 * SPDX-FileCopyrightText: Copyright (c) 2026 Orange
 * SPDX-License-Identifier: BSD-3-Clause
 *
 * This software is distributed under the BSD 3-Clause "New" or "Revised" License,
 * the text of which is available at https://spdx.org/licenses/BSD-3-Clause.html
 * or see the "LICENSE.txt" file for more details.
 */

import {isDevMode} from '@angular/core';

export const appRuntimeConfig = {
  // Force developer mode even in production bundles.
  // Set to false to keep Angular's default dev/prod behavior.
  forceDeveloperMode: false,
  // Number of past days kept and counted in online ranking.
  rankingHistoryDays: 800
};

export function isDeveloperModeEnabled(): boolean {
  return appRuntimeConfig.forceDeveloperMode || isDevMode();
}
