import { merge, isNode } from "./utils";
import { MindNode } from "./node";
import { Mind, MindData } from "./mind";
import { DataProvider } from "./dataProvider";
import { LayoutProvider } from "./layoutProvider";
import { ViewProvider } from "./viewProvider";
import { NodeArray } from "./format/nodeArray";
import { isEmpty } from "./utils/config";

export interface Options {
    [propName: string]: any;
}

export const name = 'jsMind';
export const version = '0.4.6';
export const author = 'hizzgdev@163.com';

const DEFAULT_OPTIONS: Options = {
    container: '',
    editable: false,
    theme: null,
    mode: 'full',
    supportHtml: true,

    view: {
        engine: 'canvas',
        hMargin: 100,
        vMargin: 50,
        lineWidth: 2,
        lineColor: '#555'
    },
    layout: {
        hSpace: 30,
        vSpace: 20,
        pSpace: 13
    },
    default_event_handle: {
        enable_mousedown_handle: true,
        enable_click_handle: true,
        enable_dblclick_handle: true
    },
    /**快捷键支持 */
    shortcut: {
        enable: true,
        handles: {},
        mapping: {
            addchild: 45, // Insert
            addbrother: 13, // Enter
            editnode: 113,// F2
            delnode: 46, // Delete
            toggle: 32, // Space
            left: 37, // Left
            up: 38, // Up
            right: 39, // Right
            down: 40, // Down
        }
    },
};

export class JsMind {

    version = version;
    options: Options = DEFAULT_OPTIONS;
    inited = false;
    mind: Mind = null;
    eventHandles: any[] = [];

    static direction = { left: -1, center: 0, right: 1 };
    static eventType = { show: 1, resize: 2, edit: 3, select: 4 };
    static key = { meta: 1 << 13, ctrl: 1 << 12, alt: 1 << 11, shift: 1 << 10 };

    data: DataProvider;
    layout: LayoutProvider;
    view: ViewProvider;

    constructor(options: Options) {
        if (!options.container) {
            console.error(`失败，container 容器为空`);
            return;
        }
        merge(this.options, options);
        this.init();
    }

    init() {
        this.inited = true;
        const options = this.options;
        const optionsLayout = {
            mode: options.mode,
            hSpace: options.layout.hSpace,
            vSpace: options.layout.vSpace,
            pSpace: options.layout.pSpace,
        };
        const optionsView = {
            container: options.container,
            supportHtml: options.supportHtml,
            engine: options.view.engine,
            hMargin: options.view.hMargin,
            vMargin: options.view.vMargin,
            lineWidth: options.view.lineWidth,
            lineColor: options.view.lineColor,
        };
        this.data = new DataProvider(this);
        this.layout = new LayoutProvider(this, optionsLayout);
        this.view = new ViewProvider(this, options.optionsView);

        this.data.init();
        this.layout.init();
        this.view.init();

        this.eventBind();
    }

    enableEdit() {
        this.options.editable = true;
    }

    disableEdit() {
        this.options.editable = false;
    }

    enableEventHandle(eventHandle: Event) {
        this.options.defaultEventHandle[`enable_${eventHandle}_handle`] = false;
    }

    getEditable() {
        return this.options.editable;
    }

    setTheme(theme: string) {
        const themeOld = this.options.theme;
        this.options.theme = theme ? theme : null;

        if (themeOld !== this.options.theme) {
            this.view.resetTheme();
            this.view.resetCustomStyle();
        }
    }

    eventBind() {
        this.view.addEvent(this, 'mousedown', this.mousedownHandle);
        this.view.addEvent(this, 'click', this.clickHandle);
        this.view.addEvent(this, 'dblclick', this.dblClickHandle);
    }

    mousedownHandle(event: Event) {
        if (!this.options.defaultEventHandle['enable_mousedown_handle']) {
            return;
        }
        const element = event.target || event.srcElement;
        const nodeId = this.view.getBindedNodeId(<HTMLElement>element);
    }

    clickHandle(event: Event) {
        if (!this.options.defaultEventHandle['enable_click_handle']) {
            return;
        }
        const element = event.target || event.srcElement;
        const isExpander = this.view.isExpander(<HTMLElement>element);

        if (isExpander) {
            let nodeId = this.view.getBindedNodeId(<HTMLElement>element);
            if (nodeId) {
                this.toggleNode(nodeId);
            }
        }
    }

