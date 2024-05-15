/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// See https://blocklycodelabs.dev/codelabs/custom-toolbox/index.html
// Adapted from https://github.com/google/blockly-samples/blob/master/examples/custom-toolbox-codelab/complete-code/custom_category_es6.js

import * as Blockly from 'blockly';
import {ICollapsibleToolboxItem, IToolbox, ToolboxCategory} from 'blockly';

export class CustomCategory extends ToolboxCategory {
  constructor(categoryDef: Blockly.utils.toolbox.CategoryInfo,
              toolbox: IToolbox,
              optParent: ICollapsibleToolboxItem | undefined) {
    super(categoryDef, toolbox, optParent);
  }

  override addColourBorder_(colour: any): void {
    this.rowDiv_!.style.backgroundColor = colour;
  }

  override setSelected(isSelected: boolean): void {
    super.setSelected(isSelected);
    this.refreshTheme();
  }
}
