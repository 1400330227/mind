import { $createElement, $window } from "./utils/dom";

export class GraphCanvas extends HTMLCanvasElement {
    opts: any;
    canvas: HTMLCanvasElement
    canvasContext: CanvasRenderingContext2D
    size: { width: number, height: number };

    constructor(view: any) {
        super();
        this.opts = view.opts;
        this.canvas = <HTMLCanvasElement>$createElement('canvas');
        this.canvasContext = <CanvasRenderingContext2D>this.canvas.getContext('2d');
        this.size = { width: 0, height: 0 };
    }

    getCanvasElement(): HTMLCanvasElement {
        return this.canvas;
    }

    /**
     * 设定canvas面积
     * @param width canvas宽度
     * @param height canvas 长度
     */
    setSize(width: number, height: number): void {
        this.size.width = width;
        this.size.height = height;
    }

    /**
     * 清除canvas
     */
    clear() {
        this.canvasContext.clearRect(0, 0, this.size.width, this.size.height);
    }

    /**
     * 获取线型
     * @param pout
     * @param pin
     * @param offset
     * @constructor
     */
    drawLine(pout: { x: number, y: number }, pin: { x: number, y: number }, offset: { x: number, y: number }) {
        const ctx = this.canvasContext;
        ctx.strokeStyle = this.opts.line_color;
        ctx.lineWidth = this.opts.line_width;
        ctx.lineCap = 'round';
        this.bezierTo(ctx, pin.x + offset.x, pin.y + offset.y, pout.x + offset.x, pout.y + offset.y)
    }

    /**
     * 绘画贝塞尔曲线
     * @param ctx
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     */
    bezierTo(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1 + (x2 - x1) * 2 / 3, y1, x1, y2, x2, y2);
        ctx.closePath();
        ctx.stroke();
    }

    /**
     * 绘画直线
     * @param ctx
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     */
    lineTo(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.stroke();
    }

    /**
     * 绘制canvas
     * @param destCanvasContext
     * @param callback
     */
    copyTo(destCanvasContext: CanvasRenderingContext2D, callback?: () => void) {
        destCanvasContext.drawImage(this.canvas, 0, 0);
        if (callback) callback();
    }
}