    dblClickHandle(event: Event) {
        if (!this.options.defaultEventHandle['enable_dblclick_handle']) {
            return;
        }

        if (this.getEditable()) {
            const element = event.target || event.srcElement;
            const nodeId = this.view.getBindedNodeId(<HTMLElement>element);
            if (nodeId) {
                this.beginEdit(nodeId);
            }
        }
    }

    beginEdit(node: MindNode) {
        if (!isNode(node)) {
            const theNode = this.getNode(node);
            if (!theNode) {
                console.error(`失败，the node [id = ${node}] 没有找到`);
                return false;
            } else {
                return this.beginEdit(theNode);
            }
        }
        if (this.getEditable()) {
            this.view.editNodeBegin(node);
        } else {
            console.error(`失败, 思维导图不可编辑`);
            return;
        }
    }

    endEdit() {
        this.view.editNodeEnd();
    }

    toggleNode(node: MindNode) {
        if (!isNode(node)) {
            const theNode = this.getNode(node);
            if (!theNode) {
                console.error(`失败，the node [id = ${node}] 没有找到`);
                return false;
            } else {
                return this.toggleNode(theNode);
            }
        }
        if (node.isroot) {
            return;
        }
        this.view.saveLacation(node);
        this.layout.toggleNode(node);
        this.view.relayOut();
        this.view.restoreLocation(node);
    }

    expandNode(node: MindNode) {
        if (!isNode(node)) {
            const theNode = this.getNode(node);
            if (!theNode) {
                console.error(`失败，the node [id = ${node}] 没有找到`);
                return false;
            } else {
                return this.expandNode(theNode);
            }
        }
        if (node.isroot) {
            return;
        }
        this.view.saveLacation(node);
        this.layout.expandNode(node);
        this.view.relayOut();
        this.view.restoreLocation(node);
    }

    collapseNdoe(node: MindNode) {
        if (!isNode(node)) {
            const theNode = this.getNode(node);
            if (!theNode) {
                console.error(`失败，the node [id = ${node}] 没有找到`);
                return false;
            } else {
                return this.collapseNdoe(theNode);
            }
        }
        if (node.isroot) {
            return;
        }
        this.view.saveLacation(node);
        this.layout.collapseNode(node);
        this.view.relayOut();
        this.view.restoreLocation(node);
    }

    expandAll() {
        this.layout.expandAll();
        this.view.relayOut();
    }

    collapseAll() {
        this.layout.collapseAll();
        this.view.relayOut();
    }

    expandToDepth(depth: number) {
        this.layout.expandToDepth(depth);
        this.view.relayOut();
    }

    reset() {
        this.view.reset();
        this.layout.reset();
        this.data.reset();
    }

    _show(mind: MindData) {
        const _mind = mind || NodeArray.example;
        this.mind = this.data.load(_mind);

        if (!this.mind) {
            console.error('失败，加载失败');
            return;
        } else {
            console.debug('数据加载中');
        }

        this.view.load();
        this.layout.layout();
        this.view.show(true);
        this.invokeEventHandle(JsMind.eventType.show, { datat: [mind] });
    }

    show(mind: MindData) {
        this.reset();
        this._show(mind);
    }

    getMeta() {
        return {
            name: this.mind.name,
            author: this.mind.author,
            version: this.mind.version
        };
    }

    getData(dataFormat: string = 'node_tree') {
        const _dataFormat = dataFormat;
        return this.data.getData(_dataFormat);
    }

    getRoot() {
        return this.mind.root;
    }

    getNode(nodeId: string): MindNode {
        return this.mind.getNode(nodeId);
    }

    addNode(parentNode: MindNode, nodeId: string, topic: string, data: any): MindNode {
        const isEditable = this.getEditable();
        if (isEditable) {
            const node: MindNode = this.mind.addNode(parentNode, nodeId, null, topic, data);
            if (node) {
                this.view.addNode(node);
                this.layout.layout();
                this.view.show(false);
                this.view.resetNodeCustomStyle(node);
                this.expandNode(parentNode);
                this.invokeEventHandle(JsMind.eventType.edit, {
                    evt: 'addNode',
                    data: [parentNode.id, nodeId, topic, data]
                });
            }
            return node;
        } else {
            console.error('失败，mind 不可编辑');
            return null;
        }
    }

