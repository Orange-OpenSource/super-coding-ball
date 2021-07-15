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

import {Direction, Sprite, SpriteAnim} from './sprite';

export enum PlayerState {
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
  #energy = 100;
  get energy(): number {
    return this.#energy;
  }

  set energy(value: number) {
    this.#energy = Math.min(100, Math.max(0, value));
  }

  #pushedUpAnim: SpriteAnim = {row: 0, colStart: 4, length: 1, speed: 0.1, restart: true};
  #pushedLeftAnim: SpriteAnim = {row: 1, colStart: 4, length: 1, speed: 0.1, restart: true};
  #pushedDownAnim: SpriteAnim = {row: 2, colStart: 4, length: 1, speed: 0.1, restart: true};
  #pushedRightAnim: SpriteAnim = {row: 3, colStart: 4, length: 1, speed: 0.1, restart: true};
  #fallingAnim: SpriteAnim = {row: 20, colStart: 0, length: 5, speed: 0.05, restart: true};
  #celebratingAnim: SpriteAnim = {row: 18, colStart: 2, length: 8, speed: 0.4, restart: true};
  #coCelebratingAnim: SpriteAnim = {row: 14, colStart: 0, length: 5, speed: 0.4, restart: true};
  #cryingAnim: SpriteAnim = {row: 20, colStart: 0, length: 5, speed: 0.1, restart: false};
  #waitingAnim: SpriteAnim = {row: 2, colStart: 0, length: 3, speed: 0.1, restart: true};
  #state: PlayerState = PlayerState.Waiting;
  get state(): PlayerState {
    return this.#state;
  }

  set state(value: PlayerState) {
    this.#state = value;
    this.currentCol = this.animData.colStart;
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
      {row: 8, colStart: 1, length: 8, speed: 1, restart: true},
      {row: 9, colStart: 0, length: 9, speed: 1, restart: true},
      {row: 10, colStart: 1, length: 8, speed: 1, restart: true},
      {row: 11, colStart: 0, length: 9, speed: 1, restart: true}
    );
    this.ownTeam = ownTeam;
    this.isAtkRole = isAtkRole;
    this.isRightSide = isRightSide;
  }

  get animData(): SpriteAnim {
    switch (this.state) {
      case PlayerState.Falling:
        return this.#fallingAnim;
      case PlayerState.Pushed:
        switch (Sprite.getDirection(this.angle)) {
          case Direction.Up:
            return this.#pushedUpAnim;
          case Direction.Left:
            return this.#pushedLeftAnim;
          case Direction.Down:
            return this.#pushedDownAnim;
          case Direction.Right:
            return this.#pushedRightAnim;
        }
        break;
      case PlayerState.Celebrating:
        return this.#celebratingAnim;
      case PlayerState.CoCelebrating:
        return this.#coCelebratingAnim;
      case PlayerState.Crying:
        return this.#cryingAnim;
      case PlayerState.Waiting:
        return this.#waitingAnim;
      default:
        return super.animData;
    }
  }

  get shouldAnimate(): boolean {
    switch (this.state) {
      case PlayerState.Playing:
        return !this.still;
      case PlayerState.Pushed:
      case PlayerState.Falling:
      case PlayerState.Celebrating:
      case PlayerState.CoCelebrating:
      case PlayerState.Crying:
      case PlayerState.Waiting:
        return true;
    }
  }

  animate(): void {
    super.animate();
    // When pushed is done, go back to playing
    if (this.state === PlayerState.Pushed && this.currentCol === this.animData.colStart) {
      this.state = PlayerState.Playing;
    }
    // When falling is done, go back to playing and recover full energy
    if (this.state === PlayerState.Falling && this.currentCol === this.animData.colStart) {
      this.state = PlayerState.Playing;
      this.energy = 100;
    }
  }
}
