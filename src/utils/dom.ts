export const name = 'qh-mind';
export const version = '0.0.1';
export const author = 'TangXuWei';

/**
 * dom 树的快捷方式
 */
// @ts-ignore
export const $window = (typeof window !== 'undefined') ? window : global;
export const $document: Document = $window.document;

/**
 * 获取dom元素
 * @param id 选择器ID
 */
export const $getElementByID = function (id: string): HTMLElement {
    return $document.getElementById(id);
};

/**
 * 创建dom元素
 * @param tag 元素名称
 */
export const $createElement = function (tag: string): HTMLElement {
    return $document.createElement(tag);
};

/**
 * 创建文本节点
 * @param parentNode
 * @param text
 */
export const $textNode = function (parentNode: Node, text: string): void {
    if (parentNode.hasChildNodes()) {
        parentNode.firstChild!.nodeValue = text;
    } else {
        parentNode.insertBefore($document.createTextNode(text), null);
    }
};

/**
 * 新建 innerHTML
 * @param node html 节点
 * @param text innerHTML 内容
 */
export const $innerHtml = function (node: HTMLElement, text: string | HTMLElement) {
    if (text instanceof HTMLElement) {
        node.innerHTML = '';
        node.insertBefore(text, null);
    } else {
        node.innerHTML = text;
    }
};

/**
 * 判断节点是否是 HTMLElement
 * @param element 节点
 */
export const isElement = function (element: HTMLElement | any): element is HTMLElement {
    return !!element &&
        (typeof element === 'object') &&
        (element.nodeType === 1) &&
        (typeof element.style === 'object') &&
        (typeof element.ownerDocument === 'object');
};

/**
 * 添加事件
 * @param element html 元素
 * @param eventType 事件类型
 * @param handler 注册
 */
export function addEvent(element: HTMLElement, eventType: string, handler: (event?: Event) => void): void {
    if (element.addEventListener) {
        element.addEventListener(eventType, handler, false);
    } else {
        // @ts-ignore
        element['on' + eventType] = handler;
    }
}

