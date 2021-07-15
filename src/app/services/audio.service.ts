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

import {Injectable} from '@angular/core';

export const enum SoundEnum {
  WhistleStart = 1,
  WhistleEnd,
  Goal,
  YouWin,
  YouLoose
}


@Injectable({
  providedIn: 'root'
})
export class AudioService {

  private audio: HTMLAudioElement;

  constructor() {
    this.audio = new Audio();
    this.audio.muted = false;
  }

  public playSound(mySound: SoundEnum): void {
    switch (mySound) {
      case SoundEnum.WhistleStart:
        return this.setAudio('./assets/sounds/whistle_start.wav');
      case SoundEnum.WhistleEnd:
        return this.setAudio('./assets/sounds/whistle_end.wav');
    }
  }

  private setAudio(src: string): void {
    this.audio.src = src;
    this.audio.play();
  }

  public setMuted(muted: boolean): void {
    this.audio.muted = muted;
  }

  public audioIsMuted(): boolean {
    return this.audio.muted;
  }
}
