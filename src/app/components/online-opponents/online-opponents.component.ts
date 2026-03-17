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

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AllGames, ConnectionStatus, Opponent} from '../../models/webcom-models';
import {OnlineService} from '../../services/online.service';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {CodeService} from '../../services/code.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Router, RouterLink} from '@angular/router';
import {LocalStorageService} from '../../services/local-storage.service';
import {DancingMonstersComponent} from '../dancing-monsters/dancing-monsters.component';
import {AnonPicturePipe} from '../../services/anon-picture.pipe';
import {FormsModule} from '@angular/forms';
import {appRuntimeConfig} from '../../app-runtime-config';

export enum GamePoint {
  LOST = 0,
  DRAW,
  WON
}

type MatchupStats = {wins: number; total: number};
type AggregatedPlayerStats = {
  userDisplay: Opponent['userDisplay'];
  userDisplayTimestamp: number;
  lastSeen: number;
  activeMatchups: Map<string, MatchupStats>;
  points: number;
};

@Component({
  selector: 'app-online-opponents',
  imports: [FormsModule, RouterLink, TranslatePipe, DancingMonstersComponent, AnonPicturePipe],
  templateUrl: './online-opponents.component.html',
  styleUrl: './online-opponents.component.scss'
})

export class OnlineOpponentsComponent implements OnInit, OnDestroy {
  @ViewChild('replayGameContent') private replayGameContent: any;
  @ViewChild('deleteAccountContent') private deleteAccountContent: any;
  GamePoint = GamePoint;
  public ConnectionStatus = ConnectionStatus;
  private connectionStatusSubscription?: Subscription;
  private refreshIntervalId?: ReturnType<typeof setInterval>;
  opponents: Opponent[] = [];
  teamOpponents: Opponent[] = [];
  lastResult?: number;
  filteredOpponents: Opponent[] = [];
  personalRanking = 0;
  loading = false;
  modalParams = {
    won: '<img src="assets/icons/trophy-solid-warning.png" class="icon24"/>',
    draw: '<img src="assets/icons/trophy-solid-secondary.png" class="icon24"/>',
    lost: '<img src="assets/icons/trophy-solid-danger.png" class="icon24"/>',
  };

  private _searchTerm = '';

  get searchTerm(): string {
    return this._searchTerm;
  }

  set searchTerm(term: string) {
    this._searchTerm = term;
    this.filteredOpponents = this.opponents.filter(opp => !term ||
      this.normalized(opp.userDisplay?.displayName ?? '').includes(this.normalized(term)));
  }

  get vipTeamPoints(): number {
    return this.teamOpponents
      .filter(opponent => this.getTeamClass(opponent) === 'team-vip')
      .reduce((sum, opponent) => sum + opponent.points, 0);
  }

  get funTeamPoints(): number {
    return this.teamOpponents
      .filter(opponent => this.getTeamClass(opponent) === 'team-fun')
      .reduce((sum, opponent) => sum + opponent.points, 0);
  }

  get teamLeadPercent(): number {
    const total = this.vipTeamPoints + this.funTeamPoints;
    if (total === 0) {
      return 50;
    }
    return Math.max(0, Math.min(100, (this.vipTeamPoints / total) * 100));
  }

  private normalized(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }

  constructor(
    private router: Router,
    public modalService: NgbModal,
    public translate: TranslateService,
    private codeService: CodeService,
    public onlineService: OnlineService,
    private localStorageService: LocalStorageService
  ) {
  }

