import { CELL_SIZE } from './constants';

export class PortalEffect {
    private rotation = 0;
    private particleRotation = 0;
    private particles: { angle: number, radius: number, speed: number }[] = [];

    constructor() {
        // Initialize portal particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                angle: (Math.PI * 2 * i) / 8,
                radius: Math.random() * 10 + 20,
                speed: Math.random() * 0.02 + 0.01
            });
        }
    }

    update(deltaTime: number) {
        this.rotation += deltaTime * 0.003;
        this.particleRotation += deltaTime * 0.002;

        // Update particle positions
        this.particles.forEach(particle => {
            particle.angle += particle.speed;
            particle.radius = 20 + Math.sin(this.particleRotation + particle.angle) * 10;
        });
    }

    drawBackground(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
        const centerX = x * CELL_SIZE + CELL_SIZE/2;
        const centerY = y * CELL_SIZE + CELL_SIZE/2;
        const baseRadius = 30;

        ctx.save();

        // Outer glow (background)
        const outerGlow = ctx.createRadialGradient(
            centerX, centerY, baseRadius * 0.5,
            centerX, centerY, baseRadius * 2
        );
        outerGlow.addColorStop(0, color.replace('1)', '0.2)'));
        outerGlow.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner portal spiral effect (deepest layer)
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 3; i++) {
            const spiralRadius = baseRadius * (0.9 - i * 0.15);
            this.drawSpiral(ctx, centerX, centerY, spiralRadius, color, -this.rotation + i * Math.PI / 3);
        }

        // Deep portal ring
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 6;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 1.1, 0, Math.PI * 2);
        ctx.stroke();

        // Background particles
        ctx.globalAlpha = 0.4;
        this.particles.forEach(particle => {
            const px = centerX + Math.cos(-particle.angle) * particle.radius * 1.2;
            const py = centerY + Math.sin(-particle.angle) * particle.radius * 1.2;

            const particleGlow = ctx.createRadialGradient(px, py, 0, px, py, 10);
            particleGlow.addColorStop(0, color);
            particleGlow.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = particleGlow;
            ctx.beginPath();
            ctx.arc(px, py, 10, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    drawForeground(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
        const centerX = x * CELL_SIZE + CELL_SIZE/2;
        const centerY = y * CELL_SIZE + CELL_SIZE/2;
        const baseRadius = 30;

        ctx.save();

        // Main portal ring (foreground)
        ctx.globalAlpha = 1;
        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        // Energy beams
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 4; i++) {
            const angle = this.rotation * 2 + (Math.PI * i) / 2;
            const length = baseRadius * (0.6 + Math.sin(this.particleRotation * 3) * 0.2);

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(angle) * baseRadius * 0.3,
                centerY + Math.sin(angle) * baseRadius * 0.3
            );
            ctx.lineTo(
                centerX + Math.cos(angle) * length,
                centerY + Math.sin(angle) * length
            );
            ctx.stroke();
        }

        // Foreground particles
        ctx.globalAlpha = 0.8;
        this.particles.forEach(particle => {
            const px = centerX + Math.cos(particle.angle) * particle.radius * 0.8;
            const py = centerY + Math.sin(particle.angle) * particle.radius * 0.8;

            const particleGlow = ctx.createRadialGradient(px, py, 0, px, py, 6);
            particleGlow.addColorStop(0, color);
            particleGlow.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = particleGlow;
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
        });

        // Inner glow (foreground)
        const innerGlow = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, baseRadius * 0.6
        );
        innerGlow.addColorStop(0, color.replace('1)', '0.3)'));
        innerGlow.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    private drawSpiral(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, rotation: number) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
            const r = (radius * angle) / (Math.PI * 4);
            const px = x + Math.cos(angle + rotation) * r;
            const py = y + Math.sin(angle + rotation) * r;

            if (angle === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();
    }
}
