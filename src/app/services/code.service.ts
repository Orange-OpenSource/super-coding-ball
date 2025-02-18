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
import {Block, BlocklyOptions, Blocks, BlockSvg, ContextMenuRegistry, Events, Extensions, Theme, ToolboxCategory, Workspace, WorkspaceSvg, Xml} from 'blockly';
// Not used until https://github.com/google/blockly-samples/issues/2035 is fixed
// import {blocks as procedureBlocks, unregisterProcedureBlocks} from '@blockly/block-shareable-procedures';
import blockStyles from '../../assets/blocks/styles/blockStyles.json';
import blockDisabledStyles from '../../assets/blocks/styles/blockDisabledStyles.json';
import categoryStyles from '../../assets/blocks/styles/categoryStyles.json';
import componentStyles from '../../assets/blocks/styles/componentStyles.json';
import componentDarkStyles from '../../assets/blocks/styles/componentDarkStyles.json';
import blocksJson from '../../assets/blocks/blocks.json';
import {javascriptGenerator, JavascriptGenerator, Order} from 'blockly/javascript';
import {OnlineService} from './online.service';
import {LocalStorageService} from './local-storage.service';
import {CustomCategory} from '../components/blockly/custom-category';
import toolboxJson from '../../assets/blocks/toolbox.json';
import {SupportedLanguagesServices} from './supported-languages-service';

export class RecursiveActionEvent extends Events.Abstract {
  override isBlank = false;
  override recordUndo = false;
  override type = "RecursiveAction";
  recursiveActionName: string;
  constructor(actionName: string) {
    super();
    this.recursiveActionName = actionName;
  }
}

// Part of the JSON format of Blockly's serializer
type BlockJson = {
  type: string,
  id: string,
  extraState?: {name?: string},
  fields?: {NAME?: string},
  inputs?: {[input: string]: {block?: BlockJson}}
};

@Injectable({
  providedIn: 'root'
})
export class CodeService {
  customEditingTheme = Blockly.Theme.defineTheme('customEditingTheme', {
    name: 'editingTheme',
    blockStyles,
    categoryStyles,
    componentStyles,
    startHats: true
  });
  customViewingTheme = Blockly.Theme.defineTheme('customViewingTheme', {
    name: 'viewingTheme',
    blockStyles: blockDisabledStyles,
    categoryStyles,
    componentStyles: componentDarkStyles,
    startHats: true
  });
  customHowToTheme = Blockly.Theme.defineTheme('customHowToTheme', {
    name: 'howToTheme',
    blockStyles,
    categoryStyles,
    componentStyles: componentDarkStyles,
    startHats: true
  });

  constructor(
    private supportedLanguagesService: SupportedLanguagesServices,
    private localStorageService: LocalStorageService,
    private onlineService: OnlineService
  ) {
  }

