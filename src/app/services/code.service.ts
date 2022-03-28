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

import {Injectable} from '@angular/core';
import * as Blockly from 'blockly';
import {CustomizedZelosRenderer} from '../components/blockly/customizedZelosRenderer';
import blockStyles from '../../assets/blocks/styles/blockStyles.json';
import categoryStyles from '../../assets/blocks/styles/categoryStyles.json';
import componentStyles from '../../assets/blocks/styles/componentStyles.json';
import componentDarkStyles from '../../assets/blocks/styles/componentDarkStyles.json';
import blocksJson from '../../assets/blocks/blocks.json';
import * as Javascript from 'blockly/javascript';
import {Block} from 'blockly/blockly';
import * as Fr from 'blockly/msg/fr';
import * as CustomFr from '../../assets/i18n/fr.json';
import * as En from 'blockly/msg/en';
import * as CustomEn from '../../assets/i18n/en.json';
import {TranslateService} from '@ngx-translate/core';
import {OnlineService} from './online.service';
import {LocalStorageService} from './local-storage.service';
import {CustomCategory} from '../components/blockly/custom-category';

@Injectable({
  providedIn: 'root'
})
export class CodeService {
  customTheme = Blockly.Theme.defineTheme('customTheme', {
    blockStyles,
    categoryStyles,
    componentStyles,
    startHats: true
  });
  customDarkTheme = Blockly.Theme.defineTheme('customDarkTheme', {
    blockStyles,
    categoryStyles,
    componentStyles: componentDarkStyles,
    startHats: true
  });

  constructor(
    public translate: TranslateService,
    private localStorageService: LocalStorageService,
    private onlineService: OnlineService
  ) {
    // Initiated in the service because it can only be done once
    Blockly.defineBlocksWithJsonArray(blocksJson);

    // Disable two beginners confusing contextual menu entries
    Blockly.ContextMenuRegistry.registry.unregister('blockCollapseExpand');
    Blockly.ContextMenuRegistry.registry.unregister('blockInline');

    this.defineBlocksCodeGen();

    if (this.translate.currentLang === 'fr') {
      Blockly.setLocale(Fr);
      Blockly.setLocale((CustomFr as any).default.BLOCKS);
    } else {
      Blockly.setLocale(En);
      Blockly.setLocale((CustomEn as any).default.BLOCKS);
    }

    Blockly.registry.register(
      Blockly.registry.Type.TOOLBOX_ITEM,
      Blockly.ToolboxCategory.registrationName,
      CustomCategory,
      true);

    CustomizedZelosRenderer.register();
  }

  static computeCode(xmlBlocks: Element): string {
    const workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(xmlBlocks, workspace);
    const code = Javascript.workspaceToCode(workspace);
    workspace.dispose();
    return code;
  }

  loadOppCode(online: boolean, opponentId: string): Promise<string> {
    return this.loadOppXmlBlocks(online, opponentId)
      .then(blocks => CodeService.computeCode(Blockly.Xml.textToDom(blocks)));
  }

  loadOppXmlBlocks(online: boolean, opponentId: string): Promise<string> {
    if (online) {
      return this.onlineService.loadUserBlocks(opponentId);
    } else {
      const oppXmlFile = 'assets/blocks/strategies/' + opponentId + '.xml';
      return fetch(oppXmlFile)
        .then(response => response.text());
    }
  }

  loadOwnCode(): string {
    return CodeService.computeCode(Blockly.Xml.textToDom(this.loadOwnXmlBlocksFromLocalStorage()));
  }

  loadOwnXmlBlocksFromLocalStorage(): string {
    return this.localStorageService.loadXmlBlocks();
  }

  loadOwnXmlBlocksFromServer(): Promise<string> {
    return this.onlineService.loadUserBlocks(this.onlineService.webcomId);
  }

