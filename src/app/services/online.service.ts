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
import {concatMap, filter, map, tap, toArray} from 'rxjs/operators';
import {firstValueFrom, from, Observable, of} from 'rxjs';

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
    this.webcomAuth.signOut();
  }

  public removeAccount(): Observable<any> {
    return this.http.delete(`${this.webcomUsersUrl}/${this.webcomId}`, this.authHeadersOption)
      .pipe(
        concatMap(() => Array<number>(15).keys()),
        map(pastDayCount => OnlineService.getUtcTimestamp(Date.now() - pastDayCount * 1000 * 60 * 60 * 24)),
        concatMap(pastDayTimestamp =>
          this.http.delete(`${this.webcomGamesUrl}/${pastDayTimestamp}/${this.webcomId}`, this.authHeadersOption))
      );
  }

  syncUserData(blocks: string): Observable<any> {
    return this.getAndCreateUserIfNeeded(blocks)
      .pipe(concatMap(() => this.refreshUserDisplayInDailyGames()));
  }

  private getAndCreateUserIfNeeded(blocks: string): Observable<any> {
    return this.http.get<User | null>(`${this.webcomUsersUrl}/${this.webcomId}`, this.authHeadersOption)
      .pipe(
        concatMap(currentUser => {
          if (!!currentUser?.displayName) {
            this.userDisplay.fullDisplayName = currentUser.displayName;
          } else {
            this.userDisplay.fullDisplayName = this.webcomDisplayName;
          }
          if (!currentUser?.blocks) {
            return this.updateUserBlocks(blocks);
          } else {
            return of(true);
          }
        }));
  }

  updateUserDisplayName(displayName: string): Observable<any> {
    return this.http.patch(`${this.webcomUsersUrl}/${this.webcomId}`, {displayName}, this.authHeadersOption);
  }

  updateUserBlocks(blocks: string): Observable<any> {
    return this.http.patch(`${this.webcomUsersUrl}/${this.webcomId}`, {blocks}, this.authHeadersOption);
  }

  private refreshUserDisplayInDailyGames(): Observable<any> {
    const dateString = OnlineService.getUtcTimestamp(Date.now());
    return this.http.put<UserDisplay>(`${this.webcomGamesUrl}/${dateString}/${this.webcomId}/userDisplay`,
      this.userDisplay, this.authHeadersOption);
  }

  loadGamesAndRemoveOldOnes(): Observable<AllGames> {
    return this.loadAllGamesOrRefreshTodayGames()
      .pipe(
        concatMap(allGames => {
          const allTimeStamps = Object.keys(allGames);
          return from(allTimeStamps)
            .pipe(
              filter(timestamp => +timestamp < Date.now() - 15 * 1000 * 60 * 60 * 24),
              concatMap(oldTimestamp => this.deleteDay(oldTimestamp).pipe(tap(() => delete allGames[oldTimestamp]))),
              toArray(),
              map(() => allGames)
            )
        }),
        tap(allGames => this.allGames = allGames)
      );
  }

  // Only refresh games from the current date, which depends on the timezone of the player
  // Thus, games being played by players whose date is yesterday or tomorrow will not be updated
  // but it is an acceptable drawback compared to the network traffic improvement
  private loadAllGamesOrRefreshTodayGames(): Observable<AllGames> {
    const allGames = this.allGames;
    if (!allGames) {
      return this.http.get<AllGames>(this.webcomGamesUrl, this.authHeadersOption);
    } else {
      const today = OnlineService.getUtcTimestamp(Date.now());
      return this.http.get<OneDayGames>(`${this.webcomGamesUrl}/${today}`, this.authHeadersOption)
        .pipe(map(todayGames => {
          allGames[today] = todayGames;
          return allGames
        }))
    }
  }

  deleteDay(dayTimestamp: string): Observable<any> {
    return this.http.delete<any>(`${this.webcomGamesUrl}/${dayTimestamp}`, this.authHeadersOption);
  }

  loadUserBlocks(userId: string): Promise<string> {
    return firstValueFrom(this.http.get<string>(`${this.webcomUsersUrl}/${userId}/blocks`, this.authHeadersOption));
  }

  setGameResult(opponentId: string, points: number): Observable<any> {
    const today = OnlineService.getUtcTimestamp(Date.now());
    return this.http.put(`${this.webcomGamesUrl}/${today}/${this.webcomId}/dailyGames/${opponentId}`, points, this.authHeadersOption);
  }
}
