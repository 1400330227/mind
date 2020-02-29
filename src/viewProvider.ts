import { JsMind, Options } from "./jsMind";
import { LayoutProvider } from "./layoutProvider";
import { isElement, $createElement, addEvent, $innerHtml, $textNode, $document } from "./utils/dom";
import { GraphCanvas } from "./graph";
import { MindNode } from "./node";
import { isEmpty } from "./utils/config";

export class ViewProvider {

    jsMind: JsMind;
    options: Options;
    layout: LayoutProvider;
    container: HTMLElement | string;
    elementPanel: HTMLElement;
    elementNodes: HTMLElement;
    size: { width: number, height: number; };
    elementEditor: HTMLInputElement;
    elementEditingNode: MindNode;
    selectedNode: MindNode;
    graph: GraphCanvas;
    actualZoom: number;
    zoomStep: number;
    minZoom: number;
    maxZoom: number;

    constructor(jsMind: JsMind, options: Options) {
        this.options = options;
        this.jsMind = jsMind;
        this.layout = jsMind.layout;

        this.container = null;
        this.elementPanel = null;
        this.elementNodes = null;

        this.size = { width: 0, height: 0 };

        this.selectedNode = null;
        this.elementEditingNode = null;
        this.graph = null;
    }

    init() {
        console.debug('view 初始化');
        this.container = isElement(this.options.container) ? this.options.container : $createElement(this.options.container);

        if (!this.container) {
            console.error('无法创建视图容器 ViewProvider');
            return;
        }

        this.elementPanel = <HTMLDivElement>$createElement('div');
        this.elementNodes = $createElement('jmNodes');
        this.elementEditor = <HTMLInputElement>$createElement('input');
        this.graph = ((this.options.engine as string).toLowerCase() === 'canvas') ? new GraphCanvas(this) : null;

        this.elementPanel.className = 'jsMind-inner';
        this.elementPanel.insertBefore(this.graph.getCanvasElement(), null);
        this.elementPanel.insertBefore(this.elementNodes, null);

        this.elementEditor.className = 'jsMind-editor';
        this.elementEditor.type = 'text';

        this.actualZoom = 1;
        this.zoomStep = 0.1;
        this.minZoom = 0.5;
        this.maxZoom = 2;
        const view = this;
        addEvent(this.elementEditor, 'keydown', (event: KeyboardEvent) => {
            if (event.keyCode === 13) {
                this.editNodeEnd();
                event.stopPropagation();
            }
        });
        addEvent(this.elementEditor, 'blur', function (e: Event) {
            view.editNodeEnd();
        });
        this.container.appendChild(this.elementPanel);
    }

    addEvent(obj: Object, eventName: string, eventHandle: (event: Event) => void) {
        addEvent(this.elementNodes, eventName, function (e) {
            const evt = e || event;
            eventHandle.call(obj, evt);
        });
    }

    getBindedNodeId(element: HTMLElement) {
        const targetName = element.tagName;
        if (targetName === 'jmNodes' || targetName === 'body' || targetName === 'html') {
            return null;
        }

        if (targetName === 'jmNode' || targetName === 'jmExpander') {
            return element.getAttribute('nodeId');
        } else {
            return this.getBindedNodeId(element.parentElement);
        }
    }

    isExpander(element: HTMLElement) {
        return (element.tagName === 'jmExpander');
    }

    reset() {
        console.debug('视图，重置');
        this.selectedNode = null;
        this.clearLines();
        this.clearNodes();
        this.resetTheme();
    }

    resetTheme() {
        const themeName = this.jsMind.options.theme;
        if (themeName) {
            this.elementNodes.className = `theme-themeName`;
        } else {
            this.elementNodes.className = '';
        }
    }

    resetCustomStyle() {
        const nodes = this.jsMind.mind.nodes;
        for (let nodeId in nodes) {
            this.resetNodeCustomStyle(nodes[nodeId]);
        }
    }

    load() {
        console.debug('视图，加载');
    }

    /**
     * 缩放面板节点
     */
    expandSize() {
        const mindSize = this.layout.getMinSize();
        const minWidth = mindSize.w + this.options.hMargin * 2;
        const minHeight = mindSize.w + this.options.vMargin * 2;
        let clientWidth = this.elementPanel.clientWidth;
        let clientHeight = this.elementPanel.clientHeight;

        if (clientWidth < minWidth) {
            clientWidth = minWidth;
        }
        if (clientHeight < minHeight) {
            clientHeight = minHeight;
        }

        this.size.width = clientWidth;
        this.size.height = clientHeight;
    }

