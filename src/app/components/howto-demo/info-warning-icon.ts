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

import * as Blockly from 'blockly';
import {Block, BlockSvg} from "blockly";

export class InfoWarningIcon extends Blockly.icons.WarningIcon {
    constructor(protected readonly block: Block) {
        super(block as BlockSvg);
    }

    override getType() {
        return new Blockly.icons.IconType('info');
    }

    override initView(pointerdownListener: (e: PointerEvent) => void) {
        if (this.svgRoot) return;
        super.initView(pointerdownListener);
        // Remove warning icon first (composed of 3 SVG nodes)
        Blockly.utils.dom.removeNode(this.svgRoot!.children[0])
        Blockly.utils.dom.removeNode(this.svgRoot!.children[0])
        Blockly.utils.dom.removeNode(this.svgRoot!.children[0])
        Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.IMAGE,
            {
                'href': 'assets/icons/own.png',
                'class': 'info-icon oriented-icon',
            },
            this.svgRoot
        );
    }

    override getSize(): Blockly.utils.Size {
      return new Blockly.utils.Size(24, 24);
    }
}
