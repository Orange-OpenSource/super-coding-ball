// src/app/services/language.service.ts
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'scb_lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private current = 'en';

  constructor(private translate: TranslateService) {
    // Read saved language if any, otherwise use current/fallback
    const saved = localStorage.getItem(STORAGE_KEY);
    this.current = saved || this.translate.currentLang || 'en';

    this.translate.use(this.current);
  }

  getCurrentLang(): string {
    return this.current;
  }

  setLang(code: string): void {
    this.current = code;
    this.translate.use(code);
    localStorage.setItem(STORAGE_KEY, code);
  }
}

