export interface Rect {
    x: number;
    y: number;
    s?: number;
}

export function drawRect(ctx: CanvasRenderingContext2D, rect: Rect, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.s || 50, rect.s || 50);
}

export function randInt(max: number): number {
    return Math.floor(Math.random() * max);
}

export function shadeColor(color: string, percent: number) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

export function hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

export function drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 50, 0);
        ctx.lineTo(i * 50, 500);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * 50);
        ctx.lineTo(500, i * 50);
        ctx.stroke();
    }
}
