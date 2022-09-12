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
// @ts-ignore
import {javascriptGenerator} from 'blockly/javascript';
import {CustomizedZelosRenderer} from '../components/blockly/customizedZelosRenderer';
import blockStyles from '../../assets/blocks/styles/blockStyles.json';
import categoryStyles from '../../assets/blocks/styles/categoryStyles.json';
import componentStyles from '../../assets/blocks/styles/componentStyles.json';
import componentDarkStyles from '../../assets/blocks/styles/componentDarkStyles.json';
import blocksJson from '../../assets/blocks/blocks.json';
// @ts-ignore
import * as Fr from 'blockly/msg/fr';
import * as CustomFr from '../../assets/i18n/fr.json';
// @ts-ignore
import * as Ru from 'blockly/msg/ru';
import * as CustomRu from '../../assets/i18n/ru.json';
// @ts-ignore
import * as En from 'blockly/msg/en';
import * as CustomEn from '../../assets/i18n/en.json';
import {TranslateService} from '@ngx-translate/core';
import {OnlineService} from './online.service';
import {LocalStorageService} from './local-storage.service';
import {CustomCategory} from '../components/blockly/custom-category';
import {Theme} from 'blockly';

@Injectable({
  providedIn: 'root'
})
export class CodeService {
  customTheme: Blockly.Theme;
  customDarkTheme: Blockly.Theme;

