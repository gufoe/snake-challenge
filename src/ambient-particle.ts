import { Food, StarFood, RainbowFood, CrystalFood, PulsarFood } from './food';

export class AmbientParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    speed: number;
    pulse: number;
    angle: number;
    rotationSpeed: number;
    currentOpacity: number;

    constructor() {
        this.x = Math.random() * 600;
        this.y = Math.random() * 1050;
        this.speed = 0.2 + Math.random() * 0.3;
        this.angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.size = 1 + Math.random() * 2;
        this.opacity = 0.1 + Math.random() * 0.2;
        this.currentOpacity = this.opacity;
        this.pulse = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    update() {
        // Move particle
        this.x += this.vx;
        this.y += this.vy;

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

    draw(ctx: CanvasRenderingContext2D, currentFood: Food) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (currentFood instanceof StarFood) {
            this.drawStarParticle(ctx);
        } else if (currentFood instanceof RainbowFood) {
            this.drawRainbowParticle(ctx);
        } else if (currentFood instanceof CrystalFood) {
            this.drawCrystalParticle(ctx);
        } else if (currentFood instanceof PulsarFood) {
            this.drawPulsarParticle(ctx);
        } else {
            this.drawDefaultParticle(ctx);
        }

        ctx.restore();
    }

    private drawStarParticle(ctx: CanvasRenderingContext2D) {
        const points = 5;
        const outerRadius = this.size;
        const innerRadius = this.size * 0.4;

        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, `rgba(255, 255, 200, ${this.currentOpacity})`);
        gradient.addColorStop(1, `rgba(255, 200, 100, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private drawRainbowParticle(ctx: CanvasRenderingContext2D) {
        const hue = (Date.now() / 20 + this.x + this.y) % 360;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${this.currentOpacity})`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private drawCrystalParticle(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(0, -this.size);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size);
        ctx.closePath();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, `rgba(200, 255, 255, ${this.currentOpacity})`);
        gradient.addColorStop(1, `rgba(100, 200, 255, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private drawPulsarParticle(ctx: CanvasRenderingContext2D) {
        const size = this.size * (1 + Math.sin(this.pulse) * 0.3);
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, `rgba(150, 255, 255, ${this.currentOpacity})`);
        gradient.addColorStop(1, `rgba(0, 150, 255, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private drawDefaultParticle(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.currentOpacity})`);
        gradient.addColorStop(1, `rgba(200, 200, 200, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}
