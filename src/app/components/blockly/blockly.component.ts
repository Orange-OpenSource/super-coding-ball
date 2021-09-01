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

import {AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';

import toolboxJson from '../../../assets/blocks/toolbox.json';
import * as Blockly from 'blockly';
import '@blockly/field-slider';
import {CodeService} from '../../services/code.service';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {GameComponent} from '../game/game.component';
import {environment} from '../../../environments/environment';
import {OnlineService} from '../../services/online.service';
import {LocalStorageService} from '../../services/local-storage.service';
import {Location} from '@angular/common';

@Component({
  selector: 'app-blockly',
  templateUrl: './blockly.component.html',
  styleUrls: ['./blockly.component.scss']
})
export class BlocklyComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameComponent') gameComponent?: GameComponent;
  private workspace!: Blockly.WorkspaceSvg;
  private _gameLaunched = false;
  get gameLaunched(): boolean {
    return this._gameLaunched;
  }

  set gameLaunched(value: boolean) {
    this._gameLaunched = value;
    this.workspace?.dispose();
    if (!this._gameLaunched) {
      this.setWorkspaceForEdition();
    } else {
      this.setWorspaceForViewing();
    }
    this.loadBlocksFromLocalStorage();
  }

  readonly isOnline: boolean;
  private readonly opponentId: string;
  debug: boolean;

  constructor(
    public translate: TranslateService,
    private localStorageService: LocalStorageService,
    public codeService: CodeService,
    private onlineService: OnlineService,
    private router: Router,
    private route: ActivatedRoute,
    public location: Location,
    public modalService: NgbModal
  ) {
    translate.addLangs(['fr', 'en']);
    this.debug = !environment.production;
    this.isOnline = this.router.url.includes('/online/');
    this.opponentId = this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this.gameLaunched = false;
  }

  setWorkspaceForEdition(): void {
    const blocklyDiv = document.getElementById('blocklyDiv') as HTMLElement;
    this.workspace = Blockly.inject(blocklyDiv, {
      maxInstances: {
        event_ball_mine: 1,
        event_ball_opponent: 1,
        event_ball_teammate: 1,
        event_ball_none: 1
      },
      comments: false,
      disable: false,
      move: {
        scrollbars: true,
        drag: true,
        wheel: false
      },
      theme: this.codeService.customTheme,
      renderer: 'customized_zelos',
      toolbox: toolboxJson as Blockly.utils.toolbox.ToolboxInfo,
      trashcan: true,
      zoom: {
        controls: false,
        wheel: true,
        pinch: true,
        maxScale: 1,
        minScale: 0.2
      }
    });
    this.workspace.addChangeListener(Blockly.Events.disableOrphans);
  }

  setWorspaceForViewing(): void {
    const blocklyDiv = document.getElementById('blocklyDiv') as HTMLElement;
    this.workspace = Blockly.inject(blocklyDiv, {
      readOnly: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: false
      },
      theme: this.codeService.customDarkTheme,
      renderer: 'customized_zelos',
      trashcan: false,
      zoom: {
        controls: false,
        wheel: true,
        pinch: true,
        maxScale: 1,
        minScale: 0.2
      }
    });
  }

  ngAfterViewInit(): void {
    // Workaround for https://github.com/google/blockly/issues/5404
    // Cf https://groups.google.com/g/blockly/c/EMu8DKmiWQc/m/Nb8Y5D02BQAJ
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      this.workspace.zoomToFit();
    }, 100);
  }

  ngOnDestroy(): void {
    // Case where component was not completely initialized (e.g. when hitting back on game result modal)
    if (!this.workspace) {
      return;
    }
    // If game is launched, blocks are readonly and should not be saved
    // They have been saved before game launch
    if (!this.gameLaunched) {
      const ownBlocks = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(this.workspace));
      this.localStorageService.saveXmlBlocks(ownBlocks);
    }
    this.workspace.dispose();
    this.modalService.dismissAll();
  }

  play(): void {
    const ownBlocks = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(this.workspace));
    this.localStorageService.saveXmlBlocks(ownBlocks);
    if (this.isOnline) {
      this.onlineService.updateUserBlocks(ownBlocks)
        .subscribe();
    }

    const gameDiv = document.getElementById('gameComponent') as HTMLElement;
    const display = window.getComputedStyle(gameDiv).display;
    if (display === 'none') {
      this.router.navigate([`/play/${this.isOnline ? 'online' : 'offline'}/` + this.opponentId]);
    } else {
      this.gameComponent?.loadOwnCode();
      this.gameLaunched = true;
    }
  }

  backToOpponentsList(): void {
    if (this.isOnline) {
      this.router.navigate(['/online-opponents']);
    } else {
      this.router.navigate(['/offline-opponents']);
    }
  }

  openDeletePopup(content: TemplateRef<any>): void {
    this.modalService.open(content)
      .result.then((deletionValidated: boolean) => {
      if (deletionValidated) {
        this.workspace.clear();
        this.workspace.setScale(1);
      }
    });
  }

  loadBlocksFromLocalStorage(): void {
    Blockly.Xml.clearWorkspaceAndLoadFromXml(Blockly.Xml.textToDom(this.codeService.loadOwnXmlBlocksFromLocalStorage()),
      this.workspace);
    this.workspace.zoomToFit();
  }

  undo(): void {
    this.workspace.undo(false);
  }

  redo(): void {
    this.workspace.undo(true);
  }

  loadOpp(): void {
    this.codeService.loadOppXmlBlocks(
      this.router.url.includes('/online/'),
      this.route.snapshot.paramMap.get('id') ?? '')
      .then(xmlBlocks => {
        Blockly.Xml.clearWorkspaceAndLoadFromXml(Blockly.Xml.textToDom(xmlBlocks), this.workspace);
        this.workspace.zoomToFit();
      });
  }
}