  ngOnInit(): void {
    this.refreshIntervalId = setInterval(() => window.location.reload(), 60000);
    if (this.onlineService.connectionStatus === ConnectionStatus.Connected) {
      this.loadData();
    }
    this.connectionStatusSubscription = this.onlineService.connectionStatusChanged.subscribe(
      status => {
        this.loading = false;
        if (status === ConnectionStatus.Connected) {
          this.loadData();
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
    this.connectionStatusSubscription?.unsubscribe();
    this.modalService.dismissAll();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    await this.onlineService.syncUser(this.codeService.loadOwnBlocksFromLocalStorage());
    await this.onlineService.setUserDisplayInDailyGames();
    const allGames = await this.onlineService.loadGamesAndRemoveOldOnes();
    this.loading = false;
    this.computeOpponentsScore(allGames);
    // Opponents without userDisplay are opponents who have been challenged, but who didn't connect in the 15 days
    this.opponents = this.opponents.filter(opponent => !!opponent.userDisplay);
    this.computeRankings(this.opponents);
    this.filteredOpponents = this.opponents;
    this.teamOpponents = this.opponents.filter(opponent => this.getTeamClass(opponent) !== '');
    this.computeRankings(this.teamOpponents);
  }

  getTeamClass(opponent: Opponent): '' | 'team-vip' | 'team-fun' {
    const displayName = opponent.userDisplay?.displayName?.trim() ?? '';
    if (/^vip/i.test(displayName)) {
      return 'team-vip';
    }
    if (/^fun/i.test(displayName)) {
      return 'team-fun';
    }
    return '';
  }

  private computeOpponentsScore(allGames: AllGames): void {
    this.opponents = [];
    const today = OnlineService.getUtcTimestamp(Date.now());
    const myGames = allGames[today.toString()]
      ?.[this.onlineService.webcomId]
      ?.dailyGames
      ?? {};

    const playersStats = new Map<string, AggregatedPlayerStats>();

    const getOrCreatePlayerStats = (userId: string, userDisplay: Opponent['userDisplay'], lastSeen: number): AggregatedPlayerStats => {
      let playerStats = playersStats.get(userId);
      if (!playerStats) {
        playerStats = {
          userDisplay,
          userDisplayTimestamp: userDisplay ? lastSeen : 0,
          lastSeen,
          activeMatchups: new Map<string, MatchupStats>(),
          points: 0
        };
        playersStats.set(userId, playerStats);
      } else {
        if (lastSeen > playerStats.lastSeen) {
          playerStats.lastSeen = lastSeen;
        }
        if (userDisplay && lastSeen >= playerStats.userDisplayTimestamp) {
          playerStats.userDisplay = userDisplay;
          playerStats.userDisplayTimestamp = lastSeen;
        }
      }
      return playerStats;
    };

    for (const [dayTimestamp, games] of Object.entries(allGames)) {
      for (const [userId, userDailyRecap] of Object.entries(games)) {
        const timestamp = +dayTimestamp;
        const playerStats = getOrCreatePlayerStats(userId, userDailyRecap.userDisplay, timestamp);
        if (!userDailyRecap.dailyGames) {
          continue;
        }
        for (const [opponentId, gameResult] of Object.entries(userDailyRecap.dailyGames)) {
          getOrCreatePlayerStats(opponentId, null, 0);
          let matchupStats = playerStats.activeMatchups.get(opponentId);
          if (!matchupStats) {
            matchupStats = {wins: 0, total: 0};
            playerStats.activeMatchups.set(opponentId, matchupStats);
          }
          matchupStats.total += 1;
          if (gameResult === GamePoint.WON) {
            matchupStats.wins += 1;
          }
        }
      }
    }

    this.computeLeaderboardPoints(playersStats);

    this.opponents = Array.from(playersStats.entries()).map(([userId, playerStats]) => {
      const opponent = new Opponent(userId, playerStats.userDisplay, playerStats.points, 0, playerStats.lastSeen);
      opponent.lastResult = myGames[userId];
      return opponent;
    });
  }

  private computeLeaderboardPoints(playersStats: Map<string, AggregatedPlayerStats>): void {
    const rankBasedPoints = (rank: number): number => {
      const highestScoringRank = appRuntimeConfig.leaderboard.highestScoringRank;
      const maxPointsPerWin = appRuntimeConfig.leaderboard.maxPointsPerWin;
      if (rank < 1 || rank > highestScoringRank) {
        return 0;
      }
      return Math.round(maxPointsPerWin - (rank - 1) * ((maxPointsPerWin - 1) / (highestScoringRank - 1)));
    };

    const currentRanks = new Map<string, number>();
    const sortedIds = Array.from(playersStats.keys()).sort((a, b) => a.localeCompare(b));
    sortedIds.forEach((userId, index) => currentRanks.set(userId, index + 1));

    const topCountedWins = appRuntimeConfig.leaderboard.topCountedWins;

    for (let iteration = 0; iteration < playersStats.size * 2; iteration++) {
      for (const [playerId, playerStats] of playersStats.entries()) {
        const candidatePoints: number[] = [];
        for (const [opponentId, matchupStats] of playerStats.activeMatchups.entries()) {
          if (matchupStats.wins === 0) {
            continue;
          }
          if (matchupStats.wins / matchupStats.total < 0.5) {
            continue;
          }
          const opponentRank = currentRanks.get(opponentId) ?? Number.MAX_SAFE_INTEGER;
          const points = rankBasedPoints(opponentRank);
          if (points > 0) {
            candidatePoints.push(points);
          }
        }
        candidatePoints.sort((a, b) => b - a);
        let totalPoints = candidatePoints.slice(0, topCountedWins).reduce((sum, points) => sum + points, 0);

        const playerDisplayName = playersStats.get(playerId)?.userDisplay?.displayName ?? '';
        if (!/^vip/i.test(playerDisplayName) && !/^fun/i.test(playerDisplayName) && totalPoints > 50) {
          totalPoints -= 51;
        }

        playerStats.points = totalPoints;
      }

      const previousRanks = new Map(currentRanks);
      const rankingOrder = Array.from(playersStats.entries()).sort((a, b) => {
        if (a[1].points !== b[1].points) {
          return b[1].points - a[1].points;
        }
        if (a[1].lastSeen !== b[1].lastSeen) {
          return b[1].lastSeen - a[1].lastSeen;
        }
        return b[0].localeCompare(a[0]);
      });
      rankingOrder.forEach(([userId], index) => currentRanks.set(userId, index + 1));

      const hasConverged = Array.from(currentRanks.entries()).every(([userId, rank]) => previousRanks.get(userId) === rank);
      if (hasConverged) {
        break;
      }
    }
  }

  private computeRankings(opponents: Opponent[]): void {
    opponents.sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      } else if (a.lastSeen !== b.lastSeen) {
        return b.lastSeen - a.lastSeen;
      } else {
        return b.webcomId.localeCompare(a.webcomId);
      }
    });

    let formerPoints = -1;
    let currentRanking = 0;
    let exAequoNumber = 1;
    for (const opponent of opponents) {
      if (formerPoints !== opponent.points) {
        currentRanking += exAequoNumber;
        exAequoNumber = 1;
        formerPoints = opponent.points;
      } else {
        exAequoNumber++;
      }
      opponent.ranking = currentRanking;
    }

    this.personalRanking = this.opponents.find(opp => opp.webcomId === this.onlineService.webcomId)?.ranking ?? 0;
  }

