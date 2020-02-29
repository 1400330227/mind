import { version, author, JsMind } from "../jsMind";
import { MindData, Mind, NodeData } from "../mind";
import { MindNode } from "../node";

export const example = {
  meta: {
    name: name,
    version: version,
    author: author
  },
  format: "node_array",
  data: { id: "root", topic: "jsMind Example" }
};

export class NodeArray {
  static example = example;

  constructor() { }

  static getMind(source: MindData): Mind {
    const mind = new Mind();
    mind.name = source.meta.name;
    mind.author = source.meta.author;
    mind.version = source.meta.version;
    NodeArray.parse(mind, <NodeData[]>source.data);
    return mind;
  }

  static getData(mind: Mind):MindData {
    let json: MindData = {};
    json.meta = { name: mind.name, author: mind.author, version: mind.version };
    json.format = 'node_array';
    json.data = [];

    NodeArray._array(mind, json.data)
    return json
  }

  static _array(mind: Mind, nodeArray: Array<NodeData>) {
    NodeArray.arrayNode(mind.root, nodeArray)
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
        NodeArray.arrayNode(node.children[i], nodeArray)
      }
  }

  /**
   * 解析数据源
   * @param mind mind 数据源
   * @param nodeArray mind 对应的数组
   */
  static parse(mind: Mind, nodeArray: Array<NodeData>) {
    const nArray = nodeArray.slice(0).reverse();

    let rootId = NodeArray.extractRoot(mind, nArray);

    if (rootId) {
      NodeArray.extractSubNode(mind, rootId, nArray);
    } else {
      console.error(`失败，根节点没有找到`);
    }
  }

  /**
   * 提取跟节点
   * @param mind mind 数据源
   * @param nodeArray mind 对应的数组
   * @return rootId 返回
   */
  static extractRoot(mind: Mind, nodeArray: Array<NodeData>): string {
    let nodeArrayLength = nodeArray.length;

    while (nodeArrayLength--) {
      if (nodeArray[nodeArrayLength]?.isroot === true) {
        let rootJson = nodeArray[nodeArrayLength];
        let data = NodeArray.extractData(rootJson);
        mind.setRoot(rootJson.id, rootJson.topic, data);
        nodeArray.splice(nodeArrayLength, 1);
        return rootJson.id;
      }
    }

    return null;
  }

  /**
   * 获取父节点的所有子节点
   * @param mind mind 数据源
   * @param parentId 父节点ID
   * @param nodeArray mind 对应的数组
   * @returns 
   */
  static extractSubNode(mind: Mind, parentId: string, nodeArray: Array<NodeData>): number {
    let nodeArrayLength = nodeArray.length;
    let nodeJson: NodeData = null;
    let data = null;
    let extractCount = 0;

    while (nodeArrayLength--) {
      nodeJson = nodeArray[nodeArrayLength];

      if (nodeJson.parentId === parentId) {
        data = NodeArray.extractData(nodeJson);
        let direction = null;
        let nodeDirection = nodeJson.direction;

        if (nodeDirection) {
          direction = (nodeDirection === 'left' ? JsMind.direction.left : JsMind.direction.right);
        }

        mind.addNode(parentId, nodeJson.id, null, nodeJson.topic, nodeJson.data, direction, nodeJson.expanded)
        nodeArray.splice(nodeArrayLength, 1);
        extractCount++;

        let subExtractCount = NodeArray.extractSubNode(mind, nodeJson.id, nodeArray)

        if (subExtractCount > 0) {
          nodeArrayLength = nodeArray.length;
          extractCount += subExtractCount;
        }
      }
    }
    return extractCount;
  }

  /**
   * 获取额外数据
   * @param nodeJson 节点数据
   * @returns
   */
  static extractData(nodeJson: NodeData): { [propName: string]: any } {
    const data = {};
    for (let key in nodeJson) {
      if (nodeJson.hasOwnProperty(key)) {
        if (key === "id" || key === "topic" || key === "parentId" || key === "isroot" || key === "direction" || key === "expanded") {
          continue;
        }
        data[key] = nodeJson[key];
      }
    }
    return data;
  }
}
