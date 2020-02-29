import { JsMind, Options } from "./jsMind";
import { MindNode, LayoutData, _Data, View } from "./node";
import { Mind } from "./mind";

export class LayoutProvider {

    options?: Options;
    jsMind?: JsMind;
    isSide?: boolean;
    bounds: { n?: number, s?: number, w?: number, e?: number } = null;
    cacheValid: boolean;

    constructor(jsMind: JsMind, options: Options) {
        this.jsMind = jsMind;
        this.options = options;
        this.isSide = this.options.mode === 'side';
        this.cacheValid = false;
    }

    init() {
        console.log('布局，初始化')
    }

    reset() {
        console.log('布局，重置')
        this.layoutDirection();
        this.bounds = { n: 0, s: 0, w: 0, e: 0 };
    }

    layout() {
        console.log(`布局,布局`)
        this.layoutDirection();
        this.layoutOffset();
    }

    layoutDirection() {
        this.layoutDirectionRoot();
    }

    /**
     * 设定根节点布局
     */
    layoutDirectionRoot() {
        const node: MindNode = this.jsMind.mind.root;
        let layoutData: any = null;

        if ((node._data as Object).hasOwnProperty('layout')) {
            layoutData = node._data.layout;
        } else {
            layoutData = {};
            node._data.layout = layoutData;
        }

        const children = node.children;
        let childrenCount = children.length;
        layoutData.direction = JsMind.direction.center;
        layoutData.sideIndex = 0;

        if (this.isSide) {
            let i = childrenCount;
            while (i--) {
                this.layoutDirectionSide(children[i], JsMind.direction.right, i);
            }
        } else {
            let i = childrenCount;
            let subNode: MindNode = null;

            while (i--) {
                subNode = children[i];

                if (subNode.direction === JsMind.direction.left) {
                    this.layoutDirectionSide(subNode, JsMind.direction.left, i);
                } else {
                    this.layoutDirectionSide(subNode, JsMind.direction.right, i);
                }
            }
        }
    }

    /**
     * 设定节点左右两边位置
     * @param node mind数据源的节点
     * @param direction 方向
     * @param sideIndex 索引
     */
    layoutDirectionSide(node: MindNode, direction: number, sideIndex: number) {
        let layoutData = null;

        if ((node._data as Object).hasOwnProperty('layout')) {
            layoutData = node._data.layout;
        } else {
            layoutData = {};
            node._data.layout = layoutData;
        }

        const children = node.children;
        let childrenCount = children.length;
        layoutData.direction = direction;
        layoutData.sideIndex = sideIndex;

        let i = childrenCount;
        while (i--) {
            this.layoutDirectionSide(children[i], direction, i);
        }

    }

    layoutOffset() {
        const node: MindNode = this.jsMind.mind.root;

        const layoutData: LayoutData = node._data.layout;
        layoutData.offsetX = 0;
        layoutData.offsetY = 0;
        layoutData.outerHeight = 0;
        const children: MindNode[] = node.children;

        const leftNodes: MindNode[] = [];
        const rightNodes: MindNode[] = [];
        let subNode: MindNode = null;

        let i = children.length;
        while (i--) {
            subNode = children[i];
            if (subNode._data.layout.direction === JsMind.direction.right) {
                rightNodes.unshift(subNode);
            } else {
                leftNodes.unshift(subNode);
            }
        }

        layoutData.leftNodes = leftNodes;
        layoutData.rightNodes = rightNodes;
        layoutData.outerHeightLeft = this.layoutOffsetSubNodes(leftNodes);
        layoutData.outerHeightRight = this.layoutOffsetSubNodes(rightNodes);

        this.bounds.e = node._data.view.width / 2;
        this.bounds.w = 0 - this.bounds.e;
        this.bounds.n = 0;
        this.bounds.s = Math.max(layoutData.outerHeightLeft, layoutData.outerHeightRight);
    }