  private defineBlocksCodeGen(): void {
    (Javascript as any).event_ball_mine = (block: Block) => {
      return `if(ball.owner !== null && ball.owner === player) {
${Javascript.statementToCode(block, 'DO')}
}`;
    };

    (Javascript as any).event_ball_teammate = (block: Block) => {
      return `if(ball.owner !== null && ball.owner !== player && ball.owner.ownTeam === player.ownTeam) {
${Javascript.statementToCode(block, 'DO')}
}`;
    };

    (Javascript as any).event_ball_opponent = (block: Block) => {
      return `if(ball.owner !== null && ball.owner !== player && ball.owner.ownTeam !== player.ownTeam) {
${Javascript.statementToCode(block, 'DO')}
}`;
    };

    (Javascript as any).event_ball_none = (block: Block) => {
      return `if(ball.owner === null) {
${Javascript.statementToCode(block, 'DO')}
}`;
    };

    (Javascript as any).move = (block: Block) => {
      const target = Javascript.statementToCode(block, 'NAME');
      // Can't be empty because of shadow block
      return `game.move(player, ${target}, false);`;
    };

    (Javascript as any).sprint = (block: Block) => {
      const target = Javascript.statementToCode(block, 'NAME');
      // Can't be empty because of shadow block
      return `game.move(player, ${target}, true);`;
    };

    (Javascript as any).shoot = (block: Block) => {
      const target = Javascript.statementToCode(block, 'NAME');
      // Can't be empty because of shadow block
      return `game.shoot(player, ${target})`;
    };

    (Javascript as any).player = (block: Block) => {
      const ref = Javascript.statementToCode(block, 'PLAYER_POS_REF');
      // Can't be empty because of shadow blocks
      const isOwnTeam = block.getFieldValue('PLAYER_TEAM') === 'PLAYER_TEAM_OWN';
      let isAtkRole: boolean | null = null;
      if (block.getFieldValue('PLAYER_ROLE') === 'PLAYER_ROLE_ATK') {
        isAtkRole = true;
      } else if (block.getFieldValue('PLAYER_ROLE') === 'PLAYER_ROLE_DFS') {
        isAtkRole = false;
      }
      let isRightSide: boolean | null = null;
      if (block.getFieldValue('PLAYER_SIDE') === 'PLAYER_SIDE_RIGHT') {
        isRightSide = true;
      } else if (block.getFieldValue('PLAYER_SIDE') === 'PLAYER_SIDE_LEFT') {
        isRightSide = false;
      }
      const isNear = block.getFieldValue('PLAYER_POS') === 'PLAYER_POS_NEAR';
      return `game.getPlayer(player, ${isOwnTeam}, ${isAtkRole}, ${isRightSide}, ${isNear}, ${ref})`;
    };

    (Javascript as any).goal = (block: Block) => {
      return `game.getGoal(player, ${block.getFieldValue('GOAL_TYPE') === 'GOAL_OWN'})`;
    };

    (Javascript as any).grid = (block: Block) => {
      return `game.getGridPosition(!player.ownTeam, ${+block.getFieldValue('GRID_COL')}, ${+block.getFieldValue('GRID_ROW')})`;
    };

    (Javascript as any).ball = (block: Block) => {
      return `game.ball.coord`;
    };

    (Javascript as any).myself = (block: Block) => {
      return `player`;
    };

    (Javascript as any).position = (block: Block) => {
      return `game.getTargetPosition(player)`;
    };

    (Javascript as any).middle = (block: Block) => {
      const pos1 = Javascript.statementToCode(block, 'POS1');
      const pos2 = Javascript.statementToCode(block, 'POS2');
      // Can't be empty because of shadow blocks
      return `game.getMiddle(${pos1}, ${pos2})`;
    };

    (Javascript as any).closest = (block: Block) => {
      const ref = Javascript.statementToCode(block, 'NAME');
      // Can't be empty because of shadow block
      return [`game.isClosest(player, ${ref})`, 0];
    };

    (Javascript as any).distance = (block: Block) => {
      const from = Javascript.statementToCode(block, 'FROM');
      const to = Javascript.statementToCode(block, 'TO');
      // Can't be empty because of shadow blocks
      return [`game.getDistance(${from}, ${to})`, 0];
    };

    (Javascript as any).role_and_side = (block: Block) => {
      const player = Javascript.statementToCode(block, 'PLAYER');
      // Can't be empty because of shadow blocks
      let isAtkRole: boolean | null = null;
      if (block.getFieldValue('ROLE') === 'ROLE_ATK') {
        isAtkRole = true;
      } else if (block.getFieldValue('ROLE') === 'ROLE_DFS') {
        isAtkRole = false;
      }
      let isRightSide: boolean | null = null;
      if (block.getFieldValue('SIDE') === 'SIDE_RIGHT') {
        isRightSide = true;
      } else if (block.getFieldValue('SIDE') === 'SIDE_LEFT') {
        isRightSide = false;
      }
      return [`game.playerIsRoleAndSide(${player}, ${isAtkRole}, ${isRightSide})`, 0];
    };

    (Javascript as any).place = (block: Block) => {
      const item = Javascript.statementToCode(block, 'ITEM');
      // Can't be empty because of shadow block
      return [`game.itemInGrid(!player.ownTeam,${item},${+block.getFieldValue('POS_COL')},${+block.getFieldValue('POS_ROW')})`, 0];

    };

    (Javascript as any).energy = (block: Block) => {
      const player = Javascript.statementToCode(block, 'NAME');
      // Can't be empty because of shadow block
      return [`(${player} === null ? null : ${player}.energy)`, 0];
    };

    (Javascript as any).custom_if = (block: Block) => {
      const ifStatement = Javascript.valueToCode(block, 'IF', 0);
      const thenStatement = Javascript.statementToCode(block, 'THEN');
      const elseStatement = Javascript.statementToCode(block, 'ELSE');
      if (!ifStatement) { // No shadow block on if statement
        return null;
      } else {
        return `if(${ifStatement} === null) {
  null;
} else if(${ifStatement}) {
${thenStatement}
} else {
${elseStatement}
}`;
      }
    };

    (Javascript as any).custom_compare = (block: Block) => {
      const left = Javascript.valueToCode(block, 'LEFT', 0);
      const right = Javascript.valueToCode(block, 'RIGHT', 0);
      if (!left || !right) { // No shadow block on left statement
        return [`null`, 0];
      } else {
        if (block.getFieldValue('INEQUALITY') === 'LOWER') {
          return [`((${left} === null || ${right} === null) ? null : ${left} < ${right})`, 0];
        } else {
          return [`((${left} === null || ${right} === null) ? null : ${left} > ${right})`, 0];
        }
      }
    };
  }
}
