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

import {Component, OnDestroy, OnInit, signal, ViewChild, WritableSignal} from '@angular/core';
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

export enum GamePoint {
  LOST = 0,
  DRAW,
  WON
}

@Component({
  selector: 'app-online-opponents',
  imports: [FormsModule, RouterLink, TranslatePipe, DancingMonstersComponent, AnonPicturePipe],
  templateUrl: './online-opponents.component.html'
})

export class OnlineOpponentsComponent implements OnInit, OnDestroy {
  @ViewChild('replayGameContent') private replayGameContent: any;
  @ViewChild('deleteAccountContent') private deleteAccountContent: any;
  GamePoint = GamePoint;
  public ConnectionStatus = ConnectionStatus;
  private connectionStatusSubscription?: Subscription;
  opponents: Opponent[] = [];
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
    this.computeRankings();
    this.filteredOpponents = this.opponents;
  }

  private computeOpponentsScore(allGames: AllGames): void {
    this.opponents = [];
    const today = OnlineService.getUtcTimestamp(Date.now());
    const myGames = allGames[today.toString()]
      ?.[this.onlineService.webcomId]
      ?.dailyGames
      ?? {};

    for (const [dayTimestamp, games] of Object.entries(allGames)) {
      for (const userId of Object.keys(games)) {
        const userDailyRecap = games[userId];
        let searchedUser = this.opponents.find(user => user.webcomId === userId);
        if (!searchedUser) {
          searchedUser = new Opponent(userId, userDailyRecap.userDisplay, 0, 0, +dayTimestamp);
          this.opponents.push(searchedUser);
        } else if (+dayTimestamp > searchedUser.lastSeen) {
          searchedUser.lastSeen = +dayTimestamp;
          searchedUser.userDisplay = userDailyRecap.userDisplay;
        }
        if (!userDailyRecap.dailyGames) {
          continue;
        }
        for (const opponentId of Object.keys(userDailyRecap.dailyGames)) {
          const gameResult = userDailyRecap.dailyGames[opponentId];
          const searchedOpponent = this.opponents.find(opp => opp.webcomId === opponentId);
          if (!searchedOpponent) {
            this.opponents.push(new Opponent(opponentId, null, 2 - gameResult, 0, 0));
          } else {
            searchedOpponent.points += 2 - gameResult;
          }
          searchedUser.points += gameResult;
        }
      }
    }
    this.opponents = this.opponents.map(opponent => {
      opponent.lastResult = myGames[opponent.webcomId];
      return opponent;
    });
  }

  private computeRankings(): void {
    this.opponents.sort((a, b) => {
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
    for (const opponent of this.opponents) {
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
