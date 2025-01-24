import { Food, StarFood, RainbowFood, CrystalFood, PulsarFood } from './food';

export class AmbientParticle {
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    speed: number;
    pulse: number;
    angle: number = Math.random() * Math.PI * 2;
    rotationSpeed: number = (Math.random() - 0.5) * 0.02;
    currentOpacity: number = 0;

    constructor(public x: number, public y: number) {
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 4 + 1;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.speed = Math.random() * 0.3 + 0.1;
        this.pulse = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;

        // Wrap around screen
        if (this.x < 0) this.x = 1050;
        if (this.x > 1050) this.x = 0;
        if (this.y < 0) this.y = 1050;
        if (this.y > 1050) this.y = 0;

        // Slowly change direction
        const angle = Math.sin(Date.now() / 2000) * 0.02;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const vx = this.vx * cos - this.vy * sin;
        const vy = this.vx * sin + this.vy * cos;
        this.vx = vx;
        this.vy = vy;

        // Pulsing effect
        this.pulse += 0.02;
        const pulseOpacity = this.opacity * (0.7 + 0.3 * Math.sin(this.pulse));
        this.currentOpacity = pulseOpacity;

        // Rotate
        this.angle += this.rotationSpeed;
    }

    draw(ctx: CanvasRenderingContext2D, currentFood: Food) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Get current food type for styling
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
        const outerRadius = this.size * 2;
        const innerRadius = this.size;

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

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
        gradient.addColorStop(0, `rgba(255, 87, 34, ${this.currentOpacity})`);
        gradient.addColorStop(1, `rgba(255, 87, 34, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private drawRainbowParticle(ctx: CanvasRenderingContext2D) {
        const hue = (Date.now() / 20 + this.x + this.y) % 360;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, ${this.currentOpacity})`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private drawCrystalParticle(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(0, -this.size * 2);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size * 2);
        ctx.closePath();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
        gradient.addColorStop(0, `rgba(100, 181, 246, ${this.currentOpacity})`);
        gradient.addColorStop(0.5, `rgba(100, 181, 246, ${this.currentOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(100, 181, 246, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private drawPulsarParticle(ctx: CanvasRenderingContext2D) {
        const size = this.size * (1 + Math.sin(this.pulse) * 0.3);
        ctx.beginPath();
        ctx.arc(0, 0, size * 2, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
        gradient.addColorStop(0, `rgba(156, 39, 176, ${this.currentOpacity})`);
        gradient.addColorStop(0.5, `rgba(156, 39, 176, ${this.currentOpacity * 0.3})`);
        gradient.addColorStop(1, `rgba(156, 39, 176, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
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
}

export function createAmbientParticles(): AmbientParticle[] {
    return [
        // Background layer (slower, larger particles)
        ...Array(50).fill(0).map(() => {
            const p = new AmbientParticle(Math.random() * 1050, Math.random() * 1050);
            p.speed *= 0.5;
            p.size *= 2;
            p.opacity *= 0.7;
            return p;
        }),
        // Middle layer
        ...Array(75).fill(0).map(() =>
            new AmbientParticle(Math.random() * 1050, Math.random() * 1050)
        ),
        // Foreground layer (faster, smaller particles)
        ...Array(25).fill(0).map(() => {
            const p = new AmbientParticle(Math.random() * 1050, Math.random() * 1050);
            p.speed *= 1.5;
            p.size *= 0.7;
            p.opacity *= 1.2;
            return p;
        })
    ];
}
