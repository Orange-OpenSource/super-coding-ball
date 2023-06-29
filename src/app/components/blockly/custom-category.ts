/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// See https://blocklycodelabs.dev/codelabs/custom-toolbox/index.html
// Adapted from https://github.com/google/blockly-samples/blob/master/examples/custom-toolbox-codelab/complete-code/custom_category_es6.js

import Blockly from 'blockly';

export class CustomCategory extends Blockly.ToolboxCategory {
  constructor(categoryDef: Blockly.utils.toolbox.CategoryInfo,
              toolbox: Blockly.IToolbox,
              optParent: Blockly.ICollapsibleToolboxItem | undefined) {
    super(categoryDef, toolbox, optParent);
  }

  addColourBorder_(colour: any): void {
    this.rowDiv_!.style.backgroundColor = colour;
  }

  setSelected(isSelected: boolean): void {
    super.setSelected(isSelected);
    this.refreshTheme();
  }
}
