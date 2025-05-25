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

const restingUpAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 22, 0, 2), speed: .2, syncOnClock: true};
const restingLeftAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 23, 0, 2), speed: .2, syncOnClock: true};
const restingDownAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 24, 0, 2), speed: .2, syncOnClock: true};
const restingRightAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 25, 0, 2), speed: .2, syncOnClock: true};
const runningUpAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 8, 1, 8), speed: 1};
const runningLeftAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 9, 1, 8), speed: 1};
const runningDownAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 10, 1, 8), speed: 1};
const runningRightAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 11, 1, 8), speed: 1};
const sprintingUpAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 38, 0, 8), speed: 1};
const sprintingLeftAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 39, 0, 8), speed: 1};
const sprintingDownAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 40, 0, 8), speed: 1};
const sprintingRightAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 41, 0, 8), speed: 1};
// tslint:disable-next-line:max-line-length
const greetingAnim: SpriteAnim = {frames: [{row: 2, col: 6}, {row: 2, col: 4}, {row: 2, col: 5}, {row: 3, col: 5}, {row: 0, col: 5}, {row: 1, col: 5}, {row: 2, col: 5}, {row: 2, col: 4}, {row: 2, col: 6}], speed: 0.2};
const shootingUpAnim: SpriteAnim = {frames: [{row: 38, col: 3}, {row: 38, col: 5}, {row: 38, col: 7}, {row: 38, col: 7}], speed: 0.5};
const shootingLeftAnim: SpriteAnim = {frames: [{row: 39, col: 5}, {row: 39, col: 6}, {row: 39, col: 7}, {row: 39, col: 7}], speed: 0.5};
const shootingDownAnim: SpriteAnim = {frames: [{row: 40, col: 4}, {row: 40, col: 2}, {row: 40, col: 0}, {row: 40, col: 0}], speed: 0.5};
const shootingRightAnim: SpriteAnim = {frames: [{row: 41, col: 1}, {row: 41, col: 2}, {row: 41, col: 3}, {row: 41, col: 3}], speed: 0.5};
const callingUpAnim: SpriteAnim = {frames: [{row: 12, col: 4}, {row: 12, col: 5}, {row: 12, col: 4}, {row: 12, col: 5}, {row: 12, col: 4}], speed: 0.2};
const callingLeftAnim: SpriteAnim = {frames: [{row: 13, col: 4}, {row: 13, col: 5}, {row: 13, col: 4}, {row: 13, col: 5}, {row: 13, col: 4}], speed: 0.2};
const callingDownAnim: SpriteAnim = {frames: [{row: 14, col: 4}, {row: 14, col: 5}, {row: 14, col: 4}, {row: 14, col: 5}, {row: 14, col: 4}], speed: 0.2};
const callingRightAnim: SpriteAnim = {frames: [{row: 15, col: 4}, {row: 15, col: 5}, {row: 15, col: 4}, {row: 15, col: 5}, {row: 15, col: 4}], speed: 0.2};
const pushedUpAnim: SpriteAnim = {frames: [{row: 0, col: 5}, {row: 0, col: 4}, {row: 0, col: 6}, {row: 0, col: 4}], speed: 0.2};
const pushedLeftAnim: SpriteAnim = {frames: [{row: 1, col: 5}, {row: 1, col: 4}, {row: 1, col: 6}, {row: 1, col: 4}], speed: 0.2};
const pushedDownAnim: SpriteAnim = {frames: [{row: 2, col: 5}, {row: 2, col: 4}, {row: 2, col: 6}, {row: 2, col: 4}], speed: 0.2};
const pushedRightAnim: SpriteAnim = {frames: [{row: 3, col: 5}, {row: 3, col: 4}, {row: 3, col: 6}, {row: 3, col: 4}], speed: 0.2};
const fallingAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 20, 1, 5), speed: 0.05};
const celebratingAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 41, 2, 4).concat(buildFrames(Dir.Right, 29, 1, 4)).concat({row: 37, col: 2}).concat(Array(100).fill({row: 33, col: 1})), speed: 0.5};
const coCelebratingAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 14, 2, 4).concat(buildFrames(Dir.Left, 14, 5, 4)), speed: 1};
const cryingAnim: SpriteAnim = {frames: [{row: 20, col: 2}, {row: 20, col: 3}, {row: 20, col: 4}, {row: 20, col: 3}], speed: 0.4};

export class Player extends Sprite {
  ownTeam: boolean;
  isAtkRole: boolean;
  isRightSide: boolean;
  isSprinting: boolean;
  private _pushedTimer = 0;
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
    // When a player is pushed, a 20 cycles timer is set to determine the animation length
    if (value === PlayerState.Pushed) {
      this._pushedTimer = 20;
      // If the player is pushed again, the timer is reset, but not the currentFrame (animation goes on)
      if (this._state === PlayerState.Pushed) {
        return
      }
    }
    this._state = value;
    this.currentFrame = 0;
  }

  get canExecuteCode(): boolean {
    return this.state === PlayerState.Entering
    || this.state === PlayerState.Playing
    || this.state === PlayerState.Pushed
    || this.state === PlayerState.Celebrating;
  }

  get canHaveCollisions(): boolean {
    return this.state === PlayerState.Playing
    || this.state === PlayerState.Shooting
    || this.state === PlayerState.PassingToCaller
    || this.state === PlayerState.Calling
    || this.state === PlayerState.Pushed
  }

  get canBePushed(): boolean {
    return this.state !== PlayerState.Shooting
    && this.state !== PlayerState.PassingToCaller
    && this.state !== PlayerState.Calling
  }

  get willPlayWhenActionFinished(): boolean {
    return this.state === PlayerState.Falling
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
      58
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
      case PlayerState.Celebrating:
        return celebratingAnim;
      case PlayerState.CoCelebrating:
        return coCelebratingAnim;
      case PlayerState.Crying:
        return cryingAnim;
      case PlayerState.Waiting:
        return restingDownAnim;
      default:
        switch (Sprite.getDirection(this.angle)) {
          case Dir.Up:
            return this.still ? restingUpAnim : (this.isSprinting ? sprintingUpAnim : runningUpAnim);
          case Dir.Left:
            return this.still ? restingLeftAnim : (this.isSprinting ? sprintingLeftAnim : runningLeftAnim);
          case Dir.Down:
            return this.still ? restingDownAnim : (this.isSprinting ? sprintingDownAnim : runningDownAnim);
          case Dir.Right:
            return this.still ? restingRightAnim : (this.isSprinting ? sprintingRightAnim : runningRightAnim);
        }
    }
  }

  override get shouldAnimate(): boolean {
    return true;
  }

  override animate(clock: number): void {
    super.animate(clock);
    // When greeting is done, go to waiting
    if (this.state === PlayerState.Greeting && this.currentFrame === 0) {
      this.state = PlayerState.Waiting;
    }

    // When pushed timer is over, player plays again
    if (this.state === PlayerState.Pushed) {
      this._pushedTimer--;
      if (this._pushedTimer === 0) {
        this.state = PlayerState.Playing;
      }
    }

    if (this.willPlayWhenActionFinished && this.currentFrame === 0) {
      // When falling is done, recover full energy
      if (this.state === PlayerState.Falling) {
        this.energy = 100;
      }
      this.state = PlayerState.Playing;
    }
  }
}