    initNodesSize(node: MindNode) {
        const viewData = node._data.view;
        viewData.width = viewData.element.clientWidth;
        viewData.height = viewData.element.clientHeight;
    }

    initNodes() {
        const nodes = this.jsMind.mind.nodes;
        const docFrag = $document.createDocumentFragment();
        for (let nodeId in nodes) {
            if ((nodes as Object).hasOwnProperty(nodeId)) {
                this.createNodeElement(nodes[nodeId], docFrag);
            }
        }

        this.elementNodes.appendChild(docFrag);

        for (let nodeId in nodes) {
            if ((nodes as Object).hasOwnProperty(nodeId)) {
                this.initNodesSize(nodes[nodeId]);
            }
        }
    }

    addNode(node: MindNode) {
        this.createNodeElement(node, this.elementNodes);
        this.initNodesSize(node);
    }

    createNodeElement(node: MindNode, parendNode: HTMLElement | DocumentFragment) {
        let viewData = null;
        if (node._data?.view) {
            viewData = node._data.view;
        } else {
            viewData = {};
            node._data.view = viewData;
        }

        const jmNode = $createElement('jmNode');
        if (node.isroot) {
            jmNode.className = 'root';
        } else {
            const jmExpander = $createElement('jmExpander');
            $textNode(jmExpander, '-');
            jmExpander.setAttribute('nodeId', node.id);
            jmExpander.style.visibility = 'hidden';
            parendNode.appendChild(jmExpander);
            viewData.expander = jmExpander;
        }

        if (node.topic) {
            if (this.options.supportHtml) {
                $innerHtml(jmNode, node.topic);
            } else {
                $textNode(jmNode, node.topic);
            }
        }

        jmNode.setAttribute('nodeId', node.id);
        jmNode.style.visibility = 'hidden';
        this._resetNodeCustomStyle(jmNode, node.data);

        parendNode.appendChild(jmNode);
        viewData.element = jmNode;
    }

    removeNode(node: MindNode) {
        if (this.selectedNode !== null && this.selectedNode.id === node.id) {
            this.selectedNode = null;
        }
        if (this.elementEditingNode !== null && this.elementEditingNode.id === node.id) {
            node._data.view.element.removeChild(this.elementEditor);
            this.elementEditingNode = null;
        }

        const children = node.children;
        let childrenLength = children.length;

        while (childrenLength--) {
            this.removeNode(children[childrenLength]);
        }
        if (node._data.view) {
            const element = node._data.view.element;
            const expander = node._data.view.expander;
            this.elementNodes.removeChild(element);
            this.elementNodes.removeChild(expander);
            node._data.view.element = null;
            node._data.view.expander = null;
        }
    }

    updateNode(node: MindNode) {
        const viewData = node._data.view;
        const element = viewData.element;
        if (node.topic) {
            if (this.options.supportHtml) {
                $innerHtml(element, node.topic);
            } else {
                $textNode(element, node.topic);
            }
        }
        viewData.width = element.clientWidth;
        viewData.height = element.clientHeight;
    }

    selectNode(node: MindNode) {
        if (this.selectedNode) {
            this.selectedNode._data.view.element.className =
                this.selectedNode._data.view.element.className.replace(/\s*selected\b/i, '');
            this.resetNodeCustomStyle(this.selectedNode);
        }
        this.selectedNode = node;
        node._data.view.element.className += 'selected';
        this.clearNodeCustomStyle(node);
    }

    selectClear() {
        this.selectNode(null);
    }

    getEditingNode() {
        return this.elementEditingNode;
    }

    isEditing() {
        return this.elementEditingNode;
    }

    editNodeBegin(node: MindNode) {
        if (!node.topic) {
            console.warn('失败，不能编辑节点');
        }
        if (this.elementEditingNode) {
            this.editNodeEnd();
        }
        this.elementEditingNode = node;
        const viewData = node._data.view;
        const element = viewData.element;
        const topic = node.topic;
        const elementComputedStyle = getComputedStyle(element);
        this.elementEditor.value = topic;
        this.elementEditor.style.width = (element.clientWidth - parseInt(elementComputedStyle.getPropertyValue('padding-left')) - parseInt(elementComputedStyle.getPropertyValue('padding-right'))) + 'px';
        element.innerHTML = '';
        element.appendChild(this.elementEditor);
        element.style.zIndex = '5';
        this.elementEditor.focus();
        this.elementEditor.select();
    }

