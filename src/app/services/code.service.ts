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
import {BlocklyOptions} from 'blockly/core/blockly_options';
import blockStyles from '../../assets/blocks/styles/blockStyles.json';
import categoryStyles from '../../assets/blocks/styles/categoryStyles.json';
import componentStyles from '../../assets/blocks/styles/componentStyles.json';
import componentDarkStyles from '../../assets/blocks/styles/componentDarkStyles.json';
import blocksJson from '../../assets/blocks/blocks.json';
import {javascriptGenerator} from 'blockly/javascript';
import * as Fr from 'blockly/msg/fr';
import * as CustomFr from '../../assets/i18n/fr.json';
import * as Ru from 'blockly/msg/ru';
import * as CustomRu from '../../assets/i18n/ru.json';
import * as En from 'blockly/msg/en';
import * as CustomEn from '../../assets/i18n/en.json';
import {TranslateService} from '@ngx-translate/core';
import {OnlineService} from './online.service';
import {LocalStorageService} from './local-storage.service';
import {CustomCategory} from '../components/blockly/custom-category';
import toolboxJson from '../../assets/blocks/toolbox.json';

@Injectable({
  providedIn: 'root'
})
export class CodeService {
  customTheme = Blockly.Theme.defineTheme('customTheme', {
    name: 'lightTheme',
    blockStyles,
    categoryStyles,
    componentStyles,
    startHats: true
  });
  customDarkTheme = Blockly.Theme.defineTheme('customDarkTheme', {
    name: 'darkTheme',
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

    // Disable contextual menu entry that enable/disable inlining (confusing for beginners)
    Blockly.ContextMenuRegistry.registry.unregister('blockInline');

    this.defineBlocksCodeGen();

    if (this.translate.currentLang === 'fr') {
      Blockly.setLocale(Fr);
      Blockly.setLocale((CustomFr as any).default.BLOCKS);
    } else if (this.translate.currentLang === 'ru') {
      Blockly.setLocale(Ru);
      Blockly.setLocale((CustomRu as any).default.BLOCKS);
    } else {
      Blockly.setLocale(En);
      Blockly.setLocale((CustomEn as any).default.BLOCKS);
    }

    Blockly.registry.register(
      Blockly.registry.Type.TOOLBOX_ITEM,
      Blockly.ToolboxCategory.registrationName,
      CustomCategory,
      true);
  }

  static getWorkspace(blocklyDiv: HTMLElement, options: BlocklyOptions): Blockly.WorkspaceSvg {
    type ConstantProviderKey = keyof Blockly.blockRendering.ConstantProvider;
    const DUMMY_INPUT_MIN_HEIGHT: ConstantProviderKey = "DUMMY_INPUT_MIN_HEIGHT";
    const BOTTOM_ROW_AFTER_STATEMENT_MIN_HEIGHT: ConstantProviderKey = "BOTTOM_ROW_AFTER_STATEMENT_MIN_HEIGHT";

    options.toolbox = toolboxJson;
    options.comments = false;
    options.collapse = false;
    options.disable = false;
    options.sounds = false;
    options.maxInstances = {
      event_ball_mine: 1,
      event_ball_opponent: 1,
      event_ball_teammate: 1,
      event_ball_none: 1
    };
    options.renderer = 'zelos';
    options.rendererOverrides = {};
    options.rendererOverrides[DUMMY_INPUT_MIN_HEIGHT] = 0;
    options.rendererOverrides[BOTTOM_ROW_AFTER_STATEMENT_MIN_HEIGHT] = 0;

    return Blockly.inject(blocklyDiv, options);
  }

  computeCode(blocks: string): string {
    const workspace = new Blockly.Workspace();
    this.loadBlocksInWorkspace(blocks, workspace);
    const code = javascriptGenerator.workspaceToCode(workspace);
    workspace.dispose();
    return code;
  }

  loadBlocksInWorkspace(blocks: string, workspace: Blockly.Workspace) {
    if (blocks.startsWith('{')) {
      Blockly.serialization.workspaces.load(JSON.parse(blocks), workspace);
    } else {
      Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(blocks), workspace);
    }
  }

