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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Player, PlayerState} from '../../models/player';
import {Ball} from '../../models/ball';
import {Sprite, SpriteCoord} from '../../models/sprite';
import {CodeService} from '../../services/code.service';
import {ActivatedRoute, Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LocalStorageService} from '../../services/local-storage.service';
import {OnlineService} from '../../services/online.service';
import {environment} from '../../../environments/environment';
import {GamePoint} from '../online-opponents/online-opponents.component';

interface FieldDivision {
  start: number;
  end: number;
}

export enum PeriodType {
  BeforeFirstPeriod = 1,
  FirstPeriod,
  HalfTime,
  SecondPeriod,
  Finished
}

const canvasWidth = 456;
const canvasHeight = 554;
const widthMargin = 28;
const heightMargin = 27;
const energyBarWidth = 30;
const energyBarHeight = 5;
const fieldWidth = canvasWidth - 2 * widthMargin;
const fieldHeight = canvasHeight - 2 * heightMargin;
const columnsCount = 5;
const rowsCount = 5;
const columns: FieldDivision[] = [];
const rows: FieldDivision[] = [];
const goalWidth = 112;
const periodDuration = 45;
const ownGoal: SpriteCoord = {x: widthMargin + fieldWidth / 2, y: canvasHeight - heightMargin};
const oppGoal: SpriteCoord = {x: widthMargin + fieldWidth / 2, y: heightMargin};
const opponentsCollisionDist = 40;
const opponentsAvoidDist = opponentsCollisionDist * 1.5;
const teammatesCollisionDist = 20;
const ballCatchingDistance = 20;
const moveThreshold = 15;
const shotVelocityErrorMargin = 10 / 100;
const shotVelocityMax = 18;
const shotAngleErrorMargin = 10; // in degrees
const ballOwnerVelocity = 0.8;
const nonBallOwnerVelocity = 1;
const sprintingVelocityFactor = 2;

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})

export class GameComponent implements OnInit, OnDestroy {
  @ViewChild('kickOffContent') private kickOffContent: any;
  @ViewChild('stopGameContent') private stopGameContent: any;
  @ViewChild('endGameContent') private endGameContent: any;
  @Input() gameLaunched = true;
  @Output() gameLaunchedChange = new EventEmitter<boolean>();

  PeriodType = PeriodType;
  isStandaloneScreen: boolean;
  isOnline: boolean;
  opponentId = '';
  ownTeamWillStart = true;
  gamePaused = true;
  gameStopped = false;
  periodType = PeriodType.BeforeFirstPeriod;
  lastTimeout = 0;

  private _acceleratedGame = this.localStorageService.getAcceleratedGameStatus();
  get acceleratedGame(): boolean {
    return this._acceleratedGame;
  }

  set acceleratedGame(accelerated: boolean) {
    this._acceleratedGame = accelerated;
    this.localStorageService.setAcceleratedGameStatus(accelerated);
  }

  gameTime = 0;
  gameTimeDisplayed = '00';
  ownScore = 0;
  oppScore = 0;
  private field!: HTMLImageElement;
  private fieldContext!: CanvasRenderingContext2D;
  private ownerMark!: HTMLImageElement;
  private players = [
    new Player('girl1', true, true, true),
    new Player('guy1', true, true, false),
    new Player('girl2', true, false, true),
    new Player('guy2', true, false, false),
    new Player('orc', false, true, true),
    new Player('skel', false, true, false),
    new Player('zomb', false, false, true),
    new Player('rept', false, false, false)
  ];
  private ball = new Ball();
  private framesCount = 0;
  private enteringCode = '';
  private ownCode = '';
  private oppCode = '';

  constructor(
    private codeService: CodeService,
    private onlineService: OnlineService,
    private localStorageService: LocalStorageService,
    private router: Router,
    private route: ActivatedRoute,
    public modalService: NgbModal,
  ) {
    this.computeGridPositions();
    this.isOnline = this.router.url.includes('/online/');
    this.opponentId = this.route.snapshot.paramMap.get('id') ?? '';
    this.codeService.loadOppCode(this.isOnline, this.opponentId)
      .then(code => this.oppCode = code);

    this.isStandaloneScreen = this.router.url.includes('/play');
    if (this.isStandaloneScreen) {
      this.loadOwnCode();
    }
  }