    editNodeEnd() {
        if (this.elementEditingNode) {
            const node = this.elementEditingNode;
            this.elementEditingNode = null;
            const viewData = node._data.view;
            const element = viewData.element;
            const topic = this.elementEditor.value;
            element.style.zIndex = 'auto';
            element.removeChild(this.elementEditor);

            if (isEmpty(topic) || node.topic === topic) {
                if (this.options.supportHtml) {
                    $innerHtml(element, node.topic);
                } else {
                    $textNode(element, node.topic);
                }
            } else {
                this.jsMind.updateNode(node.id, topic);
            }
        }
    }

    getViewOffset() {
        const bounds = this.layout.bounds;
        const x = (this.size.width - bounds.e - bounds.w) / 2;
        const y = this.size.height / 2;
        return { x, y };
    }

    resize() {
        this.graph.setSize(1, 1);
        this.elementNodes.style.width = '1px';
        this.elementNodes.style.height = '1px';

        this.expandSize();
        this._show();
    }

    /**
     * 显示视图
     */
    _show() {
        this.graph.setSize(this.size.width, this.size.height);
        this.elementNodes.style.width = `${this.size.width}px`;
        this.elementNodes.style.height = `${this.size.height}px`;
        this.showNodes();
        this.showLines();
        this.jsMind.invokeEventHandle(JsMind.eventType.resize, { data: [] });
    }

    zoomIn() {
        return this.setZoom(this.actualZoom + this.zoomStep);
    }

    zoomOut() {
        return this.setZoom(this.actualZoom - this.zoomStep);
    }

    setZoom(zoom: number): boolean {
        if ((zoom < this.minZoom) || (zoom > this.maxZoom)) {
            return false;
        }
        this.actualZoom = zoom;
        for (let i = 0; i < this.elementPanel.children.length; i++) {
            (this.elementPanel.children[i] as HTMLElement).style.transform = `scale(${zoom})`;
        }
        this.show(true);
        return true;
    }

    centerRoot() {
        const outerWidth = this.elementPanel.clientWidth;
        const outerHeight = this.elementPanel.clientHeight;

        if (this.size.width > outerWidth) {
            const offset = this.getViewOffset();
            this.elementPanel.scrollLeft = offset.x - outerWidth / 2;
        }
        if (this.size.height > outerHeight) {
            this.elementPanel.scrollTop = this.size.height - outerHeight / 2;
        }
    }

    show(keepCenter: boolean) {
        console.debug('视图，显示');
        this.expandSize();
        this._show();
        if (keepCenter) {
            this.centerRoot();
        }
    }

    relayOut() {
        this.expandSize();
        this._show();
    }

    saveLacation(node: MindNode) {
        const viewData = node._data.view;
        viewData.saveLocation = {
            x: parseInt(viewData.element.style.left) - this.elementPanel.scrollLeft,
            y: parseInt(viewData.element.style.top) - this.elementPanel.scrollTop
        };
    }

    restoreLocation(node: MindNode) {
        const viewData = node._data.view;
        this.elementPanel.scrollLeft = parseInt(viewData.element.style.left) - viewData.saveLocation.x;
        this.elementPanel.scrollTop = parseInt(viewData.element.style.top) - viewData.saveLocation.y;
    }

    clearNodes() {
        const mind = this.jsMind.mind;
        if (!mind) {
            return;
        }

        const nodes = mind.nodes;
        let node = null;

        for (let nodeId in nodes) {
            if ((nodes as Object).hasOwnProperty(nodeId)) {
                node = nodes[nodeId];
                node._data.view.element = null;
                node._data.view.expander = null;
            }
            this.elementNodes.innerHTML = '';
        }
    }

