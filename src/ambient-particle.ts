import { Food, StarFood, RainbowFood, CrystalFood, PulsarFood } from './food';
import { Updateable, Drawable } from './types';

export class AmbientParticle implements Updateable, Drawable {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    speed: number;
    currentOpacity: number;
    pulse: number;
    rotationSpeed: number;
    angle: number;

    constructor() {
        this.x = Math.random() * 600;
        this.y = Math.random() * 1050;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 0.5 + 0.2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.size = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.3 + 0.1;
        this.currentOpacity = this.opacity;
        this.pulse = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    update(deltaTime: number): void {
        // Update position
        this.x += this.vx * deltaTime * 0.1;
        this.y += this.vy * deltaTime * 0.1;

        // Wrap around screen
        if (this.x < 0) this.x = 600;
        if (this.x > 600) this.x = 0;
        if (this.y < 0) this.y = 1050;
        if (this.y > 1050) this.y = 0;

        // Change direction occasionally
        if (Math.random() < 0.01) {
            this.angle += (Math.random() - 0.5) * Math.PI * 0.25;
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        // Update pulse
        this.pulse += 0.02;
        this.currentOpacity = this.opacity * (0.8 + Math.sin(this.pulse) * 0.2);
    }

    draw(ctx: CanvasRenderingContext2D, currentFood?: Food | null): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.currentOpacity;

        if (!currentFood) {
            this.drawDefaultParticle(ctx);
        } else if (currentFood instanceof StarFood) {
            this.drawStarParticle(ctx);
        } else if (currentFood instanceof RainbowFood) {
            this.drawRainbowParticle(ctx);
        } else if (currentFood instanceof CrystalFood) {
            this.drawCrystalParticle(ctx);
        } else if (currentFood instanceof PulsarFood) {
            this.drawPulsarParticle(ctx);
        }

        ctx.restore();
    }

    private drawDefaultParticle(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
        gradient.addColorStop(0, `rgba(76, 175, 80, ${this.currentOpacity})`);
        gradient.addColorStop(0.6, `rgba(76, 175, 80, ${this.currentOpacity * 0.3})`);
        gradient.addColorStop(1, `rgba(76, 175, 80, 0)`);
        ctx.fillStyle = gradient;
        ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawStarParticle(ctx: CanvasRenderingContext2D) {
        // Star-shaped particle with orange glow
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const nextAngle = ((i + 1) * Math.PI * 2) / 5 - Math.PI / 2;
            const r1 = this.size * 2;
            const r2 = this.size;

            const x1 = Math.cos(angle) * r1;
            const y1 = Math.sin(angle) * r1;
            const x2 = Math.cos((angle + nextAngle) / 2) * r2;
            const y2 = Math.sin((angle + nextAngle) / 2) * r2;

            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
        gradient.addColorStop(0, `rgba(255, 112, 67, ${this.currentOpacity})`);
        gradient.addColorStop(0.6, `rgba(244, 81, 30, ${this.currentOpacity * 0.3})`);
        gradient.addColorStop(1, `rgba(230, 74, 25, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private drawRainbowParticle(ctx: CanvasRenderingContext2D) {
        const hue = (Date.now() / 20 + this.x + this.y) % 360;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, ${this.currentOpacity})`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

        // Draw a rotating polygon
        ctx.beginPath();
        const sides = 3 + Math.floor((this.x + this.y) % 3); // 3, 4, or 5 sides
        for (let i = 0; i < sides; i++) {
            const angle = this.angle + (i * Math.PI * 2) / sides;
            const x = Math.cos(angle) * this.size * 2;
            const y = Math.sin(angle) * this.size * 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private drawCrystalParticle(ctx: CanvasRenderingContext2D) {
        // Hexagonal crystal shape
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = this.angle + (i * Math.PI * 2) / 6;
            const x = Math.cos(angle) * this.size * 2;
            const y = Math.sin(angle) * this.size * 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
        gradient.addColorStop(0, `rgba(227, 242, 253, ${this.currentOpacity})`);
        gradient.addColorStop(0.5, `rgba(100, 181, 246, ${this.currentOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(30, 136, 229, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add inner lines for crystal effect
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.currentOpacity * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.stroke();
    }

    private drawPulsarParticle(ctx: CanvasRenderingContext2D) {
        const pulseSize = this.size * (1 + Math.sin(this.pulse) * 0.3);
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize * 2, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize * 2);
        gradient.addColorStop(0, `rgba(224, 64, 251, ${this.currentOpacity})`);
        gradient.addColorStop(0.5, `rgba(156, 39, 176, ${this.currentOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(123, 31, 162, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add energy beams
        ctx.strokeStyle = `rgba(225, 190, 231, ${this.currentOpacity * 0.4})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
            const angle = this.angle + i * Math.PI;
            ctx.beginPath();
            ctx.moveTo(
                Math.cos(angle) * pulseSize,
                Math.sin(angle) * pulseSize
            );
            ctx.lineTo(
                Math.cos(angle) * pulseSize * 2,
                Math.sin(angle) * pulseSize * 2
            );
            ctx.stroke();
        }
    }
}
