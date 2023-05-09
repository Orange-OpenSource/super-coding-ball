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

import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {LocalStorageService} from './local-storage.service';

export const isStrongGuard = () => {
  const router = inject(Router);
  const localStorageService = inject(LocalStorageService);

  if (!localStorageService.isStrongEnough()) {
    return router.parseUrl('/home');
  } else {
    return true;
  }
}
