export function drawRect(ctx: CanvasRenderingContext2D, r: Rect, fill: string) {
    ctx.fillStyle = fill;
    ctx.fillRect(r.x, r.y, r.s, r.s);
}
export function randInt(max: number) {
    return Math.floor(Math.random() * max);
}
export interface Rect {
    x: number;
    y: number;
    s: number;
}