    layoutOffsetSubNodes(nodes: Array<MindNode>): number {
        let totalHeight = 0;
        let nodesCount = nodes.length;

        let i = nodesCount;
        let node: MindNode = null;
        let layoutData: LayoutData = null;
        let nodeOuterHeight = 0;
        let baseY = 0;
        let parent_Data: _Data = null;

        while (i--) {
            node = nodes[i];
            layoutData = node._data.layout;
            if (!parent_Data) {
                parent_Data = node.parent._data;
            }

            nodeOuterHeight = this.layoutOffsetSubNodes(node.children);

            if (!node.expanded) {
                nodeOuterHeight = 0;
                this.setVisible(node.children, false);
            }

            nodeOuterHeight = Math.max(node._data.view.height, nodeOuterHeight);

            layoutData.outerHeight = nodeOuterHeight;
            layoutData.offsetY = baseY - nodeOuterHeight / 2;
            layoutData.offsetX = this.options.hSpace * layoutData.direction + parent_Data.view.width * (parent_Data.layout.direction + layoutData.direction) / 2;

            if (!node.parent.isroot) {
                layoutData.offsetX += this.options.pSpace * layoutData.direction;
            }

            baseY = baseY - nodeOuterHeight - this.options.vSpace;
            totalHeight += nodeOuterHeight;
        }

        if (nodesCount > 1) {
            totalHeight += this.options.vSpace * (nodesCount - 1);
        }

        i = nodesCount;
        let middleHeight = totalHeight / 2;
        while (i--) {
            node = nodes[i];
            node._data.layout.offsetY += middleHeight;
        }

        return totalHeight;
    }

    layoutOffsetSubNodesHeight(nodes: Array<MindNode>): number {
        let totalHeight = 0;
        let nodesCount = nodes.length;
        let i = nodesCount;
        let node: MindNode = null;
        let nodeOuterHeight = 0;
        let layoutData: LayoutData = null;
        let baseY = 0;
        let parent_Data: _Data = null;

        while (i--) {
            node = nodes[i];
            layoutData = node._data.layout;

            if (!parent_Data) {
                parent_Data = node._data;
            }

            nodeOuterHeight = this.layoutOffsetSubNodesHeight(node.children);

            if (!node.expanded) {
                nodeOuterHeight = 0;
            }

            nodeOuterHeight = Math.max(node._data.view.height, nodeOuterHeight);

            layoutData.outerHeight = nodeOuterHeight;
            layoutData.offsetY = baseY - nodeOuterHeight / 2;
            baseY = baseY - nodeOuterHeight - this.options.vSpace;
            totalHeight += nodeOuterHeight;
        }

        if (nodesCount > 1) {
            totalHeight += this.options.vSpace * (nodesCount - 1);
        }

        i = nodesCount;
        let middleHeight = totalHeight / 2;

        while (i--) {
            node = nodes[i];
            node._data.layout.offsetY += middleHeight;
        }

        return totalHeight;
    }

    getNodeOffset(node: MindNode): { x: number, y: number } {
        let layoutData: LayoutData = node._data.layout;
        let offsetCache: { x: number, y: number } = null;

        if (layoutData._offset_ && this.cacheValid) {
            offsetCache = layoutData._offset_;
        } else {
            offsetCache = { x: -1, y: -1 };
            layoutData._offset_ = offsetCache;
        }
        if (offsetCache.x === -1 || offsetCache.y === -1) {
            let x = layoutData.offsetX;
            let y = layoutData.offsetY;

            if (!node.isroot) {
                let offsetParent = this.getNodeOffset(node.parent)
                x += offsetParent.x;
                y += offsetParent.y;
            }

            offsetCache.x = x;
            offsetCache.y = y;
        }
        return offsetCache;
    }

    getNodePoint(node: MindNode): { x: number, y: number } {
        let viewData: View = node._data.view;
        let offsetParent = this.getNodeOffset(node);
        let point: { x: number, y: number } = null;
        // let point: { x?: number, y?: number } = {};

        point.x = offsetParent.x + viewData.width * (node._data.layout.direction - 1) / 2;
        point.y = offsetParent.y - viewData.height / 2;
        return point;
    }

    getNodePointIn(node: MindNode): { x: number, y: number } {
        let point = this.getNodeOffset(node);
        return point
    }

    getNodePointOut(node: MindNode): { x: number, y: number } {
        let layoutData: LayoutData = node._data.layout;
        let pointCache: { x: number, y: number } = null;

        if (layoutData._pointOut_ && this.cacheValid) {
            pointCache = layoutData._pointOut_;
        } else {
            pointCache = { x: -1, y: -1 };
            layoutData._pointOut_ = pointCache;
        }

        if (pointCache.x === -1 || pointCache.y === 1) {
            if (node.isroot) {
                pointCache.x = 0;
                pointCache.y = 0;
            } else {
                let viewData = node._data.view;
                let offsetParent = this.getNodeOffset(node);
                pointCache.x = offsetParent.x + (viewData.width + this.options.pSpace) * node._data.layout.direction;
                pointCache.y = offsetParent.y;
            }
        }
        return pointCache;
    }

