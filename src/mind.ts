import {MindNode} from "./node";
import {isNode} from "./utils";
import {JsMind} from "./jsMind";

export interface Meta {
    name: string;
    author: string;
    version: string;
}

/**
 * 节点数据
 */
export interface NodeData {
    id: string;
    topic: string;
    isroot?: boolean;
    parentId?: string;
    direction?: string | number;
    expanded?: boolean;

    [propName: string]: any;
}

export interface MindData {
    meta?: Meta;
    format?: string;
    data?: Array<NodeData> | NodeData
}

export class Mind {

    name = null;
    author = null;
    version = null;
    root: MindNode = null;
    selected: MindNode = null;
    nodes: { [propName: string]: MindNode } = {};


    constructor() {

    }

    /**
     * 获取节点
     * @param nodeId 节点ID
     */
    getNode(nodeId: string): MindNode {
        if (this.nodes.hasOwnProperty(nodeId)) {
            return this.nodes[nodeId]
        }
        return null;
    }

    /**
     * 设定根节点
     * @param nodeId 根节点ID
     * @param topic 节点主题
     * @param data
     */
    setRoot(nodeId: string, topic: string, data: { [propName: string]: any }) {
        if (!this.root) console.error('根节点已经存在!')
        this.root = new MindNode(nodeId, 0, topic, data, true)
        this.putNode(this.root)
    }

    /**
     * 添加节点
     * @param parentNode 父节点
     * @param nodeId 节点ID
     * @param iIndex 节点索引
     * @param topic 节点主题
     * @param data 节点数据
     * @param eDirection 节点方向 { left: -1, center: 0, right: 1 }
     * @param expanded 节点是否扩展
     */
    addNode(parentNode: MindNode | string, nodeId: string, iIndex: number = -1, topic: string, data: { [propName: string]: any }, eDirection?: any, expanded?: boolean): MindNode {
        if (!isNode(parentNode)) {
            const theParentNode = this.getNode(parentNode);
            if (!theParentNode) {
                console.error(`没有找到节点: the parent_node[id=${parentNode}]`);
                return null;
            } else {
                return this.addNode(theParentNode, nodeId, iIndex, topic, data, eDirection, expanded);
            }
        }

        const nodeindex = iIndex;
        let node: MindNode = null;

        if (parentNode.isroot) {
            let direction = JsMind.direction.right;
            if (isNaN(eDirection)) {
                const children = parentNode.children;
                const childrenLength = children.length;
                let result = 0;

                for (let i = 0; i < childrenLength; i++) {
                    if (children[i].direction === JsMind.direction.left) {
                        result--;
                    } else {
                        result++;
                    }
                }

                direction = (childrenLength > 1 && result > 0) ? JsMind.direction.left : JsMind.direction.right
            } else {
                direction = (direction != JsMind.direction.left) ? JsMind.direction.right : JsMind.direction.left;
            }
            node = new MindNode(nodeId, nodeindex, topic, data, false, parentNode, direction, expanded);
        } else {
            node = new MindNode(nodeId, nodeindex, topic, data, false, parentNode, parentNode.direction, expanded);
        }
        if (this.putNode(node)) {
            parentNode.children.push(node);
            this.resetIndex(parentNode);
        } else {
            console.error(`失败,节点${node.id}已经存在`);
            node = null;
        }
        return node;
    }

    /**
     * 根据基准节点，插入新节点到基准点前面
     * @param nodeBefore 基准节点
     * @param nodeId 插入节点id
     * @param topic 节点主题
     * @param data 节点数据
     */
    insertNodeBefore(nodeBefore: MindNode | string, nodeId: string, topic: string, data: any) {
        if (!isNode(nodeBefore)) {
            const theNodeBefore = this.getNode(nodeBefore)

            if (!theNodeBefore) {
                console.error(`失败，节点 ${nodeBefore} 不存在！`)
                return null;
            } else {
                return this.insertNodeBefore(theNodeBefore, nodeId, topic, data)
            }
        }

        let nodeIndex = nodeBefore.index - 0.5;
        return this.addNode(nodeBefore.parent, nodeId, nodeIndex, topic, data)
    }


    /**
     * 根据基准节点，插入新节点到基准点后面
     * @param nodeAfter 基准节点
     * @param nodeId 插入节点id
     * @param topic 节点主题
     * @param data 节点数据
     */
    insertNodeAfter(nodeAfter: MindNode | string, nodeId: string, topic: string, data: any) {
        if (!isNode(nodeAfter)) {
            const theNodeAfter = this.getNode(nodeAfter);

            if (!theNodeAfter) {
                console.error(`失败，节点 ${nodeAfter} 不存在！`)
                return null;
            } else {
                return this.insertNodeAfter(theNodeAfter, nodeId, topic, data)
            }
        }

        const nodeIndex = nodeAfter.index + 0.5;
        return this.insertNodeAfter(nodeAfter, nodeId, topic, data)
    }

