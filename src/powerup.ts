import { Particle } from './particle';

export abstract class PowerUp {
    x: number;
    y: number;
    rotation: number = 0;
    scale: number = 1;
    pulse: number = 0;
    glowIntensity: number = 20;
    lifespan: number = 10000; // 10 seconds lifespan
    spawnTime: number = Date.now();

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    update() {
        this.pulse = (this.pulse + 0.1) % (Math.PI * 2);
        this.rotation = (this.rotation + 0.02);
        this.scale = 1 + Math.sin(this.pulse) * 0.1;
        this.glowIntensity = 20 + Math.sin(this.pulse) * 10;
    }

    isExpired(): boolean {
        return Date.now() - this.spawnTime > this.lifespan;
    }

    abstract draw(ctx: CanvasRenderingContext2D): void;
    abstract createCollectEffect(x: number, y: number): Particle[];
    abstract applyEffect(snake: any): void;
}

// Extra Life (Heart-shaped)
export class ExtraLifePowerUp extends PowerUp {
    draw(ctx: CanvasRenderingContext2D) {
        const x = this.x * 50 + 25;
        const y = this.y * 50 + 25;
        const size = 20 * this.scale;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation);

        // Add glow effect
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = this.glowIntensity;

        // Draw heart
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(0, size/4);
        ctx.bezierCurveTo(size/4, -size/4, size, -size/4, size, size/4);
        ctx.bezierCurveTo(size, size/2, 0, size, 0, size);
        ctx.bezierCurveTo(0, size/2, -size, size/2, -size, size/4);
        ctx.bezierCurveTo(-size, -size/4, -size/4, -size/4, 0, size/4);
        ctx.fill();

        ctx.restore();
    }

    createCollectEffect(x: number, y: number): Particle[] {
        const particles: Particle[] = [];
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(x, y, '#ff6b6b', {
                speed: 2,
                size: 3,
                life: 40,
                shape: 'star'
            }));
        }
        return particles;
    }

    applyEffect(snake: any) {
        snake.lives = (snake.lives || 1) + 1;
    }
}

// Time Slow (Hourglass-shaped)
export class TimeSlowPowerUp extends PowerUp {
    draw(ctx: CanvasRenderingContext2D) {
        const x = this.x * 50 + 25;
        const y = this.y * 50 + 25;
        const size = 20 * this.scale;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation);

        // Add glow effect
        ctx.shadowColor = '#4fc3f7';
        ctx.shadowBlur = this.glowIntensity;

        // Draw hourglass
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.moveTo(-size/2, -size/2);
        ctx.lineTo(size/2, -size/2);
        ctx.lineTo(0, 0);
        ctx.lineTo(size/2, size/2);
        ctx.lineTo(-size/2, size/2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    createCollectEffect(x: number, y: number): Particle[] {
        const particles: Particle[] = [];
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(x, y, '#4fc3f7', {
                speed: 1.5,
                size: 4,
                life: 60,
                shape: 'spark'
            }));
        }
        return particles;
    }

    applyEffect(snake: any) {
        snake.moveInterval *= 1.5; // Slow down by 50%
        setTimeout(() => {
            snake.moveInterval /= 1.5; // Reset speed after 5 seconds
        }, 5000);
    }
}

// Ghost Mode (Cherry-shaped)
export class GhostPowerUp extends PowerUp {
    draw(ctx: CanvasRenderingContext2D) {
        const x = this.x * 50 + 25;
        const y = this.y * 50 + 25;
        const size = 15 * this.scale;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation);

        // Add glow effect
        ctx.shadowColor = '#ce93d8';
        ctx.shadowBlur = this.glowIntensity;

        // Draw cherry
        ctx.fillStyle = '#ce93d8';
        ctx.beginPath();
        ctx.arc(-size/2, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size/2, 0, size, 0, Math.PI * 2);
        ctx.fill();

        // Draw stems
        ctx.strokeStyle = '#81c784';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-size/2, -size);
        ctx.quadraticCurveTo(0, -size * 2, size/2, -size);
        ctx.stroke();

        ctx.restore();
    }

    createCollectEffect(x: number, y: number): Particle[] {
        const particles: Particle[] = [];
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(x, y, '#ce93d8', {
                speed: 2,
                size: 3,
                life: 50,
                shape: 'circle'
            }));
        }
        return particles;
    }

    applyEffect(snake: any) {
        snake.isGhostMode = true;
        setTimeout(() => {
            snake.isGhostMode = false;
        }, 7000);
    }
}

export const powerUpTypes = [
    ExtraLifePowerUp,
    TimeSlowPowerUp,
    GhostPowerUp
];
