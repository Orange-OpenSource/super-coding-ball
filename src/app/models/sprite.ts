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

export enum Dir {
  Up = 1,
  Left,
  Down,
  Right,
}

export interface SpriteCoord {
  x: number;
  y: number;
}

export interface SpriteAnim {
  frames: { row: number, col: number }[];
  speed: number;
  syncOnClock?: boolean;
}

export function buildFrames(next: Dir, rowBeg: number, colBeg: number, length: number): { row: number, col: number }[] {
  const frames: { row: number, col: number }[] = [];
  let horizontalMovement = 0;
  let verticalMovement = 0;
  switch (next) {
    case Dir.Right:
      horizontalMovement = 1;
      break;
    case Dir.Left:
      horizontalMovement = -1;
      break;
    case Dir.Up:
      verticalMovement = -1;
      break;
    case Dir.Down:
      verticalMovement = 1;
      break;
  }
  for (let i = 0; i < length; i++) {
    frames.push({row: rowBeg + verticalMovement * i, col: colBeg + horizontalMovement * i});
  }
  return frames;
}

export abstract class Sprite {
  assetName;
  currentFrame = 0;
  image;
  width;
  height;
  widthBaseOffset;
  heightBaseOffset;
  private _coord!: SpriteCoord;
  public get coord(): SpriteCoord {
    return this._coord;
  }

  public set coord(value: SpriteCoord) {
    this._coord = value;
  }

  private _angle = 0;
  public get angle() {
    return this._angle;
  }

  public set angle(value) {
    this._angle = value;
  }

  private _still!: boolean;
  public get still(): boolean {
    return this._still;
  }

  public set still(value: boolean) {
    this._still = value;
  }

  protected constructor(
    assetName: string | null,
    width: number,
    height: number,
    widthBaseOffset: number,
    heightBaseOffset: number
  ) {
    this.assetName = assetName;
    this.image = new Image();
    if (assetName) {
      this.image.src = 'assets/sprites/' + assetName + '.png';
    }
    this.width = width;
    this.height = height;
    this.widthBaseOffset = widthBaseOffset;
    this.heightBaseOffset = heightBaseOffset;
  }

  abstract get animData(): SpriteAnim;

  get offsetCoord(): SpriteCoord {
    return this.coord;
  }

  static getDirection(angle: number): Dir {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    if (sin <= -Math.sqrt(2) / 2) {
      return Dir.Up;
    } else if (sin >= Math.sqrt(2) / 2) {
      return Dir.Down;
    } else if (cos <= -Math.sqrt(2) / 2) {
      return Dir.Left;
    } else {
      return Dir.Right;
    }
  }

  abstract get shouldAnimate(): boolean;

  animate(clock: number): void {
    if (this.shouldAnimate) {
      this.currentFrame = this.animData.syncOnClock ? (clock * this.animData.speed) : (this.currentFrame + this.animData.speed);
    }

    // Keep two decimal digits to avoid js rounding errors
    this.currentFrame = Math.round(this.currentFrame * 100) / 100;
    this.currentFrame = this.currentFrame % this.animData.frames.length;
  }
}
