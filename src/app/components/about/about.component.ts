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
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {SupportedLanguagesServices} from '../../services/supported-languages-service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './about.component.html'
})
export class AboutComponent {
  constructor(supportedLanguagesServices: SupportedLanguagesServices, public translate: TranslateService) {
    if (supportedLanguagesServices.getCurrentLang().default) {
      this.contact = "Contact (or help with a new translation!):"
    } else {
      this.translate.get('ABOUT.CONTACT').subscribe(wording => this.contact = wording)
    }
  }
  contact = ""
}