  public loadOwnCode(): void {
    this.ownTeamWillStart = true;
    this.ownCode = this.codeService.loadOwnCode();
    if (!environment.production) {
      console.log(this.ownCode);
    }
    this.positionPlayersAndBallBeforeKickOff();
    this.openKickOffPopup();
  }

  computeGridPositions(): void {
    for (let col = 0; col < columnsCount; col++) {
      columns.push({
        start: widthMargin + fieldWidth * col / columnsCount,
        end: widthMargin + fieldWidth * (col + 1) / columnsCount
      });
    }
    for (let row = 0; row < rowsCount; row++) {
      rows.push({
        start: heightMargin + fieldHeight * row / rowsCount,
        end: heightMargin + fieldHeight * (row + 1) / rowsCount
      });
    }
  }

  ngOnInit(): void {
    this.ownerMark = new Image();
    this.ownerMark.src = 'assets/icons/owner-mark.png';
    this.positionPlayersAndBallBeforeEntry();
    this.fieldContext = (document.getElementById('fieldCanvas') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D;
    this.field = new Image();
    this.field.src = 'assets/football-pitch-with-marks.png';
    this.field.onload = () => {
      this.codeService.loadOppCode(false, 'entering')
        .then(code => {
          this.enteringCode = code;
          this.drawingLoop();
        });
    };
  }

  ngOnDestroy(): void {
    this.gameStopped = true;
    if (this.lastTimeout !== 0) {
      clearTimeout(this.lastTimeout);
      this.lastTimeout = 0;
    }
    this.modalService.dismissAll();
  }

  openKickOffPopup(): void {
    if (this.lastTimeout !== 0) {
      clearTimeout(this.lastTimeout);
      this.lastTimeout = 0;
    }
    // If launched immediately, the popup is empty on mobile
    this.lastTimeout = window.setTimeout(() => {
      this.modalService.open(this.kickOffContent, {size: 'sm'}).result.then(
        () => this.kickOff(),
        () => this.kickOff());
      this.lastTimeout = 0;
    }, 1000);
  }

  kickOff(): void {
    this.positionPlayersAndBallBeforeKickOff();
    this.gamePaused = false;
    if (this.periodType === PeriodType.BeforeFirstPeriod) {
      if (this.isOnline) {
        this.onlineService.setGameResult(this.opponentId, GamePoint.LOST)
          .subscribe();
      }
      this.periodType = PeriodType.FirstPeriod;
    } else if (this.periodType === PeriodType.HalfTime) {
      this.periodType = PeriodType.SecondPeriod;
    }
    this.players.forEach(it => it.state = PlayerState.Playing);
  }

  positionPlayersAndBallBeforeEntry(): void {
    for (const player of this.players) {
      player.angle = 0;
      player.energy = 100;
      player.coord = this.getGridPosition(false, 1, 3);
      player.state = PlayerState.Entering;
    }
    this.ball.coord = this.getGridPosition(false, 3, 3);
    this.ball.owner = null;
  }

  positionPlayersAndBallBeforeKickOff(): void {
    for (const player of this.players) {
      player.angle = player.ownTeam ? -Math.PI / 2 : Math.PI / 2;
      player.energy = 100;
      const col = player.isRightSide ? 4 : 2;
      const row = player.isAtkRole ? 4 : 5;
      player.coord = this.getGridPosition(!player.ownTeam, col, row);
      player.state = PlayerState.Waiting;
    }

    this.ball.owner = this.getPlayer(
      new Player(null, true, true, true),
      this.ownTeamWillStart,
      true,
      true,
      true,
      {x: 0, y: 0}
    );
  }

  private drawingLoop(): void {
    if (this.gameStopped) {
      return;
    }
    this.framesCount++;
    if (!this.acceleratedGame && this.framesCount < 4) {
      window.requestAnimationFrame(() => this.drawingLoop());
      return;
    }
    this.framesCount = 0;
    this.tickClock();
    this.handleSprites();
    window.requestAnimationFrame(() => this.drawingLoop());
  }

  private tickClock(): void {
    if (!this.gamePaused) {
      this.gameTime = Math.round((this.gameTime + 0.05) * 100) / 100;
      this.gameTimeDisplayed = String(Math.round(this.gameTime)).padStart(2, '0');
      if (this.gameTime === periodDuration) {
        this.periodFinished(true);
      } else if (this.gameTime === 2 * periodDuration) {
        this.periodFinished(false);
      }
    }
  }

  private periodFinished(startSecondPeriod: boolean): void {
    this.gamePaused = true;
    this.ownTeamWillStart = false;
    for (const player of this.players) {
      player.state = PlayerState.Waiting;
    }
    this.ball.owner = null;
    this.ball.velocity = 0;
    this.ball.coord = this.getGridPosition(false, 3, 3);
    this.periodType = startSecondPeriod ? PeriodType.HalfTime : PeriodType.Finished;
    if (startSecondPeriod) {
      this.openKickOffPopup();
    } else {
      if (this.isOnline) {
        this.onlineService.setGameResult(
          this.opponentId,
          this.ownScore > this.oppScore ? GamePoint.WON : (this.ownScore === this.oppScore ? GamePoint.DRAW : GamePoint.LOST))
          .subscribe();
      } else if (this.ownScore > this.oppScore) {
        this.localStorageService.setOfflineWonStatus(this.opponentId);
      }
      this.modalService.open(this.endGameContent, {size: 'sm'}).result.then(
        () => this.backToOpponentsList(),
        () => this.backToOpponentsList());
    }
  }

  stopGame(): void {
    this.ownTeamWillStart = true;
    this.modalService.open(this.stopGameContent, {size: 'sm'})
      .result.then((stopValidated: boolean) => {
        if (stopValidated) {
          if (this.lastTimeout !== 0) {
            clearTimeout(this.lastTimeout);
            this.lastTimeout = 0;
          }

          this.periodType = PeriodType.BeforeFirstPeriod;
          this.gamePaused = true;
          this.gameTime = 0;
          this.gameTimeDisplayed = '00';
          this.oppScore = 0;
          this.ownScore = 0;
          this.positionPlayersAndBallBeforeKickOff();
          this.gameLaunchedChange.emit(false);
        }
      });
  }

  backToCodeEdition(): void {
    this.router.navigate([`/code/${this.isOnline ? 'online' : 'offline'}/` + this.opponentId]);
  }

  private backToOpponentsList(): void {
    if (this.isOnline) {
      this.router.navigate(['/online-opponents']);
    } else {
      this.router.navigate(['/offline-opponents']);
    }
  }

  private handleSprites(): void {
    let caller = this.ball.caller;
    for (const player of this.players) {
      player.still = true;
      if (player.state === PlayerState.Entering || player.state === PlayerState.Playing || player.state === PlayerState.Pushed) {
        // Before anything, if a player has called for the ball, make the pass
        if (caller) {
          this.shoot(player, caller)
        }
        this.executePlayerCode(player);
        this.handlePlayerCollisions(player);
      }
      if (player.state !== PlayerState.Falling && player.still) {
        player.energy = player.energy + 2 * Math.random();
      }
    }
    this.moveBall();
    this.drawSprites();
  }

  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#Never_use_eval!
  private executePlayerCode(player: Player): void {
    let code: string;
    if (player.state === PlayerState.Entering) {
      code = this.enteringCode;
    } else if (player.ownTeam) {
      code = this.ownCode;
    } else {
      code = this.oppCode;
    }
    return Function('"use strict";return (function(game, player){ ' + code + ' })')()
    (this, player);
  }

  private handlePlayerCollisions(player: Player): void {
    for (const otherPlayer of this.players.filter(it => it !== player &&
      (it.state === PlayerState.Playing || it.state === PlayerState.Pushed))) {
      const isOpponent = player.ownTeam !== otherPlayer.ownTeam;
      const collisionDist = isOpponent ? opponentsCollisionDist : teammatesCollisionDist;
      if (this.computeDistance(player.coord, otherPlayer.coord) < collisionDist) {
        const middleX = (player.coord.x + otherPlayer.coord.x) / 2;
        const middleY = (player.coord.y + otherPlayer.coord.y) / 2;
        let angleFromPlayerToOther = this.computeAngle(player.coord, otherPlayer.coord);
        // Add +/- 22.5°
        angleFromPlayerToOther += (Math.random() - 0.5) * Math.PI / 4;
        player.coord.x = middleX - collisionDist * 1.1 / 2 * Math.cos(angleFromPlayerToOther);
        player.coord.y = middleY - collisionDist * 1.1 / 2 * Math.sin(angleFromPlayerToOther);
        otherPlayer.coord.x = middleX + collisionDist * 1.1 / 2 * Math.cos(angleFromPlayerToOther);
        otherPlayer.coord.y = middleY + collisionDist * 1.1 / 2 * Math.sin(angleFromPlayerToOther);
        if (isOpponent && this.ball.owner === otherPlayer) {
          this.tryToStealBall(otherPlayer, player, angleFromPlayerToOther);
        } else if (isOpponent && this.ball.owner === player) {
          this.tryToStealBall(player, otherPlayer, -angleFromPlayerToOther);
        }
      }
    }
  }

  private tryToStealBall(owner: Player, thief: Player, angleFromThiefToOwner: number): void {
    // Thief should be running towards owner +/- 45°
    if (thief.still || Math.cos(angleFromThiefToOwner - thief.angle) < Math.cos(Math.PI / 4)) {
      return;
    }
    if (owner.state !== PlayerState.Pushed) {
      owner.state = PlayerState.Pushed;
    }
    // -1 if thief arrives from front, 1 if he arrives from behind
    const frontFacing = Math.cos(owner.angle - thief.angle);
    const collisionLoss = 5 * (frontFacing - 3); // from -20 to -10
    owner.energy = owner.energy + Math.random() * collisionLoss;
    if (owner.energy === 0) {
      this.ball.owner = thief;
      owner.state = PlayerState.Falling;
    }
  }

  private moveBall(): void {
    if (this.ball.owner) {
      this.ball.owningTime++;
      // Clone position so that ball can be moved without the player
      this.ball.coord = Object.assign({}, this.ball.owner.coord);
      this.ball.angle = this.ball.owner.angle;
      this.ball.still = this.ball.owner.still;
    } else {
      this.ball.computeMovement();
      this.checkIfBallIfOffLimits();
      this.checkIfBallHasBeenCaught();
    }
    if (!this.gamePaused) {
      this.checkIfGoalScored();
    }
  }

  private checkIfBallIfOffLimits(): void {
    if (this.ball.coord.x < widthMargin) {
      this.ball.coord.x = widthMargin;
    }
    if (this.ball.coord.x > canvasWidth - widthMargin) {
      this.ball.coord.x = canvasWidth - widthMargin;
    }
    if (this.ball.coord.y < heightMargin) {
      this.ball.coord.y = heightMargin;
    }
    if (this.ball.coord.y > canvasHeight - heightMargin) {
      this.ball.coord.y = canvasHeight - heightMargin;
    }
  }

  private checkIfBallHasBeenCaught(): void {
    const playersNearBall = this.players
      // A falling player can't catch the ball
      .filter(it => it.state !== PlayerState.Falling)
      // Only players close to the ball can catch it
      .filter(it => this.computeDistance(this.ball.coord, it.coord) < ballCatchingDistance)
      // If rolling, ball should be rolling towards player +/- 90°
      .filter(it => (this.ball.still || Math.cos(this.computeAngle(this.ball.coord, it.coord) - this.ball.angle) > Math.cos(Math.PI / 2)))
      // The closest player is the most likely to catch the ball
      .sort((a, b) => this.computeDistance(this.ball.coord, a.coord) - this.computeDistance(this.ball.coord, b.coord));

    for (const playerNearBall of playersNearBall) {
      // Can't catch ball if it is too fast
      if (Math.random() * shotVelocityMax > this.ball.velocity) {
        this.ball.owner = playerNearBall;
        break;
      }
    }
  }

  private checkIfGoalScored(): void {
    const goalCenterX = ownGoal.x;
    if (this.ball.coord.x > goalCenterX - goalWidth / 2 && this.ball.coord.x < goalCenterX + goalWidth / 2) {
      if (this.ball.coord.y < oppGoal.y + 5) {
        this.scoreGoal(true);
      } else if (this.ball.coord.y > ownGoal.y - 5) {
        this.scoreGoal(false);
      }
    }
  }

  private scoreGoal(forOwnTeam: boolean): void {
    if (forOwnTeam) {
      this.ownScore++;
    } else {
      this.oppScore++;
    }
    const scorer = this.ball.owner ?? this.ball.formerOwner;
    for (const player of this.players) {
      if (player.ownTeam === forOwnTeam) {
        if (player === scorer) {
          player.state = PlayerState.Celebrating;
        } else {
          player.state = PlayerState.CoCelebrating;
        }
      } else {
        player.state = PlayerState.Crying;
      }
    }
    this.gamePaused = true;
    if (this.ball.owner === null) {
      this.ball.velocity = 0;
    }
    this.openKickOffPopup();
    this.ownTeamWillStart = !forOwnTeam;
  }

  private drawSprites(): void {
    this.fieldContext.drawImage(this.field, 0, 0, 456, 554, 0, 0, this.fieldContext.canvas.width, this.fieldContext.canvas.height);
    this.drawBallOwnerMark();

    // Draw sprites from top to bottom (including the ball)
    const sprites: Sprite[] = [];
    sprites.push(...this.players);
    sprites.push(this.ball);
    for (const sprite of sprites.sort((a, b) => a.offsetCoord.y - b.offsetCoord.y)) {
      sprite.animate();
      const currentFrame = Math.floor(sprite.currentFrame);
      this.fieldContext.drawImage(
        sprite.image,
        sprite.width * sprite.animData.frames[currentFrame].col,
        sprite.height * sprite.animData.frames[currentFrame].row,
        sprite.width, sprite.height,
        Math.round(sprite.offsetCoord.x) - sprite.widthBaseOffset,
        Math.round(sprite.offsetCoord.y) - sprite.heightBaseOffset,
        sprite.width, sprite.height);
      if (sprite instanceof Player && !this.gamePaused) {
        this.drawEnergyBar(sprite);
      }
    }
  }

  private drawBallOwnerMark(): void {
    if (this.ball.owner) {
      this.fieldContext.drawImage(
        this.ownerMark,
        Math.round(this.ball.owner.offsetCoord.x) - this.ownerMark.width / 2,
        Math.round(this.ball.owner.offsetCoord.y) - this.ownerMark.height / 2);
    }
  }

  private drawEnergyBar(player: Player): void {
    const x0 = Math.round(player.offsetCoord.x) - 15;
    const y0 = Math.round(player.offsetCoord.y) - 52;
    const x1 = x0 + energyBarWidth;
    const y1 = y0 + energyBarHeight;
    const gradient = this.fieldContext.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(0.3, 'orange');
    gradient.addColorStop(1, 'lime');
    this.fieldContext.strokeRect(x0, y0, energyBarWidth, energyBarHeight);
    this.fieldContext.fillStyle = 'darkslategray';
    this.fieldContext.fillRect(x0 + 1, y0 + 1, energyBarWidth - 2, energyBarHeight - 2);
    this.fieldContext.fillStyle = gradient;
    this.fieldContext.fillRect(x0 + 1, y0 + 1, (energyBarWidth - 2) * player.energy / 100, energyBarHeight - 2);
  }

  private move(player: Player, target: SpriteCoord | Player, isSprinting: boolean): void {
    const targetCoord = this.getSpritePosition(target);
    // When entering, stop on target and greet
    if (player.state === PlayerState.Entering && this.computeDistance(player.coord, targetCoord) < 2) {
      player.state = PlayerState.Greeting;
      return;
      // else if not entering
    } else if (player.state !== PlayerState.Entering
      // and not running to score a goal
      && !(this.ball.owner === player && targetCoord === this.getGoal(player, false))
      // and close enough to the target
      && this.computeDistance(player.coord, targetCoord) < moveThreshold
    ) {
      // don't go closer
      return;
    }
    const directAngle = this.computeAngle(player.coord, targetCoord);
    const correctedAngle = this.computeAngleToAvoidCollisions(player, directAngle);
    let velocity = this.ball.owner === player ? ballOwnerVelocity : nonBallOwnerVelocity;
    if (isSprinting) {
      velocity *= sprintingVelocityFactor;
    }
    player.coord.x += velocity * Math.cos(correctedAngle);
    player.coord.y += velocity * Math.sin(correctedAngle);
    player.angle = correctedAngle;
    player.still = false;
    if (isSprinting && player.state !== PlayerState.Entering) {
      player.energy = player.energy - 2 * Math.random();
    }
    if (player.energy === 0) {
      player.state = PlayerState.Falling;
      if (this.ball.owner === player) {
        this.ball.coord.y = this.ball.coord.y - 2; // move ball up so that it is drawn before falling player
        this.ball.owner = null;
      }
    }
  }

  private computeAngleToAvoidCollisions(player: Player, directAngle: number): number {
    // Don't avoid collision if one doesn't have the ball
    if (this.ball.owner !== player) {
      return directAngle;
    }
    const closestOpp = this.getPlayer(player, false, null, null, true, player.coord);
    // If all opponents are falling, no collision to avoid
    if (closestOpp.state === PlayerState.Falling) {
      return directAngle;
    }
    const closestOppDistance = this.computeDistance(player.coord, closestOpp.coord);
    // Don't avoid collision if opponent is far
    if (closestOppDistance > opponentsAvoidDist) {
      return directAngle;
    }
    const closestOppAngle = this.computeAngle(player.coord, closestOpp.coord);
    // If opponent is at more than 90° from direct angle don't avoid him
    if (Math.cos(directAngle - closestOppAngle) <= 0) {
      return directAngle;
    }
    if (directAngle === closestOppAngle) {
      // If opponent is in front, choose right or left randomly
      return Math.random() > 0.5 ? directAngle + Math.PI / 2 : directAngle - Math.PI / 2;
      // Else new angle at at 90° from opponent angle to avoid him
    } else if (Math.sin(directAngle - closestOppAngle) > 0) {
      return closestOppAngle + Math.PI / 2;
    } else {
      return closestOppAngle - Math.PI / 2;
    }
  }

  private shoot(player: Player, target: SpriteCoord | Player): void {
    if (this.ball.owner !== player) {
      return;
    }

    // When player just received ball, he can't make a pass yet
    if (this.ball.owningTime < 5) {
      return;
    }

    // Don't pass the ball to a falling player
    if (target instanceof Player && target.state == PlayerState.Falling) {
      return;
    }

    const targetCoord = this.getSpritePosition(target);
    // Don't shoot at player own position
    if (this.computeDistance(player.coord, targetCoord) === 0) {
      return;
    }
    const perfectAngle = this.computeAngle(player.coord, targetCoord);
    // Add angle error
    const randomizedAngle = perfectAngle + shotAngleErrorMargin / 90 * Math.PI * (Math.random() - 0.5);
    this.ball.angle = randomizedAngle;
    this.ball.owner.angle = randomizedAngle;

    let velocity;
    if (targetCoord === ownGoal || targetCoord === oppGoal) {
      // When shooting to a goal, use max velocity
      velocity = shotVelocityMax;
    } else {
      // Otherwise compute exact velocity to send the ball exactly on target
      velocity = Math.min(shotVelocityMax, this.getPerfectVelocity(player, targetCoord));
    }
    // Add velocity error
    this.ball.velocity = velocity * (1 + shotVelocityErrorMargin * (2 * Math.random() - 1));
    this.ball.owner = null;
  }

  private getPerfectVelocity(player: Player, targetCoord: SpriteCoord): number {
    const totalDist = this.computeDistance(player.coord, targetCoord);
    // totalDist = 1 + 2 + 3 + ... + perfectVelocity
    // totalDist = perfectVelocity * (1 + perfectVelocity) / 2
    // perfectVelocity² + perfectVelocity - 2 * totalDist = 0
    return (Math.sqrt(8 * totalDist) - 1) / 2;
  }

  private isClosest(player: Player, posRef: SpriteCoord | Player): boolean {
    const posRefCoord = this.getSpritePosition(posRef);
    const closestTeammate = this.getPlayer(player, true, null, null, true, posRefCoord);
    // If all teammates are falling, I'm the closest
    if (closestTeammate.state == PlayerState.Falling) {
      return true;
    }
    return this.computeDistance(player.coord, posRefCoord) <= this.computeDistance(closestTeammate.coord, posRefCoord);
  }

  private getDistance(targetA: SpriteCoord | Player, targetB: SpriteCoord | Player): number {
    return this.computeDistance(this.getSpritePosition(targetA), this.getSpritePosition(targetB));
  }

  private getMiddle(pos1: SpriteCoord | Player, pos2: SpriteCoord | Player): SpriteCoord {
    return {
      x: (this.getSpritePosition(pos1).x + this.getSpritePosition(pos2).x) / 2,
      y: (this.getSpritePosition(pos1).y + this.getSpritePosition(pos2).y) / 2
    };
  }

  private playerIsRoleAndSide(player: Player, isAtkRole: boolean | null, isRightSide: boolean | null): boolean {
    return (isAtkRole === null || isAtkRole === player.isAtkRole) &&
      (isRightSide === null || isRightSide === player.isRightSide);
  }

  private itemInGrid(invertCoord: boolean,
    item: SpriteCoord | Player,
    col: 0 | 1 | 2 | 3 | 4 | 5,
    row: 0 | 1 | 2 | 3 | 4 | 5): boolean {
    const newCol = col === 0 ? 0 : (invertCoord ? 6 - col : col);
    const newRow = row === 0 ? 0 : (invertCoord ? 6 - row : row);
    const itemCoord = this.getSpritePosition(item);
    if (newCol !== 0 &&
      (itemCoord.x < columns[newCol - 1].start || itemCoord.x > columns[newCol - 1].end)) {
      return false;
    }
    if (newRow !== 0 &&
      (itemCoord.y < rows[newRow - 1].start || itemCoord.y > rows[newRow - 1].end)) {
      return false;
    }
    return true;
  }

  private computeDistance(coordA: SpriteCoord, coordB: SpriteCoord): number {
    return Math.sqrt((coordB.x - coordA.x) ** 2 + (coordB.y - coordA.y) ** 2);
  }

  private computeAngle(from: SpriteCoord, to: SpriteCoord): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }

