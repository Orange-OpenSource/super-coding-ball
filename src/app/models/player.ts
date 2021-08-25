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

import {Dir, Sprite, SpriteAnim} from './sprite';

export enum PlayerState {
  Entering,
  Greeting,
  Playing,
  Pushed,
  Falling,
  Celebrating,
  CoCelebrating,
  Crying,
  Waiting
}

export class Player extends Sprite {
  ownTeam: boolean;
  isAtkRole: boolean;
  isRightSide: boolean;
  private _energy = 100;
  get energy(): number {
    return this._energy;
  }

  set energy(value: number) {
    this._energy = Math.min(100, Math.max(0, value));
  }

  private _greetingAnim: SpriteAnim = {next: Dir.Down, rowBeg: 0, colBeg: 5, length: 4, speed: 0.1, loop: true};
  private _pushedUpAnim: SpriteAnim = {next: Dir.Right, rowBeg: 0, colBeg: 4, length: 2, speed: 0.1, loop: true};
  private _pushedLeftAnim: SpriteAnim = {next: Dir.Right, rowBeg: 1, colBeg: 4, length: 2, speed: 0.1, loop: true};
  private _pushedDownAnim: SpriteAnim = {next: Dir.Right, rowBeg: 2, colBeg: 4, length: 2, speed: 0.1, loop: true};
  private _pushedRightAnim: SpriteAnim = {next: Dir.Right, rowBeg: 3, colBeg: 4, length: 2, speed: 0.1, loop: true};
  private _fallingAnim: SpriteAnim = {next: Dir.Right, rowBeg: 20, colBeg: 0, length: 6, speed: 0.05, loop: true};
  private _celebratingAnim: SpriteAnim = {next: Dir.Right, rowBeg: 18, colBeg: 2, length: 9, speed: 0.4, loop: true};
  private _coCelebratingAnim: SpriteAnim = {next: Dir.Right, rowBeg: 14, colBeg: 0, length: 6, speed: 0.4, loop: true};
  private _cryingAnim: SpriteAnim = {next: Dir.Right, rowBeg: 20, colBeg: 0, length: 6, speed: 0.1, loop: false};
  private _waitingAnim: SpriteAnim = {next: Dir.Right, rowBeg: 2, colBeg: 0, length: 2, speed: 0.1, loop: true};
  private _state: PlayerState = PlayerState.Waiting;
  get state(): PlayerState {
    return this._state;
  }

  set state(value: PlayerState) {
    this._state = value;
    this.currentRow = this.animData.rowBeg;
    this.currentCol = this.animData.colBeg;
  }

  constructor(
    assetName: string | null,
    ownTeam: boolean,
    isAtkRole: boolean,
    isRightSide: boolean
  ) {
    super(
      assetName,
      64,
      64,
      32,
      58,
      {next: Dir.Right, rowBeg: 8, colBeg: 1, length: 8, speed: 1, loop: true},
      {next: Dir.Right, rowBeg: 9, colBeg: 0, length: 9, speed: 1, loop: true},
      {next: Dir.Right, rowBeg: 10, colBeg: 1, length: 8, speed: 1, loop: true},
      {next: Dir.Right, rowBeg: 11, colBeg: 0, length: 9, speed: 1, loop: true}
    );
    this.ownTeam = ownTeam;
    this.isAtkRole = isAtkRole;
    this.isRightSide = isRightSide;
  }

  get animData(): SpriteAnim {
    switch (this.state) {
      case PlayerState.Greeting:
        return this._greetingAnim;
      case PlayerState.Falling:
        return this._fallingAnim;
      case PlayerState.Pushed:
        switch (Sprite.getDirection(this.angle)) {
          case Dir.Up:
            return this._pushedUpAnim;
          case Dir.Left:
            return this._pushedLeftAnim;
          case Dir.Down:
            return this._pushedDownAnim;
          case Dir.Right:
            return this._pushedRightAnim;
        }
        break;
      case PlayerState.Celebrating:
        return this._celebratingAnim;
      case PlayerState.CoCelebrating:
        return this._coCelebratingAnim;
      case PlayerState.Crying:
        return this._cryingAnim;
      case PlayerState.Waiting:
        return this._waitingAnim;
      default:
        return super.animData;
    }
  }

  get shouldAnimate(): boolean {
    switch (this.state) {
      case PlayerState.Playing:
        return !this.still;
      default:
        return true;
    }
  }

  animate(): void {
    super.animate();
    // When greeting is done, go back to waiting
    if (this.state === PlayerState.Greeting
      && this.currentRow === this.animData.rowBeg
      && this.currentCol === this.animData.colBeg
    ) {
      this.state = PlayerState.Waiting;
    }
    // When pushed is done, go back to playing
    if (this.state === PlayerState.Pushed
      && this.currentRow === this.animData.rowBeg
      && this.currentCol === this.animData.colBeg
    ) {
      this.state = PlayerState.Playing;
    }
    // When falling is done, go back to playing and recover full energy
    if (this.state === PlayerState.Falling
      && this.currentRow === this.animData.rowBeg
      && this.currentCol === this.animData.colBeg
    ) {
      this.state = PlayerState.Playing;
      this.energy = 100;
    }
  }
}
