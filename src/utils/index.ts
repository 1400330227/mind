import { MindNode } from "../node";

/**
 * 混入对象 mixin
 * @param target 目标对象
 * @param source 源对象
 */
export function merge(target: any, source: any) {
    // @ts-ignore
    for (let key of Reflect.ownKeys(source)) {
        if (key !== 'constructor' && key !== 'prototype' && key !== 'name') {
            let desc = Object.getOwnPropertyDescriptor(source, key);
            Object.defineProperty(target, key, <PropertyDescriptor>desc);
        }
    }
}


/**
 * 判断是否是MindNode节点
 * @param node
 */
export function isNode(node: any): node is MindNode {
    return node && node instanceof MindNode;
}
