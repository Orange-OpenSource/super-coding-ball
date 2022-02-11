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

import {buildFrames, Dir, Sprite, SpriteAnim} from './sprite';

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

const runningUpAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 8, 1, 8), speed: 1, loop: true};
const runningLeftAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 9, 0, 9), speed: 1, loop: true};
const runningDownAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 10, 1, 8), speed: 1, loop: true};
const runningRightAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 11, 0, 9), speed: 1, loop: true};
const greetingAnim: SpriteAnim = {frames: buildFrames(Dir.Down, 0, 5, 4), speed: 0.1, loop: true};
const pushedUpAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 0, 4, 2), speed: 0.1, loop: true};
const pushedLeftAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 1, 4, 2), speed: 0.1, loop: true};
const pushedDownAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 2, 4, 2), speed: 0.1, loop: true};
const pushedRightAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 3, 4, 2), speed: 0.1, loop: true};
const fallingAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 20, 0, 6), speed: 0.05, loop: true};
const celebratingAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 18, 2, 9), speed: 0.4, loop: true};
const coCelebratingAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 14, 0, 6), speed: 0.4, loop: true};
const cryingAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 20, 0, 6), speed: 0.1, loop: false};
const waitingAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 2, 0, 2), speed: 0.1, loop: true};

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

  private _state: PlayerState = PlayerState.Waiting;
  get state(): PlayerState {
    return this._state;
  }

  set state(value: PlayerState) {
    this._state = value;
    this.currentFrame = 0;
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
      runningUpAnim,
      runningLeftAnim,
      runningDownAnim,
      runningRightAnim
    );
    this.ownTeam = ownTeam;
    this.isAtkRole = isAtkRole;
    this.isRightSide = isRightSide;
  }

  get animData(): SpriteAnim {
    switch (this.state) {
      case PlayerState.Greeting:
        return greetingAnim;
      case PlayerState.Falling:
        return fallingAnim;
      case PlayerState.Pushed:
        switch (Sprite.getDirection(this.angle)) {
          case Dir.Up:
            return pushedUpAnim;
          case Dir.Left:
            return pushedLeftAnim;
          case Dir.Down:
            return pushedDownAnim;
          case Dir.Right:
            return pushedRightAnim;
        }
        break;
      case PlayerState.Celebrating:
        return celebratingAnim;
      case PlayerState.CoCelebrating:
        return coCelebratingAnim;
      case PlayerState.Crying:
        return cryingAnim;
      case PlayerState.Waiting:
        return waitingAnim;
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
    if (this.state === PlayerState.Greeting && this.currentFrame === 0) {
      this.state = PlayerState.Waiting;
    }
    // When pushed is done, go back to playing
    if (this.state === PlayerState.Pushed && this.currentFrame === 0) {
      this.state = PlayerState.Playing;
    }
    // When falling is done, go back to playing and recover full energy
    if (this.state === PlayerState.Falling && this.currentFrame === 0
    ) {
      this.state = PlayerState.Playing;
      this.energy = 100;
    }
  }
}
