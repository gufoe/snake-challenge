import { Particle } from './particle';

export abstract class Food {
    x: number;
    y: number;
    rotation: number = 0;
    scale: number = 1;
    pulse: number = 0;
    glowIntensity: number = 20;

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

    abstract draw(ctx: CanvasRenderingContext2D): void;
    abstract createEatEffect(x: number, y: number): Particle[];
    abstract get points(): number;
}

export class StarFood extends Food {
    draw(ctx: CanvasRenderingContext2D) {
        const centerX = this.x * 50 + 25;
        const centerY = this.y * 50 + 25;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        ctx.shadowColor = "#FF5722";
        ctx.shadowBlur = this.glowIntensity;

        // Draw star shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const nextAngle = ((i + 1) * Math.PI * 2) / 5 - Math.PI / 2;
            const outerX = Math.cos(angle) * 18;
            const outerY = Math.sin(angle) * 18;
            const innerX = Math.cos((angle + nextAngle) / 2) * 8;
            const innerY = Math.sin((angle + nextAngle) / 2) * 8;

            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(-8, -8, 0, 0, 0, 20);
        gradient.addColorStop(0, '#FF7043');
        gradient.addColorStop(0.6, '#FF5722');
        gradient.addColorStop(1, '#F4511E');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Orbital dots
        ctx.fillStyle = '#FFB74D';
        for (let i = 0; i < 4; i++) {
            const angle = this.rotation * 2 + (i * Math.PI * 2) / 4;
            const x = Math.cos(angle) * 25;
            const y = Math.sin(angle) * 25;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    createEatEffect(x: number, y: number): Particle[] {
        const particles: Particle[] = [];
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(x, y, 'rgb(255, 87, 34)', {
                speed: 2,
                size: 5,
                life: 40,
                shape: 'star'
            }));
        }
        return particles;
    }

    get points() { return 1; }
}

export class RainbowFood extends Food {
    private hue: number = 0;

    update() {
        super.update();
        this.hue = (this.hue + 1) % 360;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const centerX = this.x * 50 + 25;
        const centerY = this.y * 50 + 25;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
        ctx.shadowBlur = this.glowIntensity;

        // Draw spiral
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 15;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${(this.hue + i * 60) % 360}, 100%, 50%)`;
            ctx.fill();
        }

        ctx.restore();
    }

    createEatEffect(x: number, y: number): Particle[] {
        const particles: Particle[] = [];
        for (let i = 0; i < 36; i++) {
            const hue = (this.hue + i * 10) % 360;
            particles.push(new Particle(x, y, `hsl(${hue}, 100%, 50%)`, {
                speed: 3,
                size: 4,
                life: 50,
                shape: 'circle'
            }));
        }
        return particles;
    }

    get points() { return 1; }
}

export class CrystalFood extends Food {
    draw(ctx: CanvasRenderingContext2D) {
        const centerX = this.x * 50 + 25;
        const centerY = this.y * 50 + 25;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        ctx.shadowColor = "#64B5F6";
        ctx.shadowBlur = this.glowIntensity;

        // Draw hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const x = Math.cos(angle) * 15;
            const y = Math.sin(angle) * 15;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        gradient.addColorStop(0, '#E3F2FD');
        gradient.addColorStop(0.5, '#64B5F6');
        gradient.addColorStop(1, '#1E88E5');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI) / 3;
            ctx.beginPath();
            ctx.moveTo(-15 * Math.cos(angle), -15 * Math.sin(angle));
            ctx.lineTo(15 * Math.cos(angle), 15 * Math.sin(angle));
            ctx.stroke();
        }

        ctx.restore();
    }

    createEatEffect(x: number, y: number): Particle[] {
        const particles: Particle[] = [];
        for (let i = 0; i < 12; i++) {
            particles.push(new Particle(x, y, '#64B5F6', {
                speed: 2,
                size: 8,
                life: 45,
                shape: 'spark'
            }));
        }
        // Add some sparkles
        for (let i = 0; i < 15; i++) {
            particles.push(new Particle(x, y, '#E3F2FD', {
                speed: 1,
                size: 3,
                life: 30,
                shape: 'circle'
            }));
        }
        return particles;
    }

    get points() { return 1; }
}

export class PulsarFood extends Food {
    private innerRotation = 0;
    private outerRotation = 0;

    update() {
        super.update();
        this.innerRotation = (this.innerRotation + 0.03) % (Math.PI * 2);
        this.outerRotation = (this.outerRotation - 0.02) % (Math.PI * 2);
    }

    draw(ctx: CanvasRenderingContext2D) {
        const centerX = this.x * 50 + 25;
        const centerY = this.y * 50 + 25;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(this.scale, this.scale);

        // Outer glow
        ctx.shadowColor = "#9C27B0";
        ctx.shadowBlur = this.glowIntensity;

        // Draw outer ring
        ctx.strokeStyle = "#E1BEE7";
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = this.outerRotation + (i * Math.PI * 2) / 8;
            const x = Math.cos(angle) * 20;
            const y = Math.sin(angle) * 20;
            ctx.beginPath();
            ctx.moveTo(x * 0.7, y * 0.7);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Draw inner core
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
        gradient.addColorStop(0, '#E040FB');
        gradient.addColorStop(0.6, '#9C27B0');
        gradient.addColorStop(1, '#7B1FA2');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw energy beams
        ctx.strokeStyle = 'rgba(225, 190, 231, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = this.innerRotation + (i * Math.PI * 2) / 4;
            const x = Math.cos(angle) * 12;
            const y = Math.sin(angle) * 12;
            ctx.beginPath();
            ctx.moveTo(-x, -y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    createEatEffect(x: number, y: number): Particle[] {
        const particles: Particle[] = [];
        for (let i = 0; i < 16; i++) {
            particles.push(new Particle(x, y, '#E040FB', {
                speed: 3,
                size: 6,
                life: 35,
                shape: 'spark'
            }));
        }

        // Add some purple sparkles
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(x, y, '#E1BEE7', {
                speed: 1.5,
                size: 3,
                life: 45,
                shape: 'circle'
            }));
        }
        return particles;
    }

    get points() { return 1; }
}

export const foodTypes = [StarFood, RainbowFood, CrystalFood, PulsarFood];
