import {HttpClient} from '@angular/common/http';
import {TranslateLoader} from '@ngx-translate/core';
import {Observable, of, zip} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

const prefix = '/assets/i18n/';
const legalPrefix = '/assets/legal-i18n/';
const suffix = '.json';

export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {
  }

  public getTranslation(lang: string): Observable<any> {
    return zip(this.http.get(`${prefix}${lang}${suffix}`),
      this.http.get(`${legalPrefix}${lang}${suffix}`).pipe(catchError(() => of({}))))
      .pipe(map(result => ({...result[0], ...result[1]})));
  }
}