  private getPlayer(player: Player,
    isOwnTeam: boolean,
    isAtkRole: boolean | null,
    isRightSide: boolean | null,
    isNear: boolean,
    posRef: SpriteCoord | Player): Player {

    // Filter by position (role, side and team)
    let filteredPlayers = this.players
      .filter(it => isAtkRole === null || isAtkRole === it.isAtkRole)
      .filter(it => isRightSide === null || isRightSide === it.isRightSide)
      .filter(it => it.ownTeam === (isOwnTeam ? player.ownTeam : !player.ownTeam));

    if (filteredPlayers.length === 1) {
      return filteredPlayers[0];
    }

    // Discard current player
    filteredPlayers = filteredPlayers.filter(it => it !== player);

    if (filteredPlayers.length === 1) {
      return filteredPlayers[0];
    }

    const posRefCoord = this.getSpritePosition(posRef);
    return filteredPlayers
      // Discard the position reference if it is a player
      .filter(it => posRef instanceof Player ? (it !== posRef) : true)
      .sort((playerA, playerB) => {
        // If a player is falling, sort it out
        if (playerA.state === PlayerState.Falling && playerB.state !== PlayerState.Falling) {
          return 1;
        } else if (playerB.state === PlayerState.Falling && playerA.state !== PlayerState.Falling) {
          return -1;
        } else {
          // Otherwise sort by distance to posRefCoord
          return isNear ?
            this.computeDistance(posRefCoord, playerA.coord) - this.computeDistance(posRefCoord, playerB.coord) :
            this.computeDistance(posRefCoord, playerB.coord) - this.computeDistance(posRefCoord, playerA.coord);
        }
      })[0];
  }

  private getGoal(player: Player, own: boolean): SpriteCoord {
    if (player.ownTeam && own || !player.ownTeam && !own) {
      return ownGoal;
    } else {
      return oppGoal;
    }
  }

  private getGridPosition(invertCoord: boolean, col: 1 | 2 | 3 | 4 | 5, row: 1 | 2 | 3 | 4 | 5): SpriteCoord {
    const newCol = invertCoord ? 6 - col : col;
    const newRow = invertCoord ? 6 - row : row;
    return {
      x: (columns[newCol - 1].start + columns[newCol - 1].end) / 2,
      y: (rows[newRow - 1].start + rows[newRow - 1].end) / 2
    };
  }

  private getTargetPosition(player: Player): SpriteCoord {
    const col = player.isRightSide ? 4 : 2;
    const row = player.isAtkRole ? 2 : 5;
    return this.getGridPosition(!player.ownTeam, col, row);
  }

  private getSpritePosition(input: SpriteCoord | Player): SpriteCoord {
    return input instanceof Player ? input.coord : input;
  }
}