  constructor(
    public translate: TranslateService,
    private localStorageService: LocalStorageService,
    private onlineService: OnlineService
  ) {
    const lightTheme = new Theme('lightTheme',
      (blockStyles as unknown as { [key: string]: Blockly.Theme.BlockStyle }),
      categoryStyles,
      componentStyles);
    lightTheme.startHats = true;
    this.customTheme = Blockly.Theme.defineTheme('customTheme', lightTheme);

    const darkTheme = new Theme('darkTheme',
      (blockStyles as unknown as { [key: string]: Blockly.Theme.BlockStyle }),
      categoryStyles,
      componentDarkStyles);
    darkTheme.startHats = true;
    this.customDarkTheme = Blockly.Theme.defineTheme('customDarkTheme', darkTheme);

    // Initiated in the service because it can only be done once
    Blockly.defineBlocksWithJsonArray(blocksJson);

    // Disable two beginners confusing contextual menu entries
    Blockly.ContextMenuRegistry.registry.unregister('blockCollapseExpand');
    Blockly.ContextMenuRegistry.registry.unregister('blockInline');

    this.defineBlocksCodeGen();

    if (this.translate.currentLang === 'fr') {
      // @ts-ignore
      Blockly.setLocale(Fr);
      // @ts-ignore
      Blockly.setLocale((CustomFr as any).default.BLOCKS);
    } else if (this.translate.currentLang === 'ru') {
      // @ts-ignore
        Blockly.setLocale(Ru);
      // @ts-ignore
        Blockly.setLocale((CustomRu as any).default.BLOCKS);
    } else {
      // @ts-ignore
        Blockly.setLocale(En);
      // @ts-ignore
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
    const code = javascriptGenerator.workspaceToCode(workspace);
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
    javascriptGenerator.event_ball_mine = (block: Blockly.Block) => {
      return `if(ball.owner !== null && ball.owner === player) {
${javascriptGenerator.statementToCode(block, 'DO')}
}`;
    };

    javascriptGenerator.event_ball_teammate = (block: Blockly.Block) => {
      return `if(ball.owner !== null && ball.owner !== player && ball.owner.ownTeam === player.ownTeam) {
${javascriptGenerator.statementToCode(block, 'DO')}
}`;
    };

    javascriptGenerator.event_ball_opponent = (block: Blockly.Block) => {
      return `if(ball.owner !== null && ball.owner !== player && ball.owner.ownTeam !== player.ownTeam) {
${javascriptGenerator.statementToCode(block, 'DO')}
}`;
    };

    javascriptGenerator.event_ball_none = (block: Blockly.Block) => {
      return `if(ball.owner === null) {
${javascriptGenerator.statementToCode(block, 'DO')}
}`;
    };

    javascriptGenerator.move = (block: Blockly.Block) => {
      const target = javascriptGenerator.statementToCode(block, 'NAME');
      // Can't be empty because of shadow block
      return `game.move(player, ${target}, false);`;
    };

    javascriptGenerator.sprint = (block: Blockly.Block) => {
      const target = javascriptGenerator.statementToCode(block, 'NAME');
      // Can't be empty because of shadow block
      return `game.move(player, ${target}, true);`;
    };

    javascriptGenerator.shoot = (block: Blockly.Block) => {
      const target = javascriptGenerator.statementToCode(block, 'NAME');
      // Can't be empty because of shadow block
      return `game.shoot(player, ${target})`;
    };

    javascriptGenerator.player = (block: Blockly.Block) => {
      const ref = javascriptGenerator.statementToCode(block, 'PLAYER_POS_REF');
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

    javascriptGenerator.goal = (block: Blockly.Block) => {
      return `game.getGoal(player, ${block.getFieldValue('GOAL_TYPE') === 'GOAL_OWN'})`;
    };

    javascriptGenerator.grid = (block: Blockly.Block) => {
      return `game.getGridPosition(!player.ownTeam, ${+block.getFieldValue('GRID_COL')}, ${+block.getFieldValue('GRID_ROW')})`;
    };

    javascriptGenerator.ball = (block: Blockly.Block) => {
      return `game.ball.coord`;
    };

    javascriptGenerator.myself = (block: Blockly.Block) => {
      return `player`;
    };

    javascriptGenerator.position = (block: Blockly.Block) => {
      return `game.getTargetPosition(player)`;
    };

    javascriptGenerator.middle = (block: Blockly.Block) => {
      const pos1 = javascriptGenerator.statementToCode(block, 'POS1');
      const pos2 = javascriptGenerator.statementToCode(block, 'POS2');
      // Can't be empty because of shadow blocks
      return `game.getMiddle(${pos1}, ${pos2})`;
    };

    javascriptGenerator.closest = (block: Blockly.Block) => {
      const ref = javascriptGenerator.statementToCode(block, 'NAME');
      // Can't be empty because of shadow block
      return [`game.isClosest(player, ${ref})`, 0];
    };

    javascriptGenerator.distance = (block: Blockly.Block) => {
      const from = javascriptGenerator.statementToCode(block, 'FROM');
      const to = javascriptGenerator.statementToCode(block, 'TO');
      // Can't be empty because of shadow blocks
      return [`game.getDistance(${from}, ${to})`, 0];
    };

    javascriptGenerator.role_and_side = (block: Blockly.Block) => {
      const player = javascriptGenerator.statementToCode(block, 'PLAYER');
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

    javascriptGenerator.place = (block: Blockly.Block) => {
      const item = javascriptGenerator.statementToCode(block, 'ITEM');
      // Can't be empty because of shadow block
      return [`game.itemInGrid(!player.ownTeam,${item},${+block.getFieldValue('POS_COL')},${+block.getFieldValue('POS_ROW')})`, 0];

    };

    javascriptGenerator.energy = (block: Blockly.Block) => {
      const player = javascriptGenerator.statementToCode(block, 'NAME');
      // Can't be empty because of shadow block
      return [`(${player} === null ? null : ${player}.energy)`, 0];
    };

    javascriptGenerator.custom_if = (block: Blockly.Block) => {
      const ifStatement = javascriptGenerator.valueToCode(block, 'IF', 0);
      const thenStatement = javascriptGenerator.statementToCode(block, 'THEN');
      const elseStatement = javascriptGenerator.statementToCode(block, 'ELSE');
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

    javascriptGenerator.custom_compare = (block: Blockly.Block) => {
      const left = javascriptGenerator.valueToCode(block, 'LEFT', 0);
      const right = javascriptGenerator.valueToCode(block, 'RIGHT', 0);
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