    insertNodeBefore(nodeBefore: MindNode | string, nodeId: string, topic: string, data: any) {
        const isEditable = this.getEditable();
        if (isEditable) {
            const beforeId = isNode(nodeBefore) ? (nodeBefore as MindNode).id : nodeBefore;
            const node = this.mind.insertNodeBefore(nodeBefore, nodeId, topic, data);
            if (node) {
                this.view.addNode(node);
                this.layout.layout();
                this.view.show(false);
                this.invokeEventHandle(JsMind.eventType.edit, {
                    evt: 'insertNodeBefore',
                    data: [beforeId, nodeId, topic, data],
                    node: nodeId
                });
            }
            return node;
        } else {
            console.error('失败，mind 不可编辑');
            return null;
        }
    }

    insertNodeAfter(nodeAfter: MindNode | string, nodeId: string, topic: string, data: any) {
        const isEditable = this.getEditable();
        if (isEditable) {
            const afterId = isNode(nodeAfter) ? (nodeAfter as MindNode).id : nodeAfter;
            const node = this.mind.insertNodeAfter(nodeAfter, nodeId, topic, data);
            if (node) {
                this.view.addNode(node);
                this.layout.layout();
                this.view.show(false);
                this.invokeEventHandle(JsMind.eventType.edit, {
                    evt: 'insertNodeAfter',
                    data: [afterId, nodeId, topic, data],
                    node: nodeId
                });
            }
            return node;
        } else {
            console.error('失败，mind 不可编辑');
            return null;
        }
    }

    removeNode(node: MindNode | string) {
        if (!isNode(node)) {
            const theNode = this.getNode(<string>node);
            if (!theNode) {
                console.error(`失败，node[id= ${node}] 没有发现`);
                return false;
            } else {
                return this.removeNode(theNode);
            }
        }
        if (node instanceof MindNode) {
            const isEditable = this.getEditable();
            if (isEditable) {
                if (node.isroot) {
                    console.error('失败，不能移除根节点');
                    return false;
                }
                let nodeId = node.id;
                let parentId = node.parent.id;
                let parentNode = this.getNode(parentId);

                this.view.saveLacation(parentNode);
                this.view.removeNode(node);
                this.mind.removeNode(node);
                this.layout.layout();
                this.view.show(false);
                this.view.restoreLocation(parentNode);
                this.invokeEventHandle(JsMind.eventType.edit, {
                    evt: 'removeNode',
                    data: [nodeId],
                    node: parentId
                });
                return true;
            } else {
                console.error('失败，mind 不可编辑');
                return false;
            }
        }
    }

    updateNode(nodeId: string, topic: string) {
        const isEditable = this.getEditable();
        if (isEditable) {
            if (isEmpty(topic)) {
                console.warn('失败，topic 不能为空');
                return;
            }
            const node = this.getNode(nodeId);
            if (node) {
                if (node.topic === topic) {
                    console.info('topic 未改变');
                    return;
                }
                node.topic = topic;
                this.view.updateNode(node);
                this.layout.layout();
                this.view.show(false);
                this.invokeEventHandle(JsMind.eventType.edit, {
                    evt: 'updateNode',
                    data: [nodeId, topic],
                    node: nodeId
                });
            }
        } else {
            console.error('失败，mind 不可编辑');
            return;
        }
    }

    moveNode(nodeId: string, beforeId: string, parentId: string, direction: number) {
        const isEditable = this.getEditable();
        if (isEditable) {
            const node = this.mind.moveNode(nodeId, beforeId, parentId, direction);
            if (node) {
                this.view.updateNode(node);
                this.layout.layout();
                this.view.show(false);
                this.invokeEventHandle(JsMind.eventType.edit, {
                    evt: 'moveNode',
                    data: [nodeId, beforeId, parentId, direction],
                    node: nodeId
                });
            }
        } else {
            console.error('失败，mind 不可编辑');
            return;
        }
    }

    selectNode(node: MindNode | string) {
        if (!isNode(node)) {
            const theNode = this.getNode(node);
            if (!theNode) {
                console.error(`失败，node[id= ${node}] 没有发现`);
                return;
            } else {
                return this.selectNode(theNode);
            }
        }
        const isVisible = this.layout.isVisible(node);
        if (!isVisible) {
            return;
        }
        this.mind.selected = node;
        this.view.selectNode(node);
    }

    getSelectedNode() {
        if (!this.mind) {
            return this.mind.selected;
        } else {
            return null;
        }
    }

