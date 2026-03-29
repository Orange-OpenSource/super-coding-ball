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

import {TranslateLoader} from '@ngx-translate/core';
import {from, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {SupportedLanguagesServices} from "./supported-languages-service";

export class CustomTranslateLoader implements TranslateLoader {
  public getTranslation(lang: string): Observable<any> {
    return from(SupportedLanguagesServices.getLangTranslations(lang)).pipe(map(langTranslations => langTranslations.uxLocale));
  }
}
