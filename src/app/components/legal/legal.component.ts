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

import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'app-licenses',
  templateUrl: './legal.component.html'
})
export class LegalComponent implements OnInit {
  thirdParty = '';

  constructor(private http: HttpClient) {
  }

  async ngOnInit(): Promise<void> {
    this.thirdParty = (await firstValueFrom(this.http.get('assets/THIRD-PARTY.txt', {responseType: "text"})))
      .replace(/\n\r\n/g, '<hr>')
      .replace(/\n/g, '<br>');
  }
}
