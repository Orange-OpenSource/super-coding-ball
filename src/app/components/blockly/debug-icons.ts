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

import Blockly from 'blockly';

// From https://developers.google.com/blockly/guides/create-custom-blocks/icons/creating-custom-icons/basic-implementation
export abstract class DebugIcon extends Blockly.icons.Icon {
    abstract iconType: string;
    abstract imageAsset: string;
    abstract weight: number;

    constructor(sourceBlock: Blockly.Block) {
        super(sourceBlock);
    }

    override getType() {
        return new Blockly.icons.IconType(this.iconType);
    }

    override initView(pointerdownListener: (e: PointerEvent) => void) {
        if (this.svgRoot) return;
        super.initView(pointerdownListener);

        Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.IMAGE,
            {
                'href': this.imageAsset,
                'x': '0',
                'y': '0',
                'height': '32',
                'width': '32'
            },
            this.svgRoot
        );
    }
    override getSize() {
        return new Blockly.utils.Size(32, 32);
    }
    override getWeight() {
        return this.weight;
    }
}

export interface IDebugIcon {
    new(block: Blockly.Block): DebugIcon;
}

export class Girl1Icon extends DebugIcon {
    override iconType = 'Girl1Icon';
    override imageAsset = 'assets/howto/girl1.png';
    override weight = 1;
}

export class Guy1Icon extends DebugIcon {
    override iconType = 'Guy1Icon';
    override imageAsset = 'assets/howto/guy1.png';
    override weight = 2;
}

export class Girl2Icon extends DebugIcon {
    override iconType = 'Girl2Icon';
    override imageAsset = 'assets/howto/girl2.png';
    override weight = 3;
}

export class Guy2Icon extends DebugIcon {
    override iconType = 'Guy2Icon';
    override imageAsset = 'assets/howto/guy2.png';
    override weight = 4;
}