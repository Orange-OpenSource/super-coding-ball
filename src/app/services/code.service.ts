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
import Blockly from 'blockly';
import {BlocklyOptions} from 'blockly/core/blockly_options';
import blockStyles from '../../assets/blocks/styles/blockStyles.json';
import categoryStyles from '../../assets/blocks/styles/categoryStyles.json';
import componentStyles from '../../assets/blocks/styles/componentStyles.json';
import componentDarkStyles from '../../assets/blocks/styles/componentDarkStyles.json';
import blocksJson from '../../assets/blocks/blocks.json';
import {javascriptGenerator} from 'blockly/javascript';
import Fr from 'blockly/msg/fr';
import CustomFr from '../../assets/i18n/fr.json';
import Es from 'blockly/msg/es';
import CustomEs from '../../assets/i18n/es.json';
import Ru from 'blockly/msg/ru';
import CustomRu from '../../assets/i18n/ru.json';
import En from 'blockly/msg/en';
import CustomEn from '../../assets/i18n/en.json';
import He from 'blockly/msg/he';
import CustomHe from '../../assets/i18n/he.json';
import De from 'blockly/msg/de';
import CustomDe from '../../assets/i18n/de.json';
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
    // Delete math_number block because it will be redefined with field slider
    delete Blockly.Blocks['math_number'];

    // Initiated in the service because it can only be done once
    Blockly.defineBlocksWithJsonArray(blocksJson);

    // Disable contextual menu entry that enable/disable inlining (confusing for beginners)
    Blockly.ContextMenuRegistry.registry.unregister('blockInline');
    // Disable contextual menu entry with 'help' (otherwise enabled on standard blocks)
    Blockly.ContextMenuRegistry.registry.unregister('blockHelp');

    this.defineBlocksCodeGen();

    if (this.translate.currentLang === 'fr') {
      Blockly.setLocale(Fr);
      Blockly.setLocale(CustomFr.BLOCKS);
    } else if (this.translate.currentLang === 'es') {
      Blockly.setLocale(Es);
      Blockly.setLocale(CustomEs.BLOCKS);
    } else if (this.translate.currentLang === 'ru') {
      Blockly.setLocale(Ru);
      Blockly.setLocale(CustomRu.BLOCKS);
    } else if (this.translate.currentLang === 'he') {
      Blockly.setLocale(He);
      Blockly.setLocale(CustomHe.BLOCKS);
    } else if (this.translate.currentLang === 'de') {
      Blockly.setLocale(De);
      Blockly.setLocale(CustomDe.BLOCKS);
    } else {
      Blockly.setLocale(En);
      Blockly.setLocale(CustomEn.BLOCKS);
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
    options.maxTrashcanContents = 0;
    options.maxInstances = {
      event_ball_mine: 1,
      event_ball_opponent: 1,
      event_ball_teammate: 1,
      event_ball_none: 1
    };
    options.renderer = 'zelos';
    options.media = 'assets/blockly-media'
    options.rendererOverrides = {};
    options.rendererOverrides[DUMMY_INPUT_MIN_HEIGHT] = 0;
    options.rendererOverrides[BOTTOM_ROW_AFTER_STATEMENT_MIN_HEIGHT] = 0;
    options.rtl = document.dir === 'rtl';

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
      Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(blocks), workspace);
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
      const oppJsonFile = 'assets/blocks/strategies/' + opponentId + '.json';
      return fetch(oppJsonFile)
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
      return `if(game.ball.owner === player) {
${javascriptGenerator.statementToCode(block, 'DO')}
}`;
    };

    javascriptGenerator.event_ball_teammate = (block: Blockly.Block) => {
      return `if(game.ball.owner !== null && game.ball.owner.ownTeam === player.ownTeam && game.ball.owner !== player) {
${javascriptGenerator.statementToCode(block, 'DO')}
}`;
    };

    javascriptGenerator.event_ball_opponent = (block: Blockly.Block) => {
      return `if(game.ball.owner !== null && game.ball.owner.ownTeam !== player.ownTeam) {
${javascriptGenerator.statementToCode(block, 'DO')}
}`;
    };

    javascriptGenerator.event_ball_none = (block: Blockly.Block) => {
      return `if(game.ball.owner === null) {
${javascriptGenerator.statementToCode(block, 'DO')}
}`;
    };

    javascriptGenerator.move = (block: Blockly.Block) => {
      // target can't be empty because of shadow block
      const target = javascriptGenerator.statementToCode(block, 'NAME');
      return `game.move(player,${target},false);`;
    };

    javascriptGenerator.sprint = (block: Blockly.Block) => {
      // target can't be empty because of shadow block
      const target = javascriptGenerator.statementToCode(block, 'NAME');
      return `game.move(player,${target},true);`;
    };

    javascriptGenerator.shoot = (block: Blockly.Block) => {
      // target can't be empty because of shadow block
      const target = javascriptGenerator.statementToCode(block, 'NAME');
      return `game.shoot(player,${target});`;
    };

    javascriptGenerator.call_for_ball = (block: Blockly.Block) => {
      return `game.callForBall(player);`;
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
      return `game.getPlayer(player,${isOwnTeam},${isAtkRole},${isRightSide},${isNear},${ref})`;
    };

    javascriptGenerator.goal = (block: Blockly.Block) => {
      return `game.getGoal(player,${block.getFieldValue('GOAL_TYPE') === 'GOAL_OWN'})`;
    };

    javascriptGenerator.grid = (block: Blockly.Block) => {
      return `game.getGridPosition(!player.ownTeam,${+block.getFieldValue('GRID_COL')},${+block.getFieldValue('GRID_ROW')})`;
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
      return `game.getMiddle(${pos1},${pos2})`;
    };

    javascriptGenerator.closest = (block: Blockly.Block) => {
      // ref can't be empty because of shadow block
      const ref = javascriptGenerator.statementToCode(block, 'NAME');
      return [`game.isClosest(player,${ref})`, 0];
    };

    javascriptGenerator.distance = (block: Blockly.Block) => {
      // from can't be empty because of shadow blocks
      const from = javascriptGenerator.statementToCode(block, 'FROM');
      // to can't be empty because of shadow blocks
      const to = javascriptGenerator.statementToCode(block, 'TO');
      return [`game.getDistance(${from},${to})`, 0];
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
      return [`game.playerIsRoleAndSide(${player},${isAtkRole},${isRightSide})`, 0];
    };

    javascriptGenerator.place = (block: Blockly.Block) => {
      // item can't be empty because of shadow block
      const item = javascriptGenerator.statementToCode(block, 'ITEM');
      return [`game.itemInGrid(!player.ownTeam,${item},${+block.getFieldValue('POS_COL')},${+block.getFieldValue('POS_ROW')})`, 0];
    };

    javascriptGenerator.energy = (block: Blockly.Block) => {
      // player can't be empty because of shadow block
      const player = javascriptGenerator.statementToCode(block, 'NAME');
      return [`${player}.energy`, 0];
    };

    // We can't use standard 'controls_ifelse' because
    // we don't want anything else stacked below
    javascriptGenerator.custom_if = (block: Blockly.Block) => {
      let ifStatement = javascriptGenerator.valueToCode(block, 'IF', 0);
      // No shadow block on if statement
      if (!ifStatement) {
        ifStatement = false;
      }
      const thenStatement = javascriptGenerator.statementToCode(block, 'THEN');
      const elseStatement = javascriptGenerator.statementToCode(block, 'ELSE');

      return `if(${ifStatement}) {
${thenStatement}
} else {
${elseStatement}
}`;
    };

    // We don't standard 'logic_compare' because we only want < and >
    javascriptGenerator.custom_compare = (block: Blockly.Block) => {
      let left = javascriptGenerator.valueToCode(block, 'LEFT', 0);
      // No shadow block on left statement
      if (!left) {
        left = 0;
      }
      // right can't be empty because of shadow block
      const right = javascriptGenerator.valueToCode(block, 'RIGHT', 0);
      if (block.getFieldValue('INEQUALITY') === 'LOWER') {
        return [`${left} < ${right}`, 0];
      } else {
        return [`${left} > ${right}`, 0];
      }
    };

    javascriptGenerator.elapsed_time = (block: Blockly.Block) => {
      return [`game.gameTime`, 0];
    };

    javascriptGenerator.leading_team = (block: Blockly.Block) => {
      if (block.getFieldValue('TEAM') === 'TEAM_OWN') {
        return [`game.ownScore > game.oppScore`, 0];
      } else if (block.getFieldValue('TEAM') === 'TEAM_OPP') {
        return [`game.ownScore < game.oppScore`, 0];
      } else {
        return [`game.ownScore == game.oppScore`, 0];
      }
    };
  }
}
