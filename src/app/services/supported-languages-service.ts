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

/* ...license header... */
import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';

import CustomEn from '../../assets/i18n/en.json';
import CustomFr from '../../assets/i18n/fr.json';
import CustomEs from '../../assets/i18n/es.json';
import CustomDe from '../../assets/i18n/de.json';
import CustomRu from '../../assets/i18n/ru.json';
import CustomHe from '../../assets/i18n/he.json';
import CustomAr from '../../assets/i18n/ar.json';
import CustomNl from '../../assets/i18n/nl.json';
import CustomJa from '../../assets/i18n/ja.json';
import CustomKo from '../../assets/i18n/ko.json';
import CustomZh from '../../assets/i18n/zh.json';

const defaultLangInfo = { isoId: 'en', rtl: false };
export const supportedLangInfo = Array.from([
  defaultLangInfo,
  { isoId: 'fr', rtl: false },
  { isoId: 'es', rtl: false },
  { isoId: 'de', rtl: false },
  { isoId: 'ru', rtl: false },
  { isoId: 'he', rtl: true },
  { isoId: 'ar', rtl: true },
  { isoId: 'nl', rtl: false },
  { isoId: 'ja', rtl: false },
  { isoId: 'ko', rtl: false },
  { isoId: 'zh', rtl: false },
]);

const LANG_STORAGE_KEY = 'scb-lang';

@Injectable({ providedIn: 'root' })
export class SupportedLanguagesServices {
  constructor(public translate: TranslateService) {
    // Declare supported languages to ngx-translate
    translate.addLangs(supportedLangInfo.map(lang => lang.isoId));

    // Default language for legal pages, etc.
    translate.setDefaultLang(defaultLangInfo.isoId);

    // Use stored / browser language at startup
    const current = this.getCurrentLangInfo();
    this.applyLanguage(current.isoId, current.rtl, false);
  }

  /** Get current language info, using localStorage first, then browser, otherwise default */
  public getCurrentLangInfo() {
    const storedLang = localStorage.getItem(LANG_STORAGE_KEY);
    const candidate = storedLang || this.translate.getBrowserLang();
    const supportedLang = supportedLangInfo.find(lang => lang.isoId === candidate);

    return supportedLang
      ? { ...supportedLang, default: !storedLang }
      : { ...defaultLangInfo, default: true };
  }

  /** Public API to change language from the UI */
  public setLanguage(langId: string): void {
    const langInfo =
      supportedLangInfo.find(lang => lang.isoId === langId) || defaultLangInfo;

    localStorage.setItem(LANG_STORAGE_KEY, langInfo.isoId);
    this.applyLanguage(langInfo.isoId, langInfo.rtl, true);
  }

  /** Internal helper: switch ngx-translate + document direction */
  private applyLanguage(langId: string, rtl: boolean, updateDir: boolean) {
    this.translate.use(langId);
    if (updateDir) {
      document.dir = rtl ? 'rtl' : 'ltr';
    }
  }

  /** Used by CodeService to get Blockly locales, based on current language */
  public async getCurrentLangFiles() {
    const currentLangInfo = this.getCurrentLangInfo();

    // webpack doesn't support import(`blockly/msg/${currentLangInfo.isoId}`)
    switch (currentLangInfo.isoId) {
      case 'fr': {
        const blocklyDefaultLocale = await import('blockly/msg/fr');
        return { blocklyDefaultLocale, blocklyCustomLocale: CustomFr.BLOCKS };
      }
      case 'es': {
        const blocklyDefaultLocale = await import('blockly/msg/es');
        return { blocklyDefaultLocale, blocklyCustomLocale: CustomEs.BLOCKS };
      }
      case 'de': {
        const blocklyDefaultLocale = await import('blockly/msg/de');
        return { blocklyDefaultLocale, blocklyCustomLocale: CustomDe.BLOCKS };
      }
      case 'ru': {
        const blocklyDefaultLocale = await import('blockly/msg/ru');
        return { blocklyDefaultLocale, blocklyCustomLocale: CustomRu.BLOCKS };
      }
      case 'he': {
        const blocklyDefaultLocale = await import('blockly/msg/he');
        return { blocklyDefaultLocale, blocklyCustomLocale: CustomHe.BLOCKS };
      }
      case 'ar': {
        const blocklyDefaultLocale = await import('blockly/msg/ar');
        return { blocklyDefaultLocale, blocklyCustomLocale: CustomAr.BLOCKS };
      }
      case 'nl': {
        const blocklyDefaultLocale = await import('blockly/msg/nl');
        return { blocklyDefaultLocale, blocklyCustomLocale: CustomNl.BLOCKS };
      }
      
    case 'ja': {
      const blocklyDefaultLocale = await import('blockly/msg/ja');
      return { blocklyDefaultLocale, blocklyCustomLocale: CustomJa.BLOCKS };
    }
    case 'ko': {
      const blocklyDefaultLocale = await import('blockly/msg/ko');
      return { blocklyDefaultLocale, blocklyCustomLocale: CustomKo.BLOCKS };
    }
    case 'zh': {
      // Most people want Simplified Chinese here – Blockly uses zh-hans
      const blocklyDefaultLocale = await import('blockly/msg/zh-hans');
      return { blocklyDefaultLocale, blocklyCustomLocale: CustomZh.BLOCKS };
    }

    default: {
      const blocklyDefaultLocale = await import('blockly/msg/en');
      return { blocklyDefaultLocale, blocklyCustomLocale: CustomEn.BLOCKS };
    }
  }
}
}

