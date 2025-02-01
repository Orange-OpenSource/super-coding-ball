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

import {Component} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-terms',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './terms.component.html'
})
export class TermsComponent {
}
