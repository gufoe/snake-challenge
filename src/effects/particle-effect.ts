import { DrawableEffect } from '../types';

export class StarEffect implements DrawableEffect {
    draw(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const nextAngle = ((i + 1) * Math.PI * 2) / 5 - Math.PI / 2;
            const r1 = size;
            const r2 = size * 0.5;

            const x1 = x + Math.cos(angle) * r1;
            const y1 = y + Math.sin(angle) * r1;
            const x2 = x + Math.cos((angle + nextAngle) / 2) * r2;
            const y2 = y + Math.sin((angle + nextAngle) / 2) * r2;

            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fill();
    }
}

export class SparkEffect implements DrawableEffect {
    draw(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);
        ctx.stroke();
    }
}

export class BeamEffect implements DrawableEffect {
    draw(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        const gradient = ctx.createLinearGradient(x - size, y, x + size, y);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, ctx.fillStyle as string);
        gradient.addColorStop(1, 'transparent');

        const originalFillStyle = ctx.fillStyle;
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(x - size, y - size/4);
        ctx.lineTo(x + size, y - size/4);
        ctx.lineTo(x + size, y + size/4);
        ctx.lineTo(x - size, y + size/4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = originalFillStyle;
    }
}

export class CrystalEffect implements DrawableEffect {
    draw(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }
}

export class PolygonEffect implements DrawableEffect {
    constructor(private sides: number) {}

    draw(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        ctx.beginPath();
        for (let i = 0; i < this.sides; i++) {
            const angle = (i * Math.PI * 2) / this.sides - Math.PI / 2;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }
}

export class RainbowEffect implements DrawableEffect {
    draw(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        const hue = (Date.now() / 20 + x + y) % 360;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 1)`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

        const originalFillStyle = ctx.fillStyle;
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = originalFillStyle;
    }
}
