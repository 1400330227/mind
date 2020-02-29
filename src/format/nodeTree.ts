import { JsMind, name } from '../jsMind'
import { version } from '../jsMind'
import { author } from '../jsMind'
import { Meta, Mind, MindData, NodeData } from '../mind';
import { MindNode } from "../node";

export const example = {
    meta: {
        name: name,
        version: version,
        author: author,
    },
    format: "node_tree",
    data: { "id": "root", "topic": "jsMind Example" }
}

export class NodeTree {
    static example = example;

    constructor() {

    }

    static getMind(source: MindData): Mind {
        const mind = new Mind();
        mind.name = source.meta.name;
        mind.author = source.meta.author;
        mind.version = source.meta.version;
        NodeTree.parse(mind, <NodeData>source.data)
        return mind;
    }

    /**
     * 获取mind数据
     * @param mind
     */
    static getData(mind: Mind): MindData {
        let json: MindData = {};
        json.meta = { name: mind.name, author: mind.author, version: mind.version };
        json.format = 'node_tree';
        json.data = NodeTree.buildNode(mind.root)
        return json;
    }

    /**
     * 构建node节点
     * @param node mind 节点
     */
    static buildNode(node: MindNode):NodeData {
        const object:NodeData = {id: node.id, topic: node.topic, expanded: node.expanded};
        
        if(node?.parent?.isroot) {
            object.direction = node.direction === JsMind.direction.left ? 'left' : 'right';
        }

        if(node.data !== null) {
            let nodeData = node.data;
            for(let key in nodeData) {
                if(nodeData.hasOwnProperty(key)) {
                    object[key] = nodeData[key];
                }
            }
        }

        let children = node.children;
        if(children.length > 0) {
            object.children = [];
            for(let i = 0; i < children.length; i++) {
                object.children.push(NodeTree.buildNode(children[i]));
            }
            
        }
        return object;
    }

    static _array(mind: Mind, nodeArray: Array<NodeData>) {
        NodeTree.arrayNode(mind.root, nodeArray)
    }

    /**
     * 将node节点添加到nodeArray节点数组
     * @param node 节点
     * @param nodeArray 节点数组
     */
    static arrayNode(node: MindNode, nodeArray: Array<NodeData>) {
        let object: NodeData = { id: node.id, topic: node.topic, expanded: node.expanded };

        if (node.parent) {
            object.parentId = node.parent.id;
        }
        if (node.isroot) {
            object.isroot = true;
        }
        if (node?.parent?.isroot) {
            object.direction = (node.direction === JsMind.direction.left ? 'left' : 'right');
        }
        if (node.data !== null) {
            const nodeData = node.data;
            for (let key in nodeData) {
                if (nodeData.hasOwnProperty(key)) {
                    object[key] = nodeData[key];
                }
            }
        }
        nodeArray.push(object);
        const nodeChildrenLength = node.children.length;
        for (let i = 0; i < nodeChildrenLength; i++) {
            NodeTree.arrayNode(node.children[i], nodeArray)
        }
    }

    /**
     * 解析节点
     * @param mind
     * @param nodeArray
     */
    static parse(mind: Mind, nodeRoot: NodeData) {
       const data = NodeTree.extractData(nodeRoot);
       mind.setRoot(nodeRoot.id, nodeRoot.topic, data);

       if((nodeRoot as Object).hasOwnProperty('children')) {
           const children = nodeRoot.children;

           for(let i = 0; i < children.length; i++) {
               NodeTree.extractSubNode(mind, mind.root, children[i])
           }
       }
    }

    /**
     * 获取跟节点
     * @param mind mind 数据源
     * @param nodeArray mind数组节点
     */
    static extractRoot(mind: Mind, nodeArray: Array<NodeData>): string {
        let nodeArrayLength = nodeArray.length;
        while (nodeArrayLength--) {
            if (nodeArray[nodeArrayLength]?.isroot === true) {
                let rootJson = nodeArray[nodeArrayLength];
                let data = NodeTree.extractData(rootJson);
                mind.setRoot(rootJson.id, rootJson.topic, data);
                nodeArray.splice(nodeArrayLength, 1);
                return rootJson.id;
            }
        }
        return null;
    }

    /**
     * 获取额外数据
     * @param nodeJson 节点数据
     */
    static extractData(nodeJson: NodeData): { [propName: string]: any } {
        const data = {};
        for (let key in nodeJson) {
            if (nodeJson.hasOwnProperty(key)) {
                if (key === 'id' || key === 'topic' || key === 'parentId' || key === 'isroot' || key === 'direction' || key === 'expanded') {
                    continue;
                }
                data[key] = nodeJson[key]
            }
        }
        return data;
    }

    static extractSubNode(mind: Mind, nodeParent: MindNode, nodeJson: NodeData) {
        const data = NodeTree.extractData(nodeJson)
        let direction = null;

        if(nodeParent.isroot) {
            direction = nodeJson.direction === 'left' ? JsMind.direction.left : JsMind.direction.right;
        }

        const node = mind.addNode(nodeParent, nodeJson.id,null, nodeJson.topic, data, direction, nodeJson.expanded);
        if((nodeJson as Object).hasOwnProperty('children')) {
            const children = nodeJson.children;

            for(let i = 0; i < children.length; i++) {
                NodeTree.extractSubNode(mind, node, children[i]);
            }
        }
    }


}
