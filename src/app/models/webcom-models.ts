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

export class Opponent {
  webcomId: string;
  userDisplay: UserDisplay | null;
  points: number;
  ranking: number;
  lastSeen: number;
  lastResult?: number;

  constructor(webcomId: string, userDisplay: UserDisplay | null, points: number, ranking: number, lastSeen: number) {
    this.webcomId = webcomId;
    this.userDisplay = userDisplay;
    this.points = points;
    this.ranking = ranking;
    this.lastSeen = lastSeen;
    this.lastResult = undefined;
  }
}

export interface User {
  displayName: string;
  blocks: string;
}

export class UserDisplay {
  displayName: string;
  pictureUrl: string | null;

  set fullDisplayName(fullDisplayName: string) {
    this.displayName = fullDisplayName.substring(0, 20);
  }

  constructor() {
    this.displayName = '';
    this.pictureUrl = null;
  }
}

export type AllGames = { [dayTimestamp: string]: DailyGames };
export type DayAndGames = { dayTimestamp: string, games: DailyGames };

export type DailyGames = { [userId: string]: UserDailyRecap };

export interface UserDailyRecap {
  userDisplay: UserDisplay;
  dailyGames: { [opponentId: string]: number; };
}

export enum ConnectionStatus {
  Unknown,
  Disconnected,
  Connected
}
