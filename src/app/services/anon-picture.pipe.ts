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

import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'anonPicturePipe'
})
export class AnonPicturePipe implements PipeTransform {

  transform(value?: string | null, ...args: unknown[]): string {
    return value ?? '../assets/icons/user-solid.png';
  }
}