  async init() {
    // Delete math_number block because it will be redefined with field slider
    delete Blocks['math_number'];

    Blockly.defineBlocksWithJsonArray(blocksJson);

    // Procedure blocks from the plugin block-shareable-procedures have a bug
    // that reenable them when deserialized, or renamed: https://github.com/google/blockly-samples/issues/2035
    // So for now, we use the core procedure blocks even if the documentation advises against it!
    // unregisterProcedureBlocks();
    // Blockly.common.defineBlocks(procedureBlocks)

    // Procedures with return values are not used
    delete Blocks['procedures_defreturn'];
    delete Blocks['procedures_ifreturn'];

    // Remove the mutator from the procedure definition block because we don't want inputs
    var proceduresDefInit = Blocks['procedures_defnoreturn'].init;
    Blocks['procedures_defnoreturn'].init = function () {
      proceduresDefInit.call(this);
      this.hat = 'anything_other_than_cap';
      this.setMutator(undefined);
    };

    // As all actions, procedure call blocks can't have a next statement
    var proceduresCallInit = Blocks['procedures_callnoreturn'].init;
    Blocks['procedures_callnoreturn'].init = function () {
      proceduresCallInit.call(this);
      this.setNextStatement(false);
    };

    // Disable contextual menu entry that enable/disable inlining (confusing for beginners)
    ContextMenuRegistry.registry.unregister('blockInline');

    // Disable contextual menu entry with 'help' (otherwise enabled on standard blocks)
    ContextMenuRegistry.registry.unregister('blockHelp');

    // Those are the only two parameters available from the executed code (in executePlayerCode())
    javascriptGenerator.addReservedWords('game,player');

    javascriptGenerator.STATEMENT_PREFIX = 'game.useBlock(player, %1);\n';

    this.defineBlocksCodeGen();

    // Hide the near/far field from 'player' block, when the player is already fully determined by its role and side
    Extensions.register('player_needs_a_reference_position_extension', function (this: BlockSvg) {
      this.setOnChange((event) => {
        // Executed when the block is created...
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

    const currentLang = await this.supportedLanguagesService.getCurrentLangFiles();
    Blockly.setLocale(currentLang.blocklyDefaultLocale as unknown as { [key: string]: string });
    Blockly.setLocale(currentLang.blocklyCustomLocale as { [key: string]: string });

    Blockly.registry.register(
      Blockly.registry.Type.TOOLBOX_ITEM,
      ToolboxCategory.registrationName,
      CustomCategory,
      true);
  }

  getWorkspace(blocklyDiv: HTMLElement, options: BlocklyOptions): WorkspaceSvg {
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
    Blockly.config.snapRadius = 48;
    Blockly.config.connectingSnapRadius = 68;

    const workspace = Blockly.inject(blocklyDiv, options);

    workspace.addChangeListener(Events.disableOrphans);

    // The check for recursive actions could be done with by Blockly's INFINITE_LOOP_TRAP,
    // but then it would only be caught when launching a game.
    // With this listener, the check is done while building the strategy:
    // - it only checks for recursive functions and not loops, because there is no loop block!
    // - every recursive function is forbidden because there is no variable, so no way to exit the recursion
    workspace.addChangeListener(CodeService.RecursiveActionsDetector);

    return workspace;
  }

  private static RecursiveActionsDetector(event: Events.Abstract) {
    // Only moves that connect blocks can lead to recursive actions
    if (!(event instanceof Events.BlockMove) || !event.reason?.includes('connect')) {
      return;
    }

    if (!event.blockId) {
      return;
    }

    const workspace = event.getEventWorkspace_();
    const movedBlock = workspace?.getBlockById(event.blockId);
    if (!movedBlock) {
      return;
    }

    // The recursive action can be any descendant of the moved block
    const movedActionBlocks: Block[] = CodeService.getBlockAndItsDescendants(movedBlock)
      .filter(block => block.type == 'procedures_callnoreturn');
    if (movedActionBlocks.length == 0) {
      return;
    }

    // Get the serialization of the workspace once, needed to link def of call blocks to their action name
    const blocksJsonHierarchy = Blockly.serialization.workspaces.save(workspace)['blocks'].blocks;
    const actionNames = movedActionBlocks.map(block =>
      CodeService.findJsonBlockByBlockIdOrProcedureName(block.id, true, blocksJsonHierarchy)[0]?.extraState?.name ?? ''
    );

    try {
      CodeService.checkForRecursiveActions(movedActionBlocks, actionNames, workspace, blocksJsonHierarchy)
    } catch (error) {
      workspace.fireChangeListener(new RecursiveActionEvent(error as string))
    }
  }

  private static getBlockAndItsDescendants(block: Block): Block[] {
    return [block].concat(...block.getChildren(false)
      .flatMap(child => CodeService.getBlockAndItsDescendants(child)))
  }

  // Check recursively from blocks to their ascendents, and throw and error if we find their own definition block
  private static checkForRecursiveActions(blocksToParse: Block[], actionsEncountered: string[], workspace: Workspace, blocksJsonHierarchy: BlockJson[]): void {
    blocksToParse.map(block => {
      // If we find a definition block
      if (block.type == 'procedures_defnoreturn') {
        const actionName = CodeService.findJsonBlockByBlockIdOrProcedureName(block.id, true, blocksJsonHierarchy)[0]?.fields?.NAME ?? '';
        // If we've already seen the call block, this is a recursion, throw an error
        if (actionsEncountered.includes(actionName)) {
          throw (actionName);
        // Otherwise, if it's the first time we see this action name
        } else {
          // Get the call blocks (if any) of this action
          const actionCallBlocks = CodeService.findJsonBlockByBlockIdOrProcedureName(actionName, false, blocksJsonHierarchy)
            .map(blockJson => workspace?.getBlockById(blockJson.id))
            .filter((block): block is Block => !!block);
          // And continue the check with these blocks and add the action name to the ones we're looking for
          return CodeService.checkForRecursiveActions(actionCallBlocks, actionsEncountered.concat(actionName), workspace, blocksJsonHierarchy);
        }
      // If this is not a definition block, continue the check with its parent (if any)
      } else {
        const parent = block.getParent();
        if (parent) {
          return CodeService.checkForRecursiveActions([parent], actionsEncountered, workspace, blocksJsonHierarchy);
        }
      }
    });
  }

  // Search recursively for a block by its blockId or procedure name
  private static findJsonBlockByBlockIdOrProcedureName(identifier: string, isBlockId: boolean, blocksJsonHierarchy: BlockJson[]): BlockJson[] {
    let found: BlockJson[] = [];
    if (blocksJsonHierarchy.length == 0) {
      return found;
    }
    // Search in the top level blocks
    if (isBlockId) {
      found.push(...blocksJsonHierarchy.filter(block => block.id == identifier));
    } else {
      found.push(...blocksJsonHierarchy.filter(block => block.type == 'procedures_callnoreturn' && block.extraState?.name == identifier));
    }

    // Then search in their input blocks
    found.push(...this.findJsonBlockByBlockIdOrProcedureName(identifier, isBlockId,
      blocksJsonHierarchy.map(block => block.inputs ?? {})
        .flatMap(input => Object.values(input))
        .map(inputBlock => inputBlock.block)
        .filter((block): block is BlockJson => !!block)))
    return found;
  }

  private static computeCode(blocks: string): string {
    const workspace = new Workspace();
    CodeService.loadBlocksInWorkspace(blocks, workspace);
    const code = javascriptGenerator.workspaceToCode(workspace);
    workspace.dispose();
    return code;
  }

  static loadBlocksInWorkspace(blocks: string, workspace: Workspace) {
    if (blocks.startsWith('{')) {
      Blockly.serialization.workspaces.load(JSON.parse(blocks), workspace);
    } else {
      Xml.domToWorkspace(Blockly.utils.xml.textToDom(blocks), workspace);
    }
  }

  static getBlocksFromWorkspace(workspace: Workspace): string {
    return JSON.stringify(Blockly.serialization.workspaces.save(workspace));
  }

  async loadOppCode(online: boolean, opponentId: string): Promise<string> {
    const blocks = await this.loadOppBlocks(online, opponentId);
    return CodeService.computeCode(blocks);
  }

  async loadOppBlocks(online: boolean, opponentId: string): Promise<string> {
    if (online) {
      return await this.onlineService.loadUserBlocks(opponentId);
    } else {
      const oppJsonFile = 'assets/blocks/strategies/' + opponentId + '.json';
      const response = await fetch(oppJsonFile);
      return await response.text();
    }
  }

  loadOwnCode(): string {
    return CodeService.computeCode(this.loadOwnBlocksFromLocalStorage());
  }

  loadOwnBlocksFromLocalStorage(): string {
    return this.localStorageService.loadBlocks();
  }

  loadOwnBlocksFromServer(): Promise<string> {
    return this.onlineService.loadUserBlocks(this.onlineService.webcomId);
  }

  private defineBlocksCodeGen(): void {
    javascriptGenerator.forBlock['event_ball_mine'] = (block: Block, generator: JavascriptGenerator) => {
      return `if (game.ball.owner === player) {
${generator.statementToCode(block, 'DO')}
  return;
}`;
    };

    javascriptGenerator.forBlock['event_ball_teammate'] = (block: Block, generator: JavascriptGenerator) => {
      return `if (game.ball.owner !== null && game.ball.owner.ownTeam === player.ownTeam && game.ball.owner !== player) {
${generator.statementToCode(block, 'DO')}
  return;
}`;
    };

    javascriptGenerator.forBlock['event_ball_opponent'] = (block: Block, generator: JavascriptGenerator) => {
      return `if (game.ball.owner !== null && game.ball.owner.ownTeam !== player.ownTeam) {
${generator.statementToCode(block, 'DO')}
  return;
}`;
    };

    javascriptGenerator.forBlock['event_ball_none'] = (block: Block, generator: JavascriptGenerator) => {
      return `if (game.ball.owner === null) {
${generator.statementToCode(block, 'DO')}
  return;
}`;
    };

    javascriptGenerator.forBlock['move'] = (block: Block, generator: JavascriptGenerator) => {
      // target can't be empty because of shadow block
      const target = generator.valueToCode(block, 'NAME', Order.NONE);
      return `game.move(player, ${target}, false);`;
    };

    javascriptGenerator.forBlock['sprint'] = (block: Block, generator: JavascriptGenerator) => {
      // target can't be empty because of shadow block
      const target = generator.valueToCode(block, 'NAME', Order.NONE);
      return `game.move(player, ${target}, true);`;
    };

    javascriptGenerator.forBlock['shoot'] = (block: Block, generator: JavascriptGenerator) => {
      // target can't be empty because of shadow block
      const target = generator.valueToCode(block, 'NAME', Order.NONE);
      return `game.shoot(player, ${target});`;
    };

    javascriptGenerator.forBlock['call_for_ball'] = (block: Block, generator: JavascriptGenerator) => {
      return `game.callForBall(player);`;
    };

    javascriptGenerator.forBlock['player'] = (block: Block, generator: JavascriptGenerator) => {
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

    javascriptGenerator.forBlock['goal'] = (block: Block, generator: JavascriptGenerator) => {
      return [`game.getGoal(player, ${block.getFieldValue('GOAL_TYPE') === 'GOAL_OWN'})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['grid'] = (block: Block, generator: JavascriptGenerator) => {
      let col = +block.getFieldValue('GRID_COL');
      let row = +block.getFieldValue('GRID_ROW');
      return [`game.getGridPosition(!player.ownTeam, ${col}, ${row})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['ball'] = (block: Block, generator: JavascriptGenerator) => {
      return [`game.ball.coord`, Order.MEMBER];
    };

    javascriptGenerator.forBlock['myself'] = (block: Block, generator: JavascriptGenerator) => {
      return [`player`, Order.ATOMIC];
    };

    javascriptGenerator.forBlock['position'] = (block: Block, generator: JavascriptGenerator) => {
      return [`game.getTargetPosition(player)`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['middle'] = (block: Block, generator: JavascriptGenerator) => {
      // pos1 can't be empty because of shadow blocks
      const pos1 = generator.valueToCode(block, 'POS1', Order.NONE);
      // pos2 can't be empty because of shadow blocks
      const pos2 = generator.valueToCode(block, 'POS2', Order.NONE);
      return [`game.getMiddle(${pos1}, ${pos2})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['closest'] = (block: Block, generator: JavascriptGenerator) => {
      // ref can't be empty because of shadow block
      const ref = generator.valueToCode(block, 'NAME', Order.NONE);
      return [`game.isClosest(player, ${ref})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['distance'] = (block: Block, generator: JavascriptGenerator) => {
      // from can't be empty because of shadow blocks
      const from = generator.valueToCode(block, 'FROM', Order.NONE);
      // to can't be empty because of shadow blocks
      const to = generator.valueToCode(block, 'TO', Order.NONE);
      return [`game.getDistance(${from}, ${to})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['role_and_side'] = (block: Block, generator: JavascriptGenerator) => {
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

    javascriptGenerator.forBlock['place'] = (block: Block, generator: JavascriptGenerator) => {
      // item can't be empty because of shadow block
      const item = generator.valueToCode(block, 'ITEM', Order.NONE);
      let col = +block.getFieldValue('POS_COL');
      let row = +block.getFieldValue('POS_ROW');
      return [`game.itemInGrid(!player.ownTeam, ${item}, ${col}, ${row})`, Order.FUNCTION_CALL];
    };

    javascriptGenerator.forBlock['energy'] = (block: Block, generator: JavascriptGenerator) => {
      // player can't be empty because of shadow block
      const player = generator.valueToCode(block, 'NAME', Order.MEMBER);
      return [`${player}.energy`, Order.MEMBER];
    };

    // We can't use standard 'controls_ifelse' because
    // we don't want anything else stacked below
    javascriptGenerator.forBlock['custom_if'] = (block: Block, generator: JavascriptGenerator) => {
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
    javascriptGenerator.forBlock['custom_compare'] = (block: Block, generator: JavascriptGenerator) => {
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

    javascriptGenerator.forBlock['elapsed_time'] = (block: Block, generator: JavascriptGenerator) => {
      return [`game.gameTime`, Order.MEMBER];
    };

    javascriptGenerator.forBlock['leading_team'] = (block: Block, generator: JavascriptGenerator) => {
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
