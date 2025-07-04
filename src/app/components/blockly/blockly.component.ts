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

import {Component, isDevMode, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';

import * as Blockly from 'blockly';
import {Events, WorkspaceSvg} from 'blockly';
import '@blockly/field-slider';
import {CodeService, RecursiveActionEvent} from '../../services/code.service';
import {ActivatedRoute, Router} from '@angular/router';
import {NgbModal, NgbTooltip} from '@ng-bootstrap/ng-bootstrap';
import {DisplayType, GameComponent} from '../game/game.component';
import {OnlineService} from '../../services/online.service';
import {LocalStorageService} from '../../services/local-storage.service';
import {Tooltip} from 'bootstrap';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {TouchDevicesService} from '../../services/touch-devices.service';
import {firstValueFrom} from 'rxjs';
import {Girl1Icon, Girl2Icon, Guy1Icon, Guy2Icon, IDebugIcon} from './debug-icons';
import {CommonModule} from '@angular/common';
const actionBlockTypes = ['shoot', 'move', 'sprint', 'call_for_ball'];

@Component({
  selector: 'app-blockly',
  imports: [CommonModule, TranslatePipe, NgbTooltip, GameComponent],
  templateUrl: './blockly.component.html',
  styleUrls: ['./blockly.component.scss']
})
export class BlocklyComponent implements OnInit, OnDestroy {
  @ViewChild('gameComponent') gameComponent?: GameComponent;
  @ViewChild('recursiveActionContent') recursiveActionContent?: TemplateRef<any>;
  @ViewChild('stopGameContent') private stopGameContent: any;
  recursiveActionName = {value: ''};
  private workspace?: WorkspaceSvg;
  private _gameLaunched = false;
  get gameLaunched(): boolean {
    return this._gameLaunched;
  }

  set gameLaunched(value: boolean) {
    this._gameLaunched = value;
    this.workspace?.dispose();
    this.workspace = (this._gameLaunched ? this.getViewingWorkspace() : this.getEditingWorkspace());
    this.loadBlocksFromLocalStorage(this.workspace);
  }

  private lastBlockIds = ['', '', '', ''];
  readonly isOnline: boolean;
  private readonly opponentId: string;
  debug: boolean;

  constructor(
    private localStorageService: LocalStorageService,
    private translate: TranslateService,
    public codeService: CodeService,
    private onlineService: OnlineService,
    private router: Router,
    private route: ActivatedRoute,
    public modalService: NgbModal,
    public touchDevicesService: TouchDevicesService
  ) {
    this.debug = isDevMode();
    this.isOnline = this.router.url.includes('/online/');
    this.opponentId = this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this.gameLaunched = false;
    this.customizeMyActionsCategory();
  }

  setCategoryTooltips(): void {
    if (!this.touchDevicesService.isTouchDevice()) {
      this.setCategoryTooltip('customIconEvent', 'EVENTS');
      this.setCategoryTooltip('customIconCondition', 'CONDITIONS');
      this.setCategoryTooltip('customIconAction', 'ACTIONS');
      this.setCategoryTooltip('customIconPosition', 'POSITIONS');
      this.setCategoryTooltip('customIconValue', 'VALUES');
      this.setCategoryTooltip('customIconAdvanced', 'ADVANCED');
      this.setCategoryTooltip('customIconMyActions', 'MY_ACTIONS');
    }
  }

  private async setCategoryTooltip(categoryStyle: string, categoryKey: string) {
    const wording = await firstValueFrom(this.translate.get(`BLOCKS.${categoryKey}`));
    const categoryElement = document.getElementsByClassName(categoryStyle).item(0)!!.parentElement!!.parentElement!!;
    Tooltip.getOrCreateInstance(categoryElement, {title: wording, placement: 'auto'});

  }

  private async customizeMyActionsCategory() {
    // The procedure category is created automatically by Blockly
    // We just modify its definition callback to add the 'My Actions' label
    // and a separator between definition and call blocks
    const wording = await firstValueFrom(this.translate.get('BLOCKS.MY_ACTIONS'));
    const procedureCategoryCallback = this.workspace?.getToolboxCategoryCallback('PROCEDURE')!
    this.workspace?.registerToolboxCategoryCallback('PROCEDURE', workspace => {
      const procedureBlocks = procedureCategoryCallback(workspace) as Blockly.utils.toolbox.BlockInfo[];
      const procedureLabel: Blockly.utils.toolbox.LabelInfo = {
        kind: 'label',
        text: wording,
        id: undefined,
      }
      const procedureSeparator: Blockly.utils.toolbox.SeparatorInfo = {
        kind: 'sep',
        gap: 40,
        id: undefined,
        cssconfig: undefined,
      }
      return [procedureLabel, procedureBlocks[0], procedureSeparator].concat(procedureBlocks.slice(1))
    });
  }

  getEditingWorkspace(): Blockly.WorkspaceSvg {
    const blocklyDiv = document.getElementById('blocklyDiv')!;
    const workspace = this.codeService.getWorkspace(blocklyDiv, {
      move: {
        scrollbars: true,
        drag: true,
        wheel: false
      },
      theme: this.codeService.customEditingTheme,
      zoom: {
        controls: false,
        wheel: true,
        pinch: true,
        maxScale: 1,
        minScale: 0.2
      }
    });
    this.setCategoryTooltips();
    return workspace;
  }

  getViewingWorkspace(): Blockly.WorkspaceSvg {
    const blocklyDiv = document.getElementById('blocklyDiv')!;
    return this.codeService.getWorkspace(blocklyDiv, {
      readOnly: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: false
      },
      theme: this.codeService.customViewingTheme,
      zoom: {
        controls: false,
        wheel: true,
        pinch: true,
        maxScale: 1,
        minScale: 0.2
      }
    });
  }

  ngOnDestroy(): void {
    // Case where component was not completely initialized (e.g. when hitting back on game result modal)
    if (!this.workspace) {
      return;
    }
    // If game is launched, blocks are readonly and should not be saved
    // They have been saved before game launch
    if (!this.gameLaunched) {
      const ownBlocks = CodeService.getBlocksFromWorkspace(this.workspace);
      this.localStorageService.saveBlocks(ownBlocks);
    }
    this.workspace.dispose();
    this.modalService.dismissAll();
  }

  play(): void {
    if (this.workspace) {
      const ownBlocks = CodeService.getBlocksFromWorkspace(this.workspace);
      this.localStorageService.saveBlocks(ownBlocks);
      if (this.isOnline) {
        this.onlineService.updateUserBlocks(ownBlocks);
      }

      if (this.gameComponent?.displayType == DisplayType.Hidden) {
        this.router.navigate([`/play/${this.isOnline ? 'online' : 'offline'}/` + this.opponentId]);
      } else {
        this.gameComponent?.loadOwnCode();
        this.gameLaunched = true;
      }
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
          this.workspace?.clear();
          this.workspace?.setScale(1);
        }
      }, () => { });
  }

  loadBlocksFromLocalStorage(workspace: WorkspaceSvg): void {
    const blocks = this.codeService.loadOwnBlocksFromLocalStorage();
    CodeService.loadBlocksInWorkspace(blocks, workspace);
    workspace.zoomToFit();
    workspace.addChangeListener((event: Events.Abstract) => {
      if (event instanceof RecursiveActionEvent) {
        this.recursiveActionName.value = event.recursiveActionName;
        this.modalService.open(this.recursiveActionContent);
        this.workspace?.undo(false)
      }
    });
  }

  undo(): void {
    this.workspace?.undo(false);
  }

  redo(): void {
    this.workspace?.undo(true);
  }

  async loadOpp(): Promise<void> {
    if (this.workspace) {
      const blocks = await this.codeService.loadOppBlocks(
        this.router.url.includes('/online/'),
        this.route.snapshot.paramMap.get('id') ?? ''
      );
      CodeService.loadBlocksInWorkspace(blocks, this.workspace)
      this.workspace.zoomToFit();
    }
  }

  highlightBlocks(blockIds: string[]) {
    this.highlightBlock(blockIds, 0, Girl1Icon, 'Girl1Icon');
    this.highlightBlock(blockIds, 1, Guy1Icon, 'Guy1Icon');
    this.highlightBlock(blockIds, 2, Girl2Icon, 'Girl2Icon');
    this.highlightBlock(blockIds, 3, Guy2Icon, 'Guy2Icon');
  }

  highlightBlock(blockIds: string[], playerNumber: number, playerIcon: IDebugIcon, playerIconType: string) {
    if (this.lastBlockIds[playerNumber] != blockIds[playerNumber]) {
      const oldBlock = this.workspace?.getBlockById(this.lastBlockIds[playerNumber]);
      if (oldBlock) {
        oldBlock.removeIcon(new Blockly.icons.IconType(playerIconType));
      }
      this.lastBlockIds[playerNumber] = blockIds[playerNumber];
      const newBlock = this.workspace?.getBlockById(this.lastBlockIds[playerNumber]);
      if (newBlock && actionBlockTypes.includes(newBlock.type)) {
        newBlock.addIcon(new playerIcon(newBlock));
      }
    }
  }

  stopGame(): void {
    this.modalService.open(this.stopGameContent, {size: 'sm'})
      .result.then((stopValidated: boolean) => {
        if (stopValidated) {
          this.gameLaunched = false;
          this.gameComponent?.stopGame();
        }
      }, () => { });
  }
}
