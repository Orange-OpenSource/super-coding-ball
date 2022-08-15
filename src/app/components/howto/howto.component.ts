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
import * as Blockly from 'blockly';
import {CodeService} from '../../services/code.service';
import {WorkspaceSvg} from 'blockly';

@Component({
  selector: 'app-howto',
  templateUrl: './howto.component.html',
  styleUrls: ['./howto.component.scss']
})
export class HowtoComponent implements OnInit, OnDestroy {
  private shootWorkspace!: Blockly.WorkspaceSvg;
  private passWorkspace!: Blockly.WorkspaceSvg;
  private shootOrPassWorkspace!: Blockly.WorkspaceSvg;

  constructor(
    private modalService: NgbModal,
    private codeService: CodeService) {
  }

  ngOnInit(): void {
    this.shootWorkspace = this.setWorspaceForViewing('blocklyShootDiv');
    this.loadAndZoomOut(this.shootWorkspace, 'howto-shoot');
    this.passWorkspace = this.setWorspaceForViewing('blocklyPassDiv');
    this.loadAndZoomOut(this.passWorkspace, 'howto-pass');
    this.shootOrPassWorkspace = this.setWorspaceForViewing('blocklyShootOrPassDiv');
    this.loadAndZoomOut(this.shootOrPassWorkspace, 'howto-shoot-or-pass');
  }

  setWorspaceForViewing(divId: string): WorkspaceSvg {
    const blocklyDiv = document.getElementById(divId) as HTMLElement;
    return Blockly.inject(blocklyDiv, {
      readOnly: true,
      move: {
        scrollbars: true,
        drag: false,
        wheel: false
      },
      theme: this.codeService.customDarkTheme,
      renderer: 'customized_zelos',
      trashcan: false,
      zoom: {
        controls: false,
        wheel: false,
        pinch: false
      }
    });
  }

  loadAndZoomOut(workspace: WorkspaceSvg, strategyId: string): void {
    this.codeService.loadOppXmlBlocks(false, strategyId)
      .then(xmlBlocks => {
        Blockly.Xml.clearWorkspaceAndLoadFromXml(Blockly.Xml.textToDom(xmlBlocks), workspace);
        workspace.zoomToFit();
        workspace.zoomCenter(-1);
      });
  }

  openDemo(): void {
    this.modalService.open(HowtoDemoComponent, {size: 'xl'});
  }

  ngOnDestroy(): void {
    this.modalService.dismissAll();
    this.shootWorkspace.dispose();
    this.passWorkspace.dispose();
    this.shootOrPassWorkspace.dispose();
  }
}