    showNodes() {
        const nodes = this.jsMind.mind.nodes;
        let node: MindNode = null;
        let nodeElement: HTMLElement = null;
        let expander = null;
        let point = null;
        let pointExpander = null;
        let expanderText = '-';
        let viewData = null;

        let offset = this.getViewOffset();
        for (let nodeId in nodes) {
            if ((nodes as Object).hasOwnProperty(nodeId)) {
                node = nodes[nodeId];
                viewData = node._data.view;
                nodeElement = viewData.element;
                expander = viewData.expander;
                if (!this.layout.isVisible(node)) {
                    nodeElement.style.display = 'none';
                    expander.style.display = 'none';
                    continue;
                }

                this.resetNodeCustomStyle(node);
                point = this.layout.getNodePoint(node);
                viewData.absX = offset.x + point.x;
                viewData.absY = offset.y + point.y;
                nodeElement.style.left = (offset.x = point.x) + 'px';
                nodeElement.style.top = (offset.y = point.y) + 'px';
                nodeElement.style.display = '';
                nodeElement.style.visibility = 'visible';

                if (!node.isroot && node.children.length > 0) {
                    expanderText = node.expanded ? '-' : '+';
                    pointExpander = this.layout.getExpanderPoint(node);
                    expander.style.left = (offset.x + pointExpander.x) + 'px';
                    expander.style.top = (offset.y + pointExpander.y) + 'px';
                    expander.style.display = '';
                    expander.style.visibility = 'visible';

                    $textNode(expander, expanderText);
                }

                if (!node.isroot && node.children.length === 0) {
                    expander.style.display = 'none';
                    expander.style.visibility = 'hidden';
                }
            }
        }
    }

    resetNodeCustomStyle(node: MindNode) {
        this._resetNodeCustomStyle(node._data.view.element, node.data);
    }

    _resetNodeCustomStyle(nodeElement: HTMLElement, nodeData: any) {
        if ('background-color' in nodeData) {
            nodeElement.style.backgroundColor = nodeData['background-color'];
        }
        if ('foreground-color' in nodeData) {
            nodeElement.style.color = nodeData['foreground-color'];
        }
        if ('width' in nodeData) {
            nodeElement.style.width = nodeData['width'];
        }
        if ('height' in nodeData) {
            nodeElement.style.height = nodeData['height'];
        }
        if ('font-size' in nodeData) {
            nodeElement.style.fontSize = nodeData['font-size'];
        }
        if ('font-weight' in nodeData) {
            nodeElement.style.fontWeight = nodeData['font-weight'];
        }
        if ('font-style' in nodeData) {
            nodeElement.style.fontStyle = nodeData['font-style'];
        }
        if ('background-image' in nodeData) {
            const backgroundImage: string = nodeData['background-image'];

            if (backgroundImage.startsWith('data') && nodeData['width'] && nodeData['height']) {
                const image = new Image();

                image.onload = function () {
                    const canvas = <HTMLCanvasElement>$createElement('canvas');
                    canvas.width = nodeElement.clientWidth;
                    canvas.height = nodeElement.clientWidth;
                    const _this = this;
                    if (canvas.getContext) {
                        const context = canvas.getContext('2d');
                        context.drawImage(image, 2, 2, nodeElement.clientWidth, nodeElement.clientHeight);
                        const scaleImageData = canvas.toDataURL();
                        nodeElement.style.backgroundImage = `url(${scaleImageData})`;
                    }
                };
                image.src = backgroundImage;
            } else {
                nodeElement.style.backgroundImage = `url(${backgroundImage})`;
            }
            nodeElement.style.backgroundSize = '99%';

            if ('background-rotation' in nodeData) {
                if ((nodeData as Object).hasOwnProperty('background-rotation')) {
                    nodeElement.style.transform = `rotate(${nodeData['background-rotation']}deg)`;
                }
            }
        }
    }

    clearNodeCustomStyle(node: MindNode) {
        const nodeElement = node._data.view.element;
        nodeElement.style.backgroundColor = '';
        nodeElement.style.color = '';
    }

    clearLines() {
        this.graph.clear();
    }

    showLines() {
        this.clearLines();
        const nodes = this.jsMind.mind.nodes;
        let node: MindNode = null;
        let pointIn = null;
        let pointOut = null;
        const offset = this.getViewOffset();

        for (let nodeId in nodes) {
            if ((nodes as Object).hasOwnProperty(nodeId)) {
                node = nodes[nodeId];
                if (node.isroot) {
                    continue;
                }
                if (('visible' in node._data.layout) && (!node._data.layout.visible)) {
                    continue;
                }
                pointIn = this.layout.getNodePointIn(node);
                pointOut = this.layout.getNodePointOut(node.parent);
                this.graph.drawLine(pointOut, pointIn, offset);
            }
        }
    }
}