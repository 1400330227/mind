export interface LayoutData {
    offsetX?: number;
    offsetY?: number;
    outerHeight?: number;
    leftNodes?: Array<MindNode>;
    rightNodes?: Array<MindNode>;
    outerHeightLeft?: number;
    outerHeightRight?: number;
    direction?: number;
    sideIndex?: number;
    visible?: boolean;
    _offset_?: { x: number, y: number; };
    _pointOut_?: { x: number, y: number; };
}
export interface View {
    element: HTMLElement;
    height?: number;
    width?: number;
    absX?: number;
    absY?: number;
    expander?: any;
    saveLocation?: { x: number, y: number; };
}
export interface _Data {
    layout?: LayoutData;
    view?: View;
}
export class MindNode {
    id: string;
    index: number;
    topic: string;
    data: any;
    isroot: boolean;
    parent: MindNode;
    direction: any;
    expanded: boolean;
    children: MindNode[];
    _data: _Data;

    constructor(sId: string, iIndex: number, sTopic: string, oData: Object = {}, bIsRoot: boolean, oParent?: MindNode, eDirection?: any, bExpanded?: boolean) {
        this.id = sId;
        this.index = iIndex;
        this.topic = sTopic;
        this.data = oData;
        this.isroot = bIsRoot;
        this.parent = oParent;
        this.direction = eDirection;
        this.expanded = bExpanded;
        this.children = [];
        this._data = {};
    }

    static compare(node1: MindNode, node2: MindNode): number {
        let result = 0;
        const i1 = node1.index;
        const i2 = node2.index;

        if (i1 >= 0 && i2 >= 0) {
            result = i1 - i2;
        } else if (i1 == -1 && i2 == -1) {
            result = 0;
        } else if (i1 == -1) {
            result = 1;
        } else if (i2 == -1) {
            result = -1;
        } else {
            result = 0;
        }
        return result;
    }

    static inherited(parentNode: MindNode, node: MindNode): boolean {
        if (parentNode.id === node.id) {
            return true;
        }

        if (parentNode.isroot) {
            return true;
        }

        const pid = parentNode.id;
        let p = node;

        while (!p.isroot) {
            p = p.parent;
            if (p.id === pid) {
                return true;
            }
        }

        return false;
    }

    getLocation() {
        const view = this._data.view;
        return {
            x: view.absX,
            y: view.absY
        };
    }

    getSize() {
        const view = this._data.view;
        return {
            w: view.width,
            h: view.height
        };
    }

} 