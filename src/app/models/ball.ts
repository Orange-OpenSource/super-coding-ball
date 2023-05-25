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

import {buildFrames, Dir, Sprite, SpriteAnim, SpriteCoord} from './sprite';
import {Player} from './player';

const rollingUpAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 1, 0, 10), speed: 1};
const rollingLeftAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 3, 0, 4), speed: 1};
const rollingDownAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 0, 0, 10), speed: 1};
const rollingRightAnim: SpriteAnim = {frames: buildFrames(Dir.Right, 2, 0, 4), speed: 1};

export class Ball extends Sprite {
  velocity = 0;
  owningTime = 0;
  private _owner: Player | null = null;
  private _formerOwner: Player | null = null;

  get owner(): Player | null {
    return this._owner;
  }

  set owner(value: Player | null) {
    this._formerOwner = this._owner;
    this._owner = value;
    this.owningTime = 0;
  }

  get formerOwner(): Player | null {
    return this._formerOwner;
  }

  private _callers: Array<Player> = []

  get caller(): Player | null {
    let ownerTeammatesCallers = this._callers.filter(caller => caller.ownTeam == this.owner?.ownTeam)
    this._callers = [];
    // If some ball owner teammates have called for the ball, get one randomly
    return ownerTeammatesCallers.length > 0 ? ownerTeammatesCallers[Math.floor(Math.random() * ownerTeammatesCallers.length)] : null;
  }

  set caller(player: Player | null) {
    if (player) {
      this._callers.push(player)
    }
  }

  constructor() {
    super(
      'ball',
      20,
      20,
      10,
      16,
      rollingUpAnim,
      rollingLeftAnim,
      rollingDownAnim,
      rollingRightAnim
    );
  }

  get offsetCoord(): SpriteCoord {
    if (this.owner === null) {
      return {x: this.coord.x, y: this.coord.y + this.height / 3};
    } else {
      switch (Sprite.getDirection(this.angle)) {
        case Dir.Up:
          return {x: this.coord.x + this.width / 3, y: this.coord.y - this.height / 8};
        case Dir.Down:
          return {x: this.coord.x - this.width / 3, y: this.coord.y + this.height / 8};
        case Dir.Left:
          return {x: this.coord.x - this.width / 3, y: this.coord.y + this.height / 8};
        case Dir.Right:
          return {x: this.coord.x + this.width / 3, y: this.coord.y + this.height / 8};
      }
    }
  }

  computeMovement(): void {
    this.still = this.velocity === 0;
    const xVel = this.velocity * Math.cos(this.angle);
    const yVel = this.velocity * Math.sin(this.angle);
    this.coord.x += xVel;
    this.coord.y += yVel;
    this.velocity = Math.max(0, this.velocity - 1);
  }
}
