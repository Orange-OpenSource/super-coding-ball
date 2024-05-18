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

import {Component, OnDestroy, OnInit} from '@angular/core';

import Blockly from 'blockly';
import '@blockly/field-slider';
import {CodeService} from '../../services/code.service';
import {TranslateService} from '@ngx-translate/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {firstValueFrom} from 'rxjs';

interface Step {
  blockId: string;
  commentId: string;
}

@Component({
  selector: 'app-howto-demo',
  templateUrl: './howto-demo.component.html'
})

export class HowtoDemoComponent implements OnInit, OnDestroy {
  private workspace!: Blockly.WorkspaceSvg;
  steps: Step[] = [
    {
      blockId: '!)[W-:(e8^GFG^DIE!~B',
      commentId: 'OPP_HAS_BALL',
    },
    {
      blockId: 'Ug-hB-hPh)!d;!gf[C-K',
      commentId: 'OWN_HAS_BALL',
    },
    {
      blockId: 'm~aLiMkk0CWh_WwM,VW$',
      commentId: 'NOONE_HAS_BALL',
    },
    {
      blockId: 'Fd0xR:5fq,J=aM/I9[hE',
      commentId: 'CONDITION_NEAR',
    },
    {
      blockId: 'd-K^I%6[f9-Kzy)VVx;f',
      commentId: 'BALL_MINE',
    },
    {
      blockId: 'LCAD0q4jM}v/PHuCbk8{',
      commentId: 'CONDITION_COMPARISON',
    },
    {
      blockId: '}JbZ?B6z|FHz0j)`)4D{',
      commentId: 'PARAM_DISTANCE'
    },
    {
      blockId: 'LA~PbLuEUWRC4qX+jWIO',
      commentId: 'PARAM_VALUE'
    },
    {
      blockId: 'U0n6De,fbavUtbJ+Hn+.',
      commentId: 'TEAMMATE',
    },
    {
      blockId: '8f,b7Tj2?/^IK-Gj.c|I',
      commentId: 'RUN_TOWARDS_GOAL'
    }
  ];
  private _currentStep = 0;
  get currentStep(): number {
    return this._currentStep;
  }

  set currentStep(value: number) {
    if (value >= 0 && value <= this.steps.length - 1) {
      this._currentStep = value;
      this.goToStep(this._currentStep);
    }
  }

  private stepBlock: Blockly.BlockSvg | null = null;

  constructor(
    public translate: TranslateService,
    public codeService: CodeService,
    public activeModal: NgbActiveModal
  ) {
  }

  async ngOnInit(): Promise<void> {
    this.setWorkspace();
    const blocks = await this.codeService.loadOppBlocks(false, 'demo');
    CodeService.loadBlocksInWorkspace(blocks, this.workspace)
    this.currentStep = 0;
  }

  async goToStep(stepNumber: number): Promise<void> {
    this.stepBlock?.setCommentText(null);
    this.stepBlock?.getIcon(Blockly.icons.IconType.COMMENT)?.setBubbleVisible(false);
    const blockId = this.steps[stepNumber].blockId;
    await this.smoothCenterOnBlock(blockId);
    const comment = await firstValueFrom(this.translate.get('HOW_TO_DEMO.' + this.steps[stepNumber].commentId));
    this.stepBlock = this.workspace.getBlockById(blockId);
    this.stepBlock?.setCommentText(comment);
    this.stepBlock?.getIcon(Blockly.icons.IconType.COMMENT)?.setBubbleVisible(true);
  }

  setWorkspace(): void {
    const blocklyDiv = document.getElementById('blocklyDiv')!;
    this.workspace = this.codeService.getWorkspace(blocklyDiv,
      {
        readOnly: true,
        move: {
          scrollbars: true,
          drag: true,
          wheel: false
        },
        theme: this.codeService.customEditingTheme,
        zoom: {
          startScale: 0.6,
          controls: false,
          wheel: true,
          pinch: true,
          maxScale: 1,
          minScale: 0.2
        }
      });
  }

  ngOnDestroy(): void {
    this.workspace.dispose();
  }

  // Adapted from https://github.com/google/blockly/blob/master/core/workspace_svg.js
  private async smoothCenterOnBlock(id: string): Promise<void> {
    const block = this.workspace.getBlockById(id)!;
    const xy = block.getRelativeToSurfaceXY();
    const heightWidth = block.getHeightWidth();
    const blockCenterY = xy.y + heightWidth.height / 2;
    const blockCenterX = xy.x + (heightWidth.width / 2);
    const scale = this.workspace.scale;
    const pixelX = blockCenterX * scale;
    const pixelY = blockCenterY * scale;
    const metrics = this.workspace.getMetrics();
    const halfViewWidth = metrics.viewWidth / 2;
    const halfViewHeight = metrics.viewHeight / 2;
    const scrollToCenterX = pixelX - halfViewWidth;
    const scrollToCenterY = pixelY - halfViewHeight;
    const targetX = -scrollToCenterX;
    const targetY = -scrollToCenterY;
    const originalX = this.workspace.scrollX;
    const originalY = this.workspace.scrollY;
    for (let step = 0; step < 10; step++) {
      this.workspace.scroll(
        originalX + (targetX - originalX) / 10 * step,
        originalY + (targetY - originalY) / 10 * step
      );
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}