    getExpanderPoint(node: MindNode): { x: number, y: number } {
        let point = this.getNodePointOut(node);

        let expandPoint: { x: number, y: number } = null;

        if (node._data.layout.direction === JsMind.direction.right) {
            expandPoint.x = point.x - this.options.pSpace;
        } else {
            expandPoint.x = point.x;
        }
        expandPoint.y = point.y - Math.ceil(this.options.pSpace / 2);
        return expandPoint;
    }

    getMinSize(): { w: number, h: number } {
        let nodes = this.jsMind.mind.nodes;
        let node = null;
        let pointOut = null;

        for (let nodeId in nodes) {
            node = nodes[nodeId];
            pointOut = this.getNodePointOut(node);
            if (pointOut.x > this.bounds.e) {
                this.bounds.e = pointOut.x;
            }
            if (pointOut.x < this.bounds.w) {
                this.bounds.w = pointOut.x;
            }
        }
        return {
            w: this.bounds.e - this.bounds.w,
            h: this.bounds.s - this.bounds.n
        }
    }

    toggleNode(node: MindNode) {
        if (node.isroot) {
            return;
        }
        if (node.expanded) {
            this.collapseNode(node);
        } else {
            this.expandNode(node);
        }
    }

    collapseNode(node: MindNode) {
        node.expanded = false;
        this.partLayout(node);
        this.setVisible(node.children, false);
    }

    expandNode(node: MindNode) {
        node.expanded = true;
        this.partLayout(node);
        this.setVisible(node.children, true);
    }

    expandAll() {
        let nodes = this.jsMind.mind.nodes;
        let c = 0;
        let node: MindNode = null;

        for (let nodeId in nodes) {
            node = nodes[nodeId];
            if (!node.expanded) {
                node.expanded = true;
                c++;
            }
        }

        if (c > 0) {
            let root = this.jsMind.mind.root;
            this.partLayout(root);
            this.setVisible(root.children, true);
        }
    }

    collapseAll() {
        let nodes = this.jsMind.mind.nodes;
        let c = 0;
        let node: MindNode = null;

        for (let nodeId in nodes) {
            node = nodes[nodeId];
            if (node.expanded && !node.isroot) {
                node.expanded = true;
                c++;
            }
        }

        if (c > 0) {
            let root = this.jsMind.mind.root;
            this.partLayout(root);
            this.setVisible(root.children, true);
        }
    }

    expandToDepth(targetDepth: number, currentNodes?: Array<MindNode>, currentDepth?: number) {
        if (targetDepth < 1) {
            return;
        }
        let nodes = currentNodes || this.jsMind.mind.root.children;
        let depth = currentDepth || 1;
        let i = nodes.length;
        let node: MindNode = null;

        while (i--) {
            node = nodes[i];
            if (depth < targetDepth) {
                if (!node.expanded) {
                    this.expandNode(node);
                }
                this.expandToDepth(targetDepth, node.children, depth + 1);
            }
            if (depth === targetDepth) {
                if (node.expanded) {
                    this.collapseNode(node);
                }
            }
        }

    }

    partLayout(node: MindNode) {
        let root: MindNode = this.jsMind.mind.root;
        if (root) {
            let rootLayoutData = root._data.layout;
            if (node.isroot) {
                rootLayoutData.outerHeightRight = this.layoutOffsetSubNodesHeight(rootLayoutData.rightNodes);
                rootLayoutData.outerHeightLeft = this.layoutOffsetSubNodesHeight(rootLayoutData.leftNodes);
            } else {
                if (node._data.layout.direction === JsMind.direction.right) {
                    rootLayoutData.outerHeightRight = this.layoutOffsetSubNodesHeight(rootLayoutData.rightNodes);
                } else {
                    rootLayoutData.outerHeightLeft = this.layoutOffsetSubNodesHeight(rootLayoutData.leftNodes);
                }
            }
            this.bounds.s = Math.max(rootLayoutData.outerHeightLeft, rootLayoutData.outerHeightRight);
            this.cacheValid = false;
        } else {
            console.warn('警告，没有找根节点');
        }
    }

    setVisible(nodes: Array<MindNode>, visible: boolean) {
        let i = nodes.length;
        let node: MindNode = null;
        let layoutData: LayoutData = null;

        while (i--) {
            node = nodes[i];
            layoutData = node._data.layout;

            if (node.expanded) {
                this.setVisible(node.children, visible);
            } else {
                this.setVisible(node.children, false)
            }

            if (!node.isroot) {
                node._data.layout.visible = visible;
            }
        }
    }

    isExpand(node: MindNode) {
        return node.expanded;
    }

    isVisible(node: MindNode) {
        let layoutData: LayoutData = node._data.layout;
        if (!layoutData?.visible) {
            return false;
        }
        return true;

    }
}