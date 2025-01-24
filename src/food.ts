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
    abstract createEatEffect(particles: Particle[]): void;
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

    createEatEffect(particles: Particle[]) {
        // Main explosion
        for (let i = 0; i < 40; i++) {
            const angle = (i / 40) * Math.PI * 2;
            particles.push(new Particle(this.x * 50 + 25, this.y * 50 + 25, 'rgb(255, 255, 100)', {
                speed: 3 + Math.random() * 2,
                size: 8 + Math.random() * 4,
                life: 50 + Math.random() * 20,
                shape: 'star',
                angle,
                spin: true,
                trail: Math.random() < 0.3
            }));
        }

        // Sparkle burst
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(this.x * 50 + 25, this.y * 50 + 25, 'rgb(255, 255, 200)', {
                speed: 2,
                size: 4,
                life: 30,
                shape: 'spark',
                shimmer: true
            }));
        }
    }

    get points() { return 1; }
}

export class RainbowFood extends Food {
    private hue: number = 0;
    private orbitAngle: number = 0;

    update() {
        super.update();
        this.hue = (this.hue + 1.5) % 360;
        this.orbitAngle = (this.orbitAngle + 0.03) % (Math.PI * 2);
    }

    private drawPolygon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number, rotation: number = 0) {
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = rotation + (i * Math.PI * 2) / sides;
            const pointX = x + Math.cos(angle) * radius;
            const pointY = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(pointX, pointY);
            else ctx.lineTo(pointX, pointY);
        }
        ctx.closePath();
    }

    draw(ctx: CanvasRenderingContext2D) {
        const centerX = this.x * 50 + 25;
        const centerY = this.y * 50 + 25;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        // Enhanced glow effect
        ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
        ctx.shadowBlur = this.glowIntensity * 1.2;

        // Draw orbiting rainbow shapes
        const orbCount = 6;
        for (let i = 0; i < orbCount; i++) {
            const angle = this.orbitAngle + (i / orbCount) * Math.PI * 2;
            const radius = 15;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // Draw connecting lines
            if (i > 0) {
                const prevAngle = this.orbitAngle + ((i - 1) / orbCount) * Math.PI * 2;
                const prevX = Math.cos(prevAngle) * radius;
                const prevY = Math.sin(prevAngle) * radius;

                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(x, y);
                ctx.strokeStyle = `hsla(${(this.hue + i * 60) % 360}, 100%, 75%, 0.4)`;
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            // Draw alternating shapes
            const shapeRotation = this.orbitAngle * 2 + (i * Math.PI * 2) / orbCount;
            if (i % 3 === 0) {
                // Triangle
                this.drawPolygon(ctx, x, y, 10, 3, shapeRotation);
            } else if (i % 3 === 1) {
                // Square
                this.drawPolygon(ctx, x, y, 8, 4, shapeRotation);
            } else {
                // Pentagon
                this.drawPolygon(ctx, x, y, 8, 5, shapeRotation);
            }

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 10);
            gradient.addColorStop(0, `hsla(${(this.hue + i * 60) % 360}, 100%, 90%, 1)`);
            gradient.addColorStop(0.6, `hsla(${(this.hue + i * 60) % 360}, 100%, 60%, 1)`);
            gradient.addColorStop(1, `hsla(${(this.hue + i * 60) % 360}, 100%, 45%, 1)`);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Draw center shape - rotating hexagon
        this.drawPolygon(ctx, 0, 0, 10, 6, this.orbitAngle * 1.5);
        const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
        centerGradient.addColorStop(0, 'white');
        centerGradient.addColorStop(0.5, `hsl(${this.hue}, 100%, 75%)`);
        centerGradient.addColorStop(1, `hsl(${this.hue}, 100%, 50%)`);
        ctx.fillStyle = centerGradient;
        ctx.fill();

        ctx.restore();
    }

    createEatEffect(particles: Particle[]) {
        // Rainbow spiral burst
        for (let i = 0; i < 60; i++) {
            const angle = (i / 60) * Math.PI * 4; // Two full rotations for spiral
            const hue = (i / 60) * 360;
            const shapes: ('triangle' | 'square' | 'pentagon')[] = ['triangle', 'square', 'pentagon'];
            particles.push(new Particle(this.x * 50 + 25, this.y * 50 + 25, `hsl(${hue}, 100%, 60%)`, {
                speed: 2 + (i / 60) * 3,
                size: 6 + Math.random() * 4,
                life: 40 + Math.random() * 20,
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                angle,
                spin: true,
                rainbow: true,
                trail: Math.random() < 0.3
            }));
        }

        // Sparkle particles
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(this.x * 50 + 25, this.y * 50 + 25, 'rgb(255, 255, 255)', {
                speed: 1 + Math.random() * 2,
                size: 3,
                life: 30,
                shape: 'spark',
                shimmer: true,
                rainbow: true
            }));
        }
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

    createEatEffect(particles: Particle[]) {
        // Crystal shards
        for (let i = 0; i < 36; i++) {
            const angle = (i / 36) * Math.PI * 2;
            particles.push(new Particle(this.x * 50 + 25, this.y * 50 + 25, 'rgb(200, 220, 255)', {
                speed: 2 + Math.random() * 3,
                size: 10 + Math.random() * 5,
                life: 45 + Math.random() * 20,
                shape: 'crystal',
                angle,
                spin: true,
                shimmer: true,
                trail: Math.random() < 0.4
            }));
        }

        // Energy lines
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            particles.push(new Particle(this.x * 50 + 25, this.y * 50 + 25, 'rgb(150, 200, 255)', {
                speed: 4,
                size: 15,
                life: 30,
                shape: 'beam',
                angle,
                shimmer: true
            }));
        }

        // Sparkles
        for (let i = 0; i < 25; i++) {
            particles.push(new Particle(this.x * 50 + 25, this.y * 50 + 25, 'rgb(220, 240, 255)', {
                speed: 1 + Math.random() * 2,
                size: 3,
                life: 40,
                shape: 'spark',
                shimmer: true
            }));
        }
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

    createEatEffect(particles: Particle[]) {
        // Energy burst rings
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 12; j++) {
                const angle = (j / 12) * Math.PI * 2;
                particles.push(new Particle(this.x * 50 + 25, this.y * 50 + 25, 'rgb(180, 100, 255)', {
                    speed: 2 + i,
                    size: 8 + i * 2,
                    life: 40,
                    shape: 'circle',
                    angle,
                    pulse: true,
                    shimmer: true
                }));
            }
        }

        // Energy beams
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            particles.push(new Particle(this.x * 50 + 25, this.y * 50 + 25, 'rgb(200, 100, 255)', {
                speed: 3,
                size: 20,
                life: 35,
                shape: 'beam',
                angle,
                shimmer: true,
                pulse: true
            }));
        }

        // Quantum particles
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(this.x * 50 + 25, this.y * 50 + 25, 'rgb(230, 180, 255)', {
                speed: 2 + Math.random() * 2,
                size: 5,
                life: 50,
                shape: 'circle',
                quantum: true,
                shimmer: true
            }));
        }
    }

    get points() { return 1; }
}

export const foodTypes = [StarFood, RainbowFood, CrystalFood, PulsarFood];