  play(opponentId: string): void {
    if (opponentId === this.onlineService.webcomId) {
      return;
    }
    this.lastResult = this.opponents.find(opponent => opponent.webcomId === opponentId)?.lastResult;
    if (this.lastResult !== undefined) {
      this.modalService.open(this.replayGameContent)
        .result.then(async (replayValidated: boolean) => {
        if (replayValidated) {
          // For some reason, adding these 500ms prevents a glitch for Blockly's vertical scrollbar
          // There should be some race condition between the disappearing Bootstrap modal and Blockly
          await new Promise(resolve => setTimeout(resolve, 500));
          this.router.navigate([`/code/online/${opponentId}`]);
        }
      }, () => { });
    } else {
      this.router.navigate([`/code/online/${opponentId}`]);
    }
  }

  async updateUserDisplayName(nickname: string): Promise<void> {
    await this.onlineService.updateUserDisplayName(nickname)
    this.onlineService.resetUser();
    await this.loadData();
  }

  async downloadBlocks(): Promise<void> {
    const blocks = await this.codeService.loadOwnBlocksFromServer();
    this.localStorageService.saveBlocks(blocks);
    this.modalService.dismissAll();
  }

  removeAccount(): void {
    this.modalService.open(this.deleteAccountContent, {size: 'sm'})
      .result.then((deleteValidated: boolean) => {
        if (deleteValidated) {
          this.onlineService.removeAccount();
          this.onlineService.disconnect();
        }
      }, () => { });
  }
}
