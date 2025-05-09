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

import {TranslateService} from '@ngx-translate/core';
import {Injectable} from '@angular/core';

import CustomEn from '../../assets/i18n/en.json';
import CustomFr from '../../assets/i18n/fr.json';
import CustomEs from '../../assets/i18n/es.json';
import CustomDe from '../../assets/i18n/de.json';
import CustomRu from '../../assets/i18n/ru.json';
import CustomHe from '../../assets/i18n/he.json';
import CustomAr from '../../assets/i18n/ar.json';

const defaultLangInfo = {isoId:'en', rtl: false};
export const supportedLangInfo = Array.from([
  defaultLangInfo,
  {isoId:'fr', rtl: false},
  {isoId:'es', rtl: false},
  {isoId:'de', rtl: false},
  {isoId:'ru', rtl: false},
  {isoId:'he', rtl: true},
  {isoId:'ar', rtl: true},
])

@Injectable({
  providedIn: 'root'
})

export class SupportedLanguagesServices {
  constructor(public translate: TranslateService) {
    translate.addLangs(supportedLangInfo.map(lang => lang.isoId));
    // Default lang used for legal pages
    translate.setDefaultLang(defaultLangInfo.isoId);
    translate.use(this.getCurrentLangInfo().isoId);
  }

  public getCurrentLangInfo() {
    const supportedLang = supportedLangInfo.find(lang => lang.isoId === this.translate.getBrowserLang());
    return supportedLang ? {...supportedLang, default: false} : {...defaultLangInfo, default: true};
  }

  public async getCurrentLangFiles() {
    const currentLangInfo = this.getCurrentLangInfo();
    // webpack doesn't support import(`blockly/msg/${currentLangInfo.isoId}`); so the switch is necessary
    switch (currentLangInfo.isoId) {
      case 'fr': {
        const blocklyDefaultLocale = await import('blockly/msg/fr');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomFr.BLOCKS};
      }
      case 'es': {
        const blocklyDefaultLocale = await import('blockly/msg/es');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomEs.BLOCKS};
      }
      case 'de': {
        const blocklyDefaultLocale = await import('blockly/msg/de');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomDe.BLOCKS};
      }
      case 'ru': {
        const blocklyDefaultLocale = await import('blockly/msg/ru');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomRu.BLOCKS};
      }
      case 'he': {
        const blocklyDefaultLocale = await import('blockly/msg/he');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomHe.BLOCKS};
      }
      case 'ar': {
        const blocklyDefaultLocale = await import('blockly/msg/ar');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomAr.BLOCKS};
      }
      default: {
        const blocklyDefaultLocale = await import('blockly/msg/en');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomEn.BLOCKS};
      }
    }
  }
}
