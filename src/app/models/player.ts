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
  Shooting,
  PassingToCaller,
  Calling,
  Pushed,
  Falling,
  Celebrating,
  CoCelebrating,
  Crying,
  Waiting
}

const runningUpAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 8, 1, 8), speed: 1};
const runningLeftAnim: SpriteAnim = {frames: [{row: 9, col: 8}].concat(buildFrames(Dir.Right, 9, 1, 7)), speed: 1};
const runningDownAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 10, 1, 8), speed: 1};
const runningRightAnim: SpriteAnim = {frames: [{row: 11, col: 8}].concat(buildFrames(Dir.Right, 11, 1, 7)), speed: 1};
const sprintingUpAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 34, 0, 8), speed: 1};
const sprintingLeftAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 35, 0, 8), speed: 1};
const sprintingDownAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 36, 0, 8), speed: 1};
const sprintingRightAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 37, 0, 8), speed: 1};
// tslint:disable-next-line:max-line-length
const greetingAnim: SpriteAnim = {frames: [{row: 2, col: 0}, {row: 2, col: 3}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 3, col: 5}, {row: 0, col: 5}, {row: 1, col: 5}, {row: 2, col: 5}, {row: 2, col: 4}, {row: 2, col: 3}], speed: 0.2};
const shootingUpAnim: SpriteAnim = {frames: [{row: 34, col: 3}, {row: 34, col: 5}, {row: 34, col: 7}, {row: 34, col: 7}], speed: 0.5};
const shootingLeftAnim: SpriteAnim = {frames: [{row: 35, col: 5}, {row: 35, col: 6}, {row: 35, col: 7}, {row: 35, col: 7}], speed: 0.5};
const shootingDownAnim: SpriteAnim = {frames: [{row: 36, col: 4}, {row: 36, col: 2}, {row: 36, col: 0}, {row: 36, col: 0}], speed: 0.5};
const shootingRightAnim: SpriteAnim = {frames: [{row: 37, col: 1}, {row: 37, col: 2}, {row: 37, col: 3}, {row: 37, col: 3}], speed: 0.5};
const callingUpAnim: SpriteAnim = {frames: [{row: 12, col: 4}, {row: 12, col: 5}, {row: 12, col: 4}, {row: 12, col: 5}, {row: 12, col: 4}], speed: 0.2};
const callingLeftAnim: SpriteAnim = {frames: [{row: 13, col: 4}, {row: 13, col: 5}, {row: 13, col: 4}, {row: 13, col: 5}, {row: 13, col: 4}], speed: 0.2};
const callingDownAnim: SpriteAnim = {frames: [{row: 14, col: 4}, {row: 14, col: 5}, {row: 14, col: 4}, {row: 14, col: 5}, {row: 14, col: 4}], speed: 0.2};
const callingRightAnim: SpriteAnim = {frames: [{row: 15, col: 4}, {row: 15, col: 5}, {row: 15, col: 4}, {row: 15, col: 5}, {row: 15, col: 4}], speed: 0.2};
const pushedUpAnim: SpriteAnim = {frames: [{row: 0, col: 5}, {row: 0, col: 4}, {row: 0, col: 6}, {row: 0, col: 4}], speed: 0.2};
const pushedLeftAnim: SpriteAnim = {frames: [{row: 1, col: 5}, {row: 1, col: 4}, {row: 1, col: 6}, {row: 1, col: 4}], speed: 0.2};
const pushedDownAnim: SpriteAnim = {frames: [{row: 2, col: 5}, {row: 2, col: 4}, {row: 2, col: 6}, {row: 2, col: 4}], speed: 0.2};
const pushedRightAnim: SpriteAnim = {frames: [{row: 3, col: 5}, {row: 3, col: 4}, {row: 3, col: 6}, {row: 3, col: 4}], speed: 0.2};
const fallingAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 20, 0, 6), speed: 0.05};
const celebratingAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 18, 2, 9)
    .concat(buildFrames(Dir.Right, 19, 2, 9))
    .concat(buildFrames(Dir.Right, 16, 2, 9))
    .concat(buildFrames(Dir.Right, 17, 2, 9)),
  speed: 0.4};
const coCelebratingAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 14, 0, 6), speed: 0.4};
// tslint:disable-next-line:max-line-length
const cryingAnim: SpriteAnim = {frames: [{row: 20, col: 3}, {row: 20, col: 4}], speed: 0.05};
// tslint:disable-next-line:max-line-length
const waitingAnim: SpriteAnim = {frames: [{row: 2, col: 0}, {row: 2, col: 1}, {row: 2, col: 3}, {row: 2, col: 2}, {row: 2, col: 2}, {row: 2, col: 3}, {row: 2, col: 1}], speed: 0.1};

export class Player extends Sprite {
  ownTeam: boolean;
  isAtkRole: boolean;
  isRightSide: boolean;
  isSprinting: boolean;
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

  get canExecuteCode(): boolean {
    return this.state === PlayerState.Entering
    || this.state === PlayerState.Playing
    || this.state === PlayerState.Pushed;
  }

  get canHaveCollisions(): boolean {
    return this.state === PlayerState.Playing
    || this.state === PlayerState.Shooting
    || this.state === PlayerState.PassingToCaller
    || this.state === PlayerState.Calling
    || this.state === PlayerState.Pushed
  }

  get canBePushed(): boolean {
    return this.state !== PlayerState.Pushed
    && this.state !== PlayerState.Shooting
    && this.state !== PlayerState.PassingToCaller
    && this.state !== PlayerState.Calling
  }

  get willPlayWhenActionFinished(): boolean {
    return this.state === PlayerState.Pushed
    || this.state === PlayerState.Falling 
    || this.state === PlayerState.Shooting 
    || this.state === PlayerState.PassingToCaller 
    || this.state === PlayerState.Calling;
  }

  lastBlockId = '';

  constructor(
    assetName: string | null,
    ownTeam: boolean,
    isAtkRole: boolean,
    isRightSide: boolean
  ) {
    super(
      'new-anims',
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
    this.isSprinting = false;
  }

  override get animData(): SpriteAnim {
    switch (this.state) {
      case PlayerState.Greeting:
        return greetingAnim;
      case PlayerState.Shooting:
      case PlayerState.PassingToCaller:
            switch (Sprite.getDirection(this.angle)) {
          case Dir.Up:
            return shootingUpAnim;
          case Dir.Left:
            return shootingLeftAnim;
          case Dir.Down:
            return shootingDownAnim;
          case Dir.Right:
            return shootingRightAnim;
        }
      case PlayerState.Calling:
        switch (Sprite.getDirection(this.angle)) {
          case Dir.Up:
            return callingUpAnim;
          case Dir.Left:
            return callingLeftAnim;
          case Dir.Down:
            return callingDownAnim;
          case Dir.Right:
            return callingRightAnim;
        }
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
        switch (Sprite.getDirection(this.angle)) {
          case Dir.Up:
            return this.isSprinting ? sprintingUpAnim : runningUpAnim;
          case Dir.Left:
            return this.isSprinting ? sprintingLeftAnim : runningLeftAnim;
          case Dir.Down:
            return this.isSprinting ? sprintingDownAnim : runningDownAnim;
          case Dir.Right:
            return this.isSprinting ? sprintingRightAnim : runningRightAnim;
        }
    }
  }

  override get shouldAnimate(): boolean {
    switch (this.state) {
      case PlayerState.Playing:
        return !this.still;
      default:
        return true;
    }
  }

  override animate(): void {
    super.animate();
    // When greeting is done, go to waiting
    if (this.state === PlayerState.Greeting && this.currentFrame === 0) {
      this.state = PlayerState.Waiting;
    }
    if (this.willPlayWhenActionFinished && this.currentFrame === 0) {
      // When falling is done, recover full energy
      if (this.state === PlayerState.Falling) {
        this.energy = 100;
      }
      this.state = PlayerState.Playing;
    }
    // If playing and still, reset frame so that the player looks still
    if (this.state === PlayerState.Playing && this.still) {
      this.currentFrame = 0;
    }
  }
}
