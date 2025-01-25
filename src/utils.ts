export interface Rect {
    readonly x: number;
    readonly y: number;
    readonly s?: number;
}

const DEFAULT_SIZE = 50;

export function drawRect(ctx: CanvasRenderingContext2D, rect: Rect, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.s ?? DEFAULT_SIZE, rect.s ?? DEFAULT_SIZE);
}

export function randInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
}

export function shadeColor(color: string, percent: number): string {
    // Validate input
    if (!color.startsWith('#') || color.length !== 7) {
        throw new Error('Invalid color format. Expected "#RRGGBB"');
    }
    if (!Number.isFinite(percent)) {
        throw new Error('Percent must be a finite number');
    }

    const amt = Math.round(2.55 * percent);
    const rgb = hexToRgb(color);

    const newRgb: [number, number, number] = rgb.map(value => {
        const newValue = value + amt;
        return Math.min(255, Math.max(0, newValue));
    }) as [number, number, number];

    return rgbToHex(newRgb);
}

export function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        throw new Error('Invalid hex color format');
    }

    return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
    return '#' + [r, g, b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

export function drawGrid(ctx: CanvasRenderingContext2D): void {
    const GRID_COLOR = "#333";
    const LINE_WIDTH = 1;
    const CANVAS_WIDTH = 600;
    const CANVAS_HEIGHT = 1050;
    const CELL_SIZE = 50;
    const COLS = 12;
    const ROWS = 21;

    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = LINE_WIDTH;

    // Batch vertical lines
    ctx.beginPath();
    for (let i = 0; i <= COLS; i++) {
        const x = i * CELL_SIZE;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
    }
    ctx.stroke();

    // Batch horizontal lines
    ctx.beginPath();
    for (let i = 0; i <= ROWS; i++) {
        const y = i * CELL_SIZE;
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
    }
    ctx.stroke();
}
