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

const defaultLangInfo = {isoId:'en', rtl: false};
export const supportedLangInfo = Array.from([
  defaultLangInfo,
  {isoId:'fr', rtl: false},
  {isoId:'es', rtl: false},
  {isoId:'de', rtl: false},
  {isoId:'ru', rtl: false},
  {isoId:'he', rtl: true},
  {isoId:'ar', rtl: true},
  {isoId:'nl', rtl: false},
  {isoId: 'ja', rtl: false},
  {isoId: 'ko', rtl: false},
  {isoId: 'zh', rtl: false},
])

@Injectable({
  providedIn: 'root'
})

export class SupportedLanguagesServices {
  constructor(public translate: TranslateService) {
    translate.addLangs(supportedLangInfo.map(lang => lang.isoId));
    // Default lang used for legal pages
    translate.setFallbackLang(defaultLangInfo.isoId);
    translate.use(this.getCurrentLangInfo().isoId);
  }

  public getCurrentLangInfo() {
    const supportedLang = supportedLangInfo.find(lang => lang.isoId === this.translate.getBrowserLang());
    return supportedLang ? {...supportedLang, default: false} : {...defaultLangInfo, default: true};
  }

  public getCurrentLangTranslations() {
    return SupportedLanguagesServices.getLangTranslations(this.getCurrentLangInfo().isoId);
  }

  static async getLangTranslations(lang: string): Promise<{blocklyDefaultLocale: {}, blocklyCustomLocale: {}, uxLocale: {}}> {
    // webpack doesn't support import(`blockly/msg/${lang}`); so the switch is necessary
    switch (lang) {
      case 'fr': {
        const blocklyDefaultLocale = await import('blockly/msg/fr');
        const CustomFr = await import ('../../assets/i18n/fr.json');
        const LegalFr = await import('../../assets/legal-i18n/fr.json');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomFr.BLOCKS, uxLocale: {...CustomFr, ...LegalFr}};
      }
      case 'es': {
        const blocklyDefaultLocale = await import('blockly/msg/es');
        const CustomEs = await import ('../../assets/i18n/es.json');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomEs.BLOCKS, uxLocale: CustomEs};
      }
      case 'de': {
        const blocklyDefaultLocale = await import('blockly/msg/de');
        const CustomDe = await import ('../../assets/i18n/de.json');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomDe.BLOCKS, uxLocale: CustomDe};
      }
      case 'ru': {
        const blocklyDefaultLocale = await import('blockly/msg/ru');
        const CustomRu = await import ('../../assets/i18n/ru.json');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomRu.BLOCKS, uxLocale: CustomRu};
      }
      case 'he': {
        const blocklyDefaultLocale = await import('blockly/msg/he');
        const CustomHe = await import ('../../assets/i18n/he.json');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomHe.BLOCKS, uxLocale: CustomHe};
      }
      case 'ar': {
        const blocklyDefaultLocale = await import('blockly/msg/ar');
        const CustomAr = await import ('../../assets/i18n/ar.json');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomAr.BLOCKS, uxLocale: CustomAr};
      }
      case 'nl': {
        const blocklyDefaultLocale = await import('blockly/msg/nl');
        const CustomNl = await import ('../../assets/i18n/nl.json');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomNl.BLOCKS, uxLocale: CustomNl};
      }
      case 'ja': {
        const blocklyDefaultLocale = await import('blockly/msg/ja');
        const CustomJa = await import ('../../assets/i18n/ja.json');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomJa.BLOCKS, uxLocale: CustomJa};
      }
      case 'ko': {
        const blocklyDefaultLocale = await import('blockly/msg/ko');
        const CustomKo = await import ('../../assets/i18n/ko.json');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomKo.BLOCKS, uxLocale: CustomKo};
      }
      case 'zh': {
        // Most people want Simplified Chinese here – Blockly uses zh-hans
        const blocklyDefaultLocale = await import('blockly/msg/zh-hans');
        const CustomZh = await import ('../../assets/i18n/zh.json');
        return {blocklyDefaultLocale, blocklyCustomLocale: CustomZh.BLOCKS, uxLocale: CustomZh};
      }
      default: {
        const blocklyDefaultLocale = await import('blockly/msg/en');
        const CustomEn = await import ('../../assets/i18n/en.json');
        const LegalEn  = await import('../../assets/legal-i18n/en.json');
        return {blocklyDefaultLocale, blocklyCustomLocale:  CustomEn.BLOCKS, uxLocale: {...CustomEn, ...LegalEn}};
      }
    }
  }
}
