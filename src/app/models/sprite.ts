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
  next: Dir;
  rowBeg: number;
  colBeg: number;
  length: number;
  speed: number;
  loop: boolean;
}

export class Sprite {
  assetName;
  currentRow = 0;
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
  angle = 0;
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
      case Dir.Up:
        return this.upAnim;
      case Dir.Left:
        return this.leftAnim;
      case Dir.Down:
        return this.downAnim;
      case Dir.Right:
        return this.rightAnim;
    }
  }

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

  get shouldAnimate(): boolean {
    return !this.still;
  }

  animate(): void {
    if (this.shouldAnimate) {
      let horizontalMovement = 0;
      let verticalMovement = 0;
      switch (this.animData.next) {
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
      this.currentRow = this.currentRow + verticalMovement * this.animData.speed;
      this.currentCol = this.currentCol + horizontalMovement * this.animData.speed;

      // Keep two decimal digits to avoid js rounding errors
      this.currentRow = Math.round(this.currentRow * 100) / 100;
      this.currentCol = Math.round(this.currentCol * 100) / 100;
      if (this.animData.loop) {
        this.currentRow = this.animData.rowBeg +
          verticalMovement * (Math.abs(this.currentRow - this.animData.rowBeg) % this.animData.length);
        this.currentCol = this.animData.colBeg +
          horizontalMovement * (Math.abs(this.currentCol - this.animData.colBeg) % this.animData.length);
      } else {
        this.currentRow = this.animData.rowBeg +
          verticalMovement * Math.min(Math.abs(this.currentRow - this.animData.rowBeg), (this.animData.length - 1));
        this.currentCol = this.animData.colBeg +
          horizontalMovement * Math.min(Math.abs(this.currentCol - this.animData.colBeg), (this.animData.length - 1));
      }
    }
  }
}
