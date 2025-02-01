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
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {HowtoDemoComponent} from '../howto-demo/howto-demo.component';
import {CodeService} from '../../services/code.service';
import {WorkspaceSvg} from 'blockly';
import {interval, Subscription} from 'rxjs';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-howto',
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './howto.component.html'
})
export class HowtoComponent implements OnInit, OnDestroy {
  private shootWorkspace!: WorkspaceSvg;
  private passWorkspace!: WorkspaceSvg;
  private shootOrPassWorkspace!: WorkspaceSvg;
  askingSubscription?: Subscription;
  askingStep = 1;

  constructor(
    private modalService: NgbModal,
    private codeService: CodeService) {
  }

  ngOnInit(): void {
    this.shootWorkspace = this.getHowToWorkspace('blocklyShootDiv');
    this.loadStrategy(this.shootWorkspace, 'howto-shoot');
    this.passWorkspace = this.getHowToWorkspace('blocklyPassDiv');
    this.loadStrategy(this.passWorkspace, 'howto-pass');
    this.shootOrPassWorkspace = this.getHowToWorkspace('blocklyShootOrPassDiv');
    this.loadStrategy(this.shootOrPassWorkspace, 'howto-shoot-or-pass');
    this.askingSubscription = interval(300).subscribe(count => this.askingStep = 1 + count % 2);
  }

  getHowToWorkspace(divId: string): WorkspaceSvg {
    const blocklyDiv = document.getElementById(divId)!;
    return this.codeService.getWorkspace(
      blocklyDiv,
      {
        readOnly: true,
        move: {
          scrollbars: {horizontal: false, vertical: true},
          drag: false,
          wheel: false
        },
        theme: this.codeService.customHowToTheme,
        zoom: {
          controls: false,
          wheel: false,
          pinch: false
        }
      });
  }

  async loadStrategy(workspace: WorkspaceSvg, strategyId: string): Promise<void> {
    const blocks = await this.codeService.loadOppBlocks(false, strategyId);
    CodeService.loadBlocksInWorkspace(blocks, workspace)
    workspace.zoomToFit();
    workspace.scrollbar?.setContainerVisible(false);
  }

  openDemo(): void {
    this.modalService.open(HowtoDemoComponent, {size: 'xl'});
  }

  ngOnDestroy(): void {
    this.modalService.dismissAll();
    this.shootWorkspace.dispose();
    this.passWorkspace.dispose();
    this.shootOrPassWorkspace.dispose();
    this.askingSubscription?.unsubscribe();
  }
}