  getBlocksFromWorkspace(workspace: Blockly.Workspace): string {
    return JSON.stringify(Blockly.serialization.workspaces.save(workspace));
  }

  loadOppCode(online: boolean, opponentId: string): Promise<string> {
    return this.loadOppBlocks(online, opponentId)
      .then(blocks => this.computeCode(blocks));
  }

  loadOppBlocks(online: boolean, opponentId: string): Promise<string> {
    if (online) {
      return this.onlineService.loadUserBlocks(opponentId);
    } else {
      const oppXmlFile = 'assets/blocks/strategies/' + opponentId + '.json';
      return fetch(oppXmlFile)
        .then(response => response.text());
    }
  }

  loadOwnCode(): string {
    return this.computeCode(this.loadOwnBlocksFromLocalStorage());
  }

  loadOwnBlocksFromLocalStorage(): string {
    return this.localStorageService.loadBlocks();
  }

  loadOwnBlocksFromServer(): Promise<string> {
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
      // target can't be empty because of shadow block
      const target = javascriptGenerator.statementToCode(block, 'NAME');
      return `game.move(player, ${target}, false);`;
    };

    javascriptGenerator.sprint = (block: Blockly.Block) => {
      // target can't be empty because of shadow block
      const target = javascriptGenerator.statementToCode(block, 'NAME');
      return `game.move(player, ${target}, true);`;
    };

    javascriptGenerator.shoot = (block: Blockly.Block) => {
      // target can't be empty because of shadow block
      const target = javascriptGenerator.statementToCode(block, 'NAME');
      return `game.shoot(player, ${target})`;
    };

    javascriptGenerator.player = (block: Blockly.Block) => {
      // ref can't be empty because of shadow blocks
      const ref = javascriptGenerator.statementToCode(block, 'PLAYER_POS_REF');
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
      // pos1 can't be empty because of shadow blocks
      const pos1 = javascriptGenerator.statementToCode(block, 'POS1');
      // pos2 can't be empty because of shadow blocks
      const pos2 = javascriptGenerator.statementToCode(block, 'POS2');
      return `game.getMiddle(${pos1}, ${pos2})`;
    };

    javascriptGenerator.closest = (block: Blockly.Block) => {
      // ref can't be empty because of shadow block
      const ref = javascriptGenerator.statementToCode(block, 'NAME');
      return [`game.isClosest(player, ${ref})`, 0];
    };

    javascriptGenerator.distance = (block: Blockly.Block) => {
      // from can't be empty because of shadow blocks
      const from = javascriptGenerator.statementToCode(block, 'FROM');
      // to can't be empty because of shadow blocks
      const to = javascriptGenerator.statementToCode(block, 'TO');
      return [`game.getDistance(${from}, ${to})`, 0];
    };

    javascriptGenerator.role_and_side = (block: Blockly.Block) => {
      // player can't be empty because of shadow blocks
      const player = javascriptGenerator.statementToCode(block, 'PLAYER');
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
      // item can't be empty because of shadow block
      const item = javascriptGenerator.statementToCode(block, 'ITEM');
      return [`game.itemInGrid(!player.ownTeam,${item},${+block.getFieldValue('POS_COL')},${+block.getFieldValue('POS_ROW')})`, 0];

    };

    javascriptGenerator.energy = (block: Blockly.Block) => {
      // player can't be empty because of shadow block
      const player = javascriptGenerator.statementToCode(block, 'NAME');
      return [`(${player} === null ? null : ${player}.energy)`, 0];
    };

    // We can't use standard 'controls_ifelse' because an empty condition
    // is interpreted as false, whereas we don't want any action when
    // condition is empty or evaluated as null
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

    // We can't use standard 'logic_compare' because an empty member
    // is interpreted as 0, whereas we don't want any action when
    // there is any empty member or a member evaluated as null
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
