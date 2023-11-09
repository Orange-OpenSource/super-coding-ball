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
import Blockly, {BlockSvg, Events, Extensions} from 'blockly';
import {BlocklyOptions} from 'blockly/core/blockly_options';
import blockStyles from '../../assets/blocks/styles/blockStyles.json';
import categoryStyles from '../../assets/blocks/styles/categoryStyles.json';
import componentStyles from '../../assets/blocks/styles/componentStyles.json';
import componentDarkStyles from '../../assets/blocks/styles/componentDarkStyles.json';
import blocksJson from '../../assets/blocks/blocks.json';
import {javascriptGenerator, Order} from 'blockly/javascript';
import {TranslateService} from '@ngx-translate/core';
import {OnlineService} from './online.service';
import {LocalStorageService} from './local-storage.service';
import {CustomCategory} from '../components/blockly/custom-category';
import toolboxJson from '../../assets/blocks/toolbox.json';
import {SupportedLanguagesServices} from './supported_languages_service';

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
    private supportedLanguagesService: SupportedLanguagesServices,
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

    // Hide the near/far field from 'player' block, when the player is already fully determined by its role and side
    Extensions.register('player_needs_a_reference_position_extension', function (this: BlockSvg) {
      this.setOnChange((event) => {
        // Executed when the block created...
        if (event instanceof Events.BlockCreate && event.ids?.includes(this.id) ||
          // ...or when the block's role or side fields are modified
          event instanceof Events.BlockChange
          && event.blockId === this.id
          && event.element === "field"
          && (event.name === "PLAYER_ROLE" || event.name === "PLAYER_SIDE")) {
          const playerNeedsAReferencePosition = this.getFieldValue("PLAYER_ROLE") === "PLAYER_ROLE_ALL" || this.getFieldValue("PLAYER_SIDE") === "PLAYER_SIDE_ALL";
          // setVisible may change in the future, see: https://groups.google.com/g/blockly/c/hPNZbxeGLR4/m/d3P4K_UxCAAJ
          this.getInput("PLAYER_POS_REF")?.setVisible(playerNeedsAReferencePosition);
          // Re-render the block because its size may have changed
          this.render();
        }
      });
    });

    let lang = supportedLanguagesService.getCurrentLang().lang
    Blockly.setLocale(lang.blocklyDefaultLocale);
    Blockly.setLocale(lang.blocklyCustomLocale);

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
    javascriptGenerator.forBlock['event_ball_mine'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      return `if (game.ball.owner === player) {
${generator.statementToCode(block, 'DO')}
  return;
}`;
    };

    javascriptGenerator.forBlock['event_ball_teammate'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      return `if (game.ball.owner !== null && game.ball.owner.ownTeam === player.ownTeam && game.ball.owner !== player) {
${generator.statementToCode(block, 'DO')}
  return;
}`;
    };

    javascriptGenerator.forBlock['event_ball_opponent'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      return `if (game.ball.owner !== null && game.ball.owner.ownTeam !== player.ownTeam) {
${generator.statementToCode(block, 'DO')}
  return;
}`;
    };

    javascriptGenerator.forBlock['event_ball_none'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      return `if (game.ball.owner === null) {
${generator.statementToCode(block, 'DO')}
  return;
}`;
    };

    javascriptGenerator.forBlock['move'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      // target can't be empty because of shadow block
      const target = generator.valueToCode(block, 'NAME', Order.NONE);
      return `game.move(player, ${target}, false);`;
    };

    javascriptGenerator.forBlock['sprint'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      // target can't be empty because of shadow block
      const target = generator.valueToCode(block, 'NAME', Order.NONE);
      return `game.move(player, ${target}, true);`;
    };

    javascriptGenerator.forBlock['shoot'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      // target can't be empty because of shadow block
      const target = generator.valueToCode(block, 'NAME', Order.NONE);
      return `game.shoot(player, ${target});`;
    };

    javascriptGenerator.forBlock['call_for_ball'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      return `game.callForBall(player);`;
    };

    javascriptGenerator.forBlock['player'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      // ref can't be empty because of shadow blocks
      const ref = generator.valueToCode(block, 'PLAYER_POS_REF', Order.NONE);
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
      return [`game.getPlayer(player, ${isOwnTeam}, ${isAtkRole}, ${isRightSide}, ${isNear}, ${ref})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['goal'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      return [`game.getGoal(player, ${block.getFieldValue('GOAL_TYPE') === 'GOAL_OWN'})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['grid'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      let col = +block.getFieldValue('GRID_COL');
      let row = +block.getFieldValue('GRID_ROW');
      return [`game.getGridPosition(!player.ownTeam, ${col}, ${row})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['ball'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      return [`game.ball.coord`, Order.MEMBER];
    };

    javascriptGenerator.forBlock['myself'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      return [`player`, Order.ATOMIC];
    };

    javascriptGenerator.forBlock['position'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      return [`game.getTargetPosition(player)`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['middle'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      // pos1 can't be empty because of shadow blocks
      const pos1 = generator.valueToCode(block, 'POS1', Order.NONE);
      // pos2 can't be empty because of shadow blocks
      const pos2 = generator.valueToCode(block, 'POS2', Order.NONE);
      return [`game.getMiddle(${pos1}, ${pos2})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['closest'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      // ref can't be empty because of shadow block
      const ref = generator.valueToCode(block, 'NAME', Order.NONE);
      return [`game.isClosest(player, ${ref})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['distance'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      // from can't be empty because of shadow blocks
      const from = generator.valueToCode(block, 'FROM', Order.NONE);
      // to can't be empty because of shadow blocks
      const to = generator.valueToCode(block, 'TO', Order.NONE);
      return [`game.getDistance(${from}, ${to})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['role_and_side'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      // player can't be empty because of shadow blocks
      const player = generator.valueToCode(block, 'PLAYER', Order.NONE);
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
      return [`game.playerIsRoleAndSide(${player}, ${isAtkRole}, ${isRightSide})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['place'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      // item can't be empty because of shadow block
      const item = generator.valueToCode(block, 'ITEM', Order.NONE);
      let col = +block.getFieldValue('POS_COL');
      let row = +block.getFieldValue('POS_ROW');
      return [`game.itemInGrid(!player.ownTeam, ${item}, ${col}, ${row})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['energy'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      // player can't be empty because of shadow block
      const player = generator.valueToCode(block, 'NAME', Order.MEMBER);
      return [`${player}.energy`, Order.MEMBER];
    };

    // We can't use standard 'controls_ifelse' because
    // we don't want anything else stacked below
    javascriptGenerator.forBlock['custom_if'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      // No shadow block on if statement
      let ifStatement = generator.valueToCode(block, 'IF', Order.NONE) || 'false';
      const thenStatement = generator.statementToCode(block, 'THEN');
      const elseStatement = generator.statementToCode(block, 'ELSE');

      return `if (${ifStatement}) {
${thenStatement}
} else {
${elseStatement}
}`;
    };

    // We don't use standard 'logic_compare' because we only want < and >
    javascriptGenerator.forBlock['custom_compare'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      // No shadow block on left statement
      let left = generator.valueToCode(block, 'LEFT', Order.RELATIONAL) || '0';
      // right can't be empty because of shadow block
      const right = generator.valueToCode(block, 'RIGHT', Order.RELATIONAL);
      if (block.getFieldValue('INEQUALITY') === 'LOWER') {
        return [`${left} < ${right}`, Order.RELATIONAL];
      } else {
        return [`${left} > ${right}`, Order.RELATIONAL];
      }
    };

    javascriptGenerator.forBlock['elapsed_time'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      return [`game.gameTime`, Order.MEMBER];
    };

    javascriptGenerator.forBlock['leading_team'] = (block: Blockly.Block, generator: Blockly.CodeGenerator) => {
      if (block.getFieldValue('TEAM') === 'TEAM_OWN') {
        return [`game.ownScore > game.oppScore`, Order.RELATIONAL];
      } else if (block.getFieldValue('TEAM') === 'TEAM_OPP') {
        return [`game.ownScore < game.oppScore`, Order.RELATIONAL];
      } else {
        return [`game.ownScore == game.oppScore`, Order.EQUALITY];
      }
    };
  }
}
