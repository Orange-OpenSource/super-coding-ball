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

import {Direction, Sprite, SpriteCoord} from './sprite';
import {Player} from './player';

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

  constructor() {
    super(
      'ball',
      20,
      20,
      10,
      16,
      {row: 1, colStart: 0, length: 10, speed: 1, restart: true},
      {row: 3, colStart: 0, length: 4, speed: 1, restart: true},
      {row: 0, colStart: 0, length: 10, speed: 1, restart: true},
      {row: 2, colStart: 0, length: 4, speed: 1, restart: true}
    );
  }

  get offsetCoord(): SpriteCoord {
    if (this.owner === null) {
      return this.coord;
    } else {
      switch (Sprite.getDirection(this.angle)) {
        case Direction.Up:
          return {x: this.coord.x + this.width / 3, y: this.coord.y - this.height / 8};
          break;
        case Direction.Down:
          return {x: this.coord.x - this.width / 3, y: this.coord.y + this.height / 8};
          break;
        case Direction.Left:
          return {x: this.coord.x - this.width / 3, y: this.coord.y + this.height / 8};
          break;
        case Direction.Right:
          return {x: this.coord.x + this.width / 3, y: this.coord.y + this.height / 8};
          break;
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