    /**
     * 根据基准节点，获取基准节点的后节点
     * @param node 基准节点
     */
    getNodeAfter(node: MindNode | string): MindNode {
        if (!isNode(node)) {
            const theNode = this.getNode(node)

            if (!theNode) {
                console.error(`失败，节点 ${node} 不存在！`)
                return null;
            } else {
                return this.getNodeAfter(theNode)
            }
        }
        if (node.isroot) {
            return null;
        }

        const nodeIndex = node.index;
        const brothers = node.parent.children;

        if (brothers.length < nodeIndex) {
            return null
        }
        ;
        return node.parent.children[nodeIndex]
    }

    /**
     * 根据基准节点，获取基准节点前节点
     * @param node 基准节点
     */
    getNodeBefore(node: MindNode | string) {
        if (!isNode(node)) {
            const theNode = this.getNode(node)

            if (!theNode) {
                console.error(`失败，节点 ${node} 不存在！`)
                return null;
            } else {
                return this.getNodeBefore(theNode)
            }
        }

        if (node.isroot) {
            return null;
        }

        const nodeIndex = node.index - 2;

        if (nodeIndex >= 0) {
            return node.parent.children[nodeIndex]
        } else {
            return null;
        }
    }

    /**
     * 初始化节点
     * @param node 节点
     */
    putNode(node: MindNode): boolean {
        if (this.nodes.hasOwnProperty(node.id)) {
            return false;
        }
        this.nodes[node.id] = node;
        return true;
    }

    /**
     * 排序节点
     * @param node 节点
     */
    resetIndex(node: MindNode) {
        node.children.sort(MindNode.compare)
    }

    /**
     * 移动节点
     * @param node 基准节点
     * @param beforeId 基准节点的前一个节点
     * @param parentId 基准节点的父节点
     * @param direction 基准节点的方向
     */
    moveNode(node: MindNode | string, beforeId: string, parentId: string, direction: number) {
        if (!isNode(node)) {
            const theNode = this.getNode(node)

            if (!theNode) {
                console.error(`失败，节点 ${node} 不存在！`)
                return null;
            } else {
                return this.moveNode(theNode, beforeId, parentId, direction)
            }
        }

        if (!parentId) {
            parentId = node.parent.id;
        }

        return this._moveNode(node, beforeId, parentId, direction)
    }

    /**
     * 移动基准节点
     * @param node 基准节点
     * @param beforeId
     * @param parentId
     * @param direction
     */
    _moveNode(node: MindNode, beforeId: string, parentId: string, direction: number): MindNode {
        if (node.parent.id !== parentId) {
            const sibling = node.parent.children;
            let siblingLength = sibling.length;

            while (siblingLength--) {
                if (sibling[siblingLength].id === node.id) {
                    sibling.splice(siblingLength, 1)
                    break;
                }
            }

            node.parent = this.getNode(parentId);
            node.parent.children.push(node)
        }

        if (node.parent.isroot) {
            if (direction === JsMind.direction.left) {
                node.direction = direction;
            } else {
                node.direction = JsMind.direction.right;
            }
        } else {
            node.direction = node.parent.direction;
        }

        this._moveNodeInternal(node, beforeId)
        this._flowNodeDirection(node)
        return node;
    }

    _moveNodeInternal(node: MindNode, beforeId: string) {
        if (beforeId === '_last_') {
            node.index = -1;
            this.resetIndex(node.parent)
        } else if (beforeId === '_first_') {
            node.index = 0;
            this.resetIndex(node.parent)
        } else {
            const nodeBefore = beforeId ? this.getNode(beforeId) : null;
            if (nodeBefore !== null && nodeBefore.parent !== null && nodeBefore.parent.id === node.parent.id) {
                node.index = nodeBefore.index - 0.5;
                this.resetIndex(node.parent)
            }
        }
        return node;
    }

    _flowNodeDirection(node: MindNode, direction?: number) {
        if (typeof direction === 'undefined') {
            direction = node.direction;
        } else {
            node.direction = direction;
        }

        let length = node.children.length;
        while (length--) {
            this._flowNodeDirection(node.children[length], direction)
        }
    }

    /**
     * 移除基准节点
     * @param node 基准节点
     */
    removeNode(node: MindNode | string): boolean {
        if (!isNode(node)) {
            const theNode = this.getNode(node)
            if (!theNode) {
                console.error(`失败，节点 ${node} 不存在！`)
                return false;
            } else {
                return this.removeNode(theNode)
            }
        }

        if (node.isroot) {
            console.error(`失败，根节点不能删除！`)
            return false;
        }

        if (this.selected !== null && this.selected.id === node.id) {
            this.selected = null;
        }

        const children = node.children;
        let childrenLength = children.length;

        while (childrenLength--) {
            this.removeNode(children[childrenLength])
        }

        children.length = 0;

        const sibling = node.parent.children;
        let siblingLength = sibling.length;

        while (siblingLength--) {
            if (sibling[siblingLength].id === node.id) {
                sibling.splice(siblingLength, 1);
                break;
            }
        }

        this.nodes[node.id] = undefined;
        for (let k in node) {
            node[k] = undefined;
        }

        node = null;
        return true;
    }

}
