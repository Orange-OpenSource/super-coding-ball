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

export enum Direction {
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
  row: number;
  colStart: number;
  length: number;
  speed: number;
  restart: boolean;
}

export class Sprite {
  assetName;
  currentCol = 0;
  image;
  width;
  height;
  widthBaseOffset;
  heightBaseOffset;
  upAnim;
  downAnim;
  leftAnim;
  rightAnim;
  coord!: SpriteCoord;
  angle!: number;
  still!: boolean;

  constructor(
    assetName: string | null,
    width: number,
    height: number,
    widthBaseOffset: number,
    heightBaseOffset: number,
    upAnim: SpriteAnim,
    leftAnim: SpriteAnim,
    downAnim: SpriteAnim,
    rightAnim: SpriteAnim
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
    this.upAnim = upAnim;
    this.leftAnim = leftAnim;
    this.downAnim = downAnim;
    this.rightAnim = rightAnim;
  }

  get animData(): SpriteAnim {
    switch (Sprite.getDirection(this.angle)) {
      case Direction.Up:
        return this.upAnim;
      case Direction.Left:
        return this.leftAnim;
      case Direction.Down:
        return this.downAnim;
      case Direction.Right:
        return this.rightAnim;
    }
  }

  get offsetCoord(): SpriteCoord {
    return this.coord;
  }

  static getDirection(angle: number): Direction {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    if (sin <= -Math.sqrt(2) / 2) {
      return Direction.Up;
    } else if (sin >= Math.sqrt(2) / 2) {
      return Direction.Down;
    } else if (cos <= -Math.sqrt(2) / 2) {
      return Direction.Left;
    } else {
      return Direction.Right;
    }
  }

  get shouldAnimate(): boolean {
    return !this.still;
  }

  animate(): void {
    if (this.shouldAnimate) {
      this.currentCol = this.currentCol + this.animData.speed;
      // Keep two decimal digits to avoid js rounding errors
      this.currentCol = Math.round(this.currentCol * 100) / 100;
      if (this.animData.restart) {
        this.currentCol = this.animData.colStart + ((this.currentCol - this.animData.colStart) % this.animData.length);
      } else {
        this.currentCol = Math.min(this.currentCol, this.animData.colStart + this.animData.length);
      }
    }
  }
}
