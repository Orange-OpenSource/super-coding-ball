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

import {Injectable, OnDestroy, EventEmitter} from '@angular/core';
import Webcom from 'webcom/webcom-auth-sldblite.js';
import {AllGames, ConnectionStatus, OneDayGames, User, UserDisplay} from '../models/webcom-models';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OnlineService implements OnDestroy {
  webcomApp = Webcom.App('super-coding-ball');
  webcomAuth = this.webcomApp.authentication;
  connectionStatusChanged = new EventEmitter<ConnectionStatus>();
  private _connectionStatus = ConnectionStatus.Unknown;

  get connectionStatus(): ConnectionStatus {
    return this._connectionStatus;
  }

  set connectionStatus(status: ConnectionStatus) {
    if (this._connectionStatus !== status) {
      this.connectionStatusChanged.emit(status);
    }
    this._connectionStatus = status;
  }

  authCallback: any;
  webcomId = '';
  authHeadersOption = {headers: new HttpHeaders()};
  webcomDisplayName = '';
  userDisplay = new UserDisplay();
  userSynced = false;
  userDisplaySetInDailyGames: {[dayTimestamp: string]: boolean} = {};
  allGames?: AllGames = undefined
  webcomBaseUrl = 'https://io.datasync.orange.com/datasync/v2/super-coding-ball/data';
  webcomUsersUrl = `${this.webcomBaseUrl}/users`;
  webcomGamesUrl = `${this.webcomBaseUrl}/games`;

  constructor(private http: HttpClient) {
    this.authCallback = (error: any, authState: any) => {
      if (error) {
        this.deleteCredentials();
        this.connectionStatus = ConnectionStatus.Disconnected;
        switch (error.code) {
          case 'INVALID_CREDENTIALS':
            console.log('The email or password is incorrect.');
            break;
          case 'PROVIDER_DISABLED':
            console.log('The email/password method is disabled in the application. It must be enabled in the Webcom developer console.');
            break;
          default:
            console.log('An unexpected error occurred, please retry and contact your administrator.', error);
        }
      } else {
        if (authState?.state == 'some') {
          this.parseAuthInfo(authState.details);
        } else {
          console.log(authState?.state == 'none' ? 'No authentication' : 'Authentication failed', authState);
          this.deleteCredentials();
          this.connectionStatus = ConnectionStatus.Disconnected;
        }
      }
    };

    this.webcomAuth.subscribe(this.authCallback);
  }

  static getUtcTimestamp(timestamp: number): number {
    const localDateLocalMidnight = new Date(timestamp);
    localDateLocalMidnight.setHours(0, 0, 0, 0);
    const localDateUtcMidnight = new Date();
    localDateUtcMidnight.setUTCFullYear(localDateLocalMidnight.getFullYear());
    localDateUtcMidnight.setUTCMonth(localDateLocalMidnight.getMonth());
    localDateUtcMidnight.setUTCDate(localDateLocalMidnight.getDate());
    localDateUtcMidnight.setUTCHours(0, 0, 0, 0);
    return localDateUtcMidnight.getTime();
  }

  private deleteCredentials(): void {
    this.userDisplay = new UserDisplay();
    this.webcomId = '';
    this.authHeadersOption = {headers: new HttpHeaders()};
  }

  private parseAuthInfo(auth: any): void {
    if (auth.provider === 'facebook') {
      console.log('Facebook authentication succeeded', auth);
      this.webcomDisplayName = auth.displayName;
      this.userDisplay.pictureUrl = `https://graph.facebook.com/v10.0/${auth.providerProfile.id}/picture`;
    } else if (auth?.provider === 'google') {
      console.log('Google authentication succeeded', auth);
      this.webcomDisplayName = auth.displayName;
      this.userDisplay.pictureUrl = auth.providerProfile.picture;
    } else if (auth.provider === 'anonymous') {
      console.log('Anonymous authentication succeeded', auth);
      this.webcomDisplayName = 'Team-' + auth.uid.substring(0, 4);
    }
    this.webcomId = auth.uid;
    this.authHeadersOption = {headers: new HttpHeaders().set('Authorization', 'Bearer ' + auth.webcomAuthToken)};
    this.connectionStatus = ConnectionStatus.Connected;
  }

  ngOnDestroy(): void {
    this.webcomAuth.unsubscribe(this.authCallback);
  }

  public connectAnonymously(): void {
    this.webcomAuth.signInAsGuest();
  }

  public connectWithFacebook(): void {
    this.webcomAuth.signInWithOAuth('facebook', {mode: 'redirect', scope: 'public_profile'});
  }

  public connectWithGoogle(): void {
    this.webcomAuth.signInWithOAuth('google', {mode: 'redirect', scope: 'profile'});
  }

  public disconnect(): void {
    this.resetUser();
    this.webcomAuth.signOut();
  }

  public resetUser(): void {
    this.userSynced = false;
    this.userDisplaySetInDailyGames = {};
  }

  public removeAccount(): void {
    firstValueFrom(this.http.delete(`${this.webcomUsersUrl}/${this.webcomId}`, this.authHeadersOption))
    for (let pastDayCount = 0; pastDayCount < 15; pastDayCount++) {
      const pastDayTimestamp = OnlineService.getUtcTimestamp(Date.now() - pastDayCount * 1000 * 60 * 60 * 24);
      firstValueFrom(this.http.delete(`${this.webcomGamesUrl}/${pastDayTimestamp}/${this.webcomId}`, this.authHeadersOption));
    }
  }

  async syncUser(blocks: string): Promise<void> {
    if (!this.userSynced) {
      const currentUser = await firstValueFrom(this.http.get<User | null>(`${this.webcomUsersUrl}/${this.webcomId}`, this.authHeadersOption));
      if (!!currentUser?.displayName) {
        this.userDisplay.fullDisplayName = currentUser.displayName;
      } else {
        this.userDisplay.fullDisplayName = this.webcomDisplayName;
      }
      if (!currentUser?.blocks) {
        await this.updateUserBlocks(blocks);
      }

      this.userSynced = true;
    }
  }

  async updateUserDisplayName(displayName: string): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.webcomUsersUrl}/${this.webcomId}`, {displayName}, this.authHeadersOption));
  }

  async updateUserBlocks(blocks: string): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.webcomUsersUrl}/${this.webcomId}`, {blocks}, this.authHeadersOption));
  }

  async setUserDisplayInDailyGames(): Promise<void> {
    const today = OnlineService.getUtcTimestamp(Date.now());
    if (!this.userDisplaySetInDailyGames[today]) {
      await firstValueFrom(
        this.http.put<UserDisplay>(`${this.webcomGamesUrl}/${today}/${this.webcomId}/userDisplay`, this.userDisplay, this.authHeadersOption)
      );
      this.userDisplaySetInDailyGames[today] = true
    }
  }

  async loadGamesAndRemoveOldOnes(): Promise<AllGames> {
    const allGames = await this.loadAllGamesOrRefreshTodayGames();
    const allTimeStamps = Object.keys(allGames);
    for (const timestamp of allTimeStamps) {
      if (+timestamp < Date.now() - 15 * 1000 * 60 * 60 * 24) {
        this.deleteDay(timestamp);
        delete allGames[timestamp];
      }
    }
    this.allGames = allGames;
    return allGames;
  }

  // Only refresh games from the current date, which depends on the timezone of the player
  // Thus, games being played by players whose date is yesterday or tomorrow will not be updated
  // but it is an acceptable drawback compared to the network traffic improvement
  private async loadAllGamesOrRefreshTodayGames(): Promise<AllGames> {
    const allGames = this.allGames;
    if (!allGames) {
      return await firstValueFrom(this.http.get<AllGames>(this.webcomGamesUrl, this.authHeadersOption));
    } else {
      const today = OnlineService.getUtcTimestamp(Date.now());
      const todayGames = await firstValueFrom(this.http.get<OneDayGames>(`${this.webcomGamesUrl}/${today}`, this.authHeadersOption))
      allGames[today] = todayGames;
      return allGames
    }
  }

  async deleteDay(dayTimestamp: string): Promise<void> {
    await firstValueFrom(this.http.delete<any>(`${this.webcomGamesUrl}/${dayTimestamp}`, this.authHeadersOption));
  }

  async loadUserBlocks(userId: string): Promise<string> {
    return await firstValueFrom(this.http.get<string>(`${this.webcomUsersUrl}/${userId}/blocks`, this.authHeadersOption));
  }

  async setGameResult(opponentId: string, points: number): Promise<void> {
    const today = OnlineService.getUtcTimestamp(Date.now());
    await firstValueFrom(this.http.put(`${this.webcomGamesUrl}/${today}/${this.webcomId}/dailyGames/${opponentId}`, points, this.authHeadersOption));
  }
}