    selectClear() {
        if (this.mind) {
            this.mind.selected = null;
            this.view.selectClear();
        }
    }

    isNodeVisible(node: MindNode) {
        return this.layout.isVisible(node);
    }

    findNodeBefore(node: MindNode) {
        if (!isNode(node)) {
            const theNode = this.getNode(node);
            if (!theNode) {
                console.error(`失败，node[id= ${node}] 没有发现`);
                return;
            } else {
                return this.findNodeBefore(theNode);
            }
        }
        if (node.isroot) {
            return null;
        }

        let n = null;
        if (node.parent.isroot) {
            const children = node.parent.children;
            let prev = null;
            let ni = null;
            for (let i = 0; i < children.length; i++) {
                ni = children[i];
                if (node.direction === ni.direction) {
                    if (node.id === ni.id) {
                        n = prev;
                    }
                    prev = ni;
                }
            }
        } else {
            n = this.mind.getNodeBefore(node);
        }
        return n;
    }

    findNodeAfter(node: MindNode) {
        if (!isNode(node)) {
            const theNode = this.getNode(node);
            if (!theNode) {
                console.error(`失败，node[id= ${node}] 没有发现`);
                return;
            } else {
                return this.findNodeAfter(theNode);
            }
        }
        if (node.isroot) {
            return null;
        }

        let n = null;
        if (node.parent.isroot) {
            const children = node.parent.children;
            let getthis = false;
            let ni = null;
            for (var i = 0; i < children.length; i++) {
                ni = children[i];
                if (node.direction === ni.direction) {
                    if (getthis) {
                        n = ni;
                        break;
                    }
                    if (node.id === ni.id) {
                        getthis = true;
                    }
                }
            }
        } else {
            n = this.mind.getNodeAfter(node);
        }
        return n;
    }

    setNodeColor(nodeId: string, bgColor?: string, fgColor?: string) {
        const isEditable = this.getEditable();
        if (isEditable) {
            const node = this.mind.getNode(nodeId);
            if (node) {
                node.data['background-color'] = bgColor;
                node.data['foreground-color'] = bgColor;
                this.view.resetNodeCustomStyle(node);
            }
        } else {
            console.error('失败，mind 不可编辑');
            return;
        }
    }

    setNodeFontStyle(nodeId: string, size?: string, weight?: string, style?: string) {
        const isEditable = this.getEditable();
        if (isEditable) {
            const node = this.mind.getNode(nodeId);
            if (node) {
                node.data['font-size'] = size;
                node.data['font-weight'] = weight;
                node.data['font-style'] = style;
                this.view.resetNodeCustomStyle(node);
                this.view.updateNode(node);
                this.layout.layout();
                this.view.show(false);
            }
        } else {
            console.error('失败，mind 不可编辑');
            return;
        }
    }

    setNodeBackgroundImage(nodeId: string, image: any, width: string, height: string, rotation: string) {
        const isEditable = this.getEditable();
        if (isEditable) {
            const node = this.mind.getNode(nodeId);
            if (node) {
                node.data['background-image'] = image;
                node.data['width'] = width;
                node.data['height'] = height;
                node.data['background-rotation'] = rotation;
                this.view.resetNodeCustomStyle(node);
                this.view.updateNode(node);
                this.layout.layout();
                this.view.show(false);
            }
        } else {
            console.error('失败，mind 不可编辑');
            return;
        }
    }

    setNodeBackgroundRotation(nodeId: string, rotation: string) {
        const isEditable = this.getEditable();
        if (isEditable) {
            const node = this.mind.getNode(nodeId);
            if (node) {
                if (!node.data['background-image']) {
                    console.error('失败，没有背景图片');
                    return null;
                }
                node.data['background-rotation'] = rotation;
                this.view.resetNodeCustomStyle(node);
                this.view.updateNode(node);
                this.layout.layout();
                this.view.show(false);
            }
        }
    }

    resize() {
        this.view.resize();
    }

    addEventListener(callback: any) {
        if (typeof callback === 'function') {
            this.eventHandles.push(callback);
        }
    }

    invokeEventHandle(type: any, data: { [propName: string]: any; }) {
        let evthandleLength = this.eventHandles.length;
        for (let i = 0; i < evthandleLength; i++) {
            this.eventHandles[i](type, data);
        }
    }
}