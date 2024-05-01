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

import Fr from 'blockly/msg/fr';
import CustomFr from '../../assets/i18n/fr.json';
import Es from 'blockly/msg/es';
import CustomEs from '../../assets/i18n/es.json';
import Ru from 'blockly/msg/ru';
import CustomRu from '../../assets/i18n/ru.json';
import En from 'blockly/msg/en';
import CustomEn from '../../assets/i18n/en.json';
import He from 'blockly/msg/he';
import CustomHe from '../../assets/i18n/he.json';
import De from 'blockly/msg/de';
import CustomDe from '../../assets/i18n/de.json';

class SupportedLanguage {

  constructor(
    isoId: string,
    blocklyDefaultLocale: { [key: string]: string },
    blocklyCustomLocale: { [key: string]: string },
    rtl = false
  ) {
    this.isoId = isoId;
    this.blocklyDefaultLocale = blocklyDefaultLocale;
    this.blocklyCustomLocale = blocklyCustomLocale;
    this.rtl = rtl;
  }

  isoId: string
  blocklyDefaultLocale: { [key: string]: string }
  blocklyCustomLocale: { [key: string]: string }
  rtl: boolean
}

export const supportedLanguages = Array.from([
  new SupportedLanguage('en', En, CustomEn.BLOCKS),
  new SupportedLanguage('fr', Fr, CustomFr.BLOCKS),
  new SupportedLanguage('es', Es, CustomEs.BLOCKS),
  new SupportedLanguage('ru', Ru, CustomRu.BLOCKS),
  new SupportedLanguage('he', He, CustomHe.BLOCKS, true),
  new SupportedLanguage('de', De, CustomDe.BLOCKS),
])
// Default is English
const defaultLangId = 'en'
const defaultLang = supportedLanguages.find(lang => lang.isoId == defaultLangId)!

@Injectable({
  providedIn: 'root'
})

export class SupportedLanguagesServices {
  constructor(public translate: TranslateService) {
    let currentLang = this.getCurrentLang().lang
    translate.addLangs(supportedLanguages.map(lang => lang.isoId));
    // Default lang used for legal pages
    translate.setDefaultLang(defaultLangId)
    translate.use(currentLang.isoId);
  }

  public getCurrentLang(): { lang: SupportedLanguage, default: boolean } {
    let currentLang = supportedLanguages.find(lang => lang.isoId == this.translate.getBrowserLang())
    if (currentLang) {
      return {lang: currentLang, default: false}
    } else {
      return {lang: defaultLang, default: true}
    }
  }
}
