import { SnakePart } from './snake-part';
import { Food, RainbowFood, StarFood, CrystalFood, PulsarFood } from './food';
import { CELL_SIZE, GHOST_ALPHA, GHOST_COLOR, GRID_WIDTH, GRID_HEIGHT } from './constants';
import { hexToRgb } from './utils';

export class SnakeRenderer {
    private effectRotation = 0;


    updateEffects() {
        this.effectRotation += 0.1;
    }

    drawSnake(ctx: CanvasRenderingContext2D, parts: SnakePart[], lastFoodType: Food | null, isGhostMode: boolean, isSlowMotion: boolean, isBodySegment: boolean = false) {
        // Draw trail effect with gradient
        this.drawTrailEffect(ctx, parts, lastFoodType);

        // Draw snake segments
        parts.forEach((r, i) => {
            const nextPart = parts[i + 1];
            const { color, effect } = this.getSegmentColor(lastFoodType, i);

            // Draw base segment
            this.drawSnakePart(ctx, r, color, !isBodySegment && i === 0, nextPart);

            // Apply special effect if any
            if (effect) {
                const x = r.lerpX * CELL_SIZE;
                const y = r.lerpY * CELL_SIZE;
                effect(ctx, x, y, CELL_SIZE);
            }

            // Draw power-up effects
            if (isGhostMode) {
                this.drawGhostEffect(ctx, r, i);
            }
            if (isSlowMotion) {
                this.drawSlowMotionEffect(ctx, r, i);
            }
        });

        // Draw head details last
        if (!isBodySegment && parts.length > 0) {
            this.drawHeadDetails(ctx, parts[0]);
        }
    }

    private drawTrailEffect(ctx: CanvasRenderingContext2D, parts: SnakePart[], lastFoodType: Food | null) {
        const trailGradient = ctx.createLinearGradient(0, 0, 500, 500);
        if (lastFoodType) {
            const baseColor = this.getBaseColorForFood(lastFoodType, 0);
            if (lastFoodType instanceof RainbowFood) {
                const hue = (this.effectRotation * 50) % 360;
                trailGradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.1)`);
                trailGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0.05)`);
            } else {
                const rgb = hexToRgb(baseColor);
                trailGradient.addColorStop(0, `rgba(${rgb.join(',')}, 0.1)`);
                trailGradient.addColorStop(1, `rgba(${rgb.join(',')}, 0.05)`);
            }
        } else {
            trailGradient.addColorStop(0, 'rgba(76, 175, 80, 0.1)');
            trailGradient.addColorStop(1, 'rgba(76, 175, 80, 0.05)');
        }

        parts.forEach((r, i) => {
            const alpha = 0.15 - (i * 0.01);
            if (alpha > 0) {
                ctx.fillStyle = trailGradient;
                ctx.beginPath();
                ctx.roundRect(
                    r.lerpX * CELL_SIZE + 4,
                    r.lerpY * CELL_SIZE + 4,
                    42,
                    42,
                    22
                );
                ctx.fill();
            }
        });
    }

    private drawSnakePart(ctx: CanvasRenderingContext2D, part: SnakePart, color: string, isHead: boolean = false, nextPart?: SnakePart) {
        const x = part.lerpX * CELL_SIZE;
        const y = part.lerpY * CELL_SIZE;

        // Draw the snake part
        ctx.fillStyle = color;
        ctx.strokeStyle = this.shadeColor(color, -20);
        ctx.lineWidth = 2;

        // Draw the main body
        ctx.beginPath();
        ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 10);
        ctx.fill();
        ctx.stroke();

        // Enhanced glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        // Draw connection to next segment if it exists
        if (nextPart) {
            this.drawSegmentConnection(ctx, part, nextPart, color);
        }

        // Create dynamic gradient for the main segment body
        this.drawSegmentBody(ctx, x, y, color);

        // Add tech-inspired details for head
        if (isHead) {
            this.drawHeadDetails(ctx, part);
        }

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    private drawSegmentConnection(ctx: CanvasRenderingContext2D, part: SnakePart, nextPart: SnakePart, color: string) {
        const x = part.lerpX * CELL_SIZE;
        const y = part.lerpY * CELL_SIZE;

        let dx = nextPart.lerpX - part.lerpX;
        let dy = nextPart.lerpY - part.lerpY;

        // Handle wrap-around for connections
        if (Math.abs(dx) > 10) {
            dx = dx > 0 ? dx - 20 : dx + 20;
        }
        if (Math.abs(dy) > 10) {
            dy = dy > 0 ? dy - 20 : dy + 20;
        }

        dx *= CELL_SIZE;
        dy *= CELL_SIZE;

        // Create gradient for connection
        const gradient = ctx.createLinearGradient(
            x + CELL_SIZE/2, y + CELL_SIZE/2,
            x + CELL_SIZE/2 + dx, y + CELL_SIZE/2 + dy
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.2, this.shadeColor(color, 15));
        gradient.addColorStop(0.8, this.shadeColor(color, 15));
        gradient.addColorStop(1, color);

        ctx.fillStyle = gradient;

        const angle = Math.atan2(dy, dx);
        ctx.save();
        ctx.translate(x + CELL_SIZE/2, y + CELL_SIZE/2);
        ctx.rotate(angle);

        // Sharp angular connection
        const length = Math.sqrt(dx*dx + dy*dy);
        const width = 42;
        ctx.beginPath();
        ctx.moveTo(-5, -width/2);
        ctx.lineTo(length + 5, -width/2);
        ctx.lineTo(length + 15, 0);
        ctx.lineTo(length + 5, width/2);
        ctx.lineTo(-5, width/2);
        ctx.lineTo(-15, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    private drawSegmentBody(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
        const gradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
        gradient.addColorStop(0, this.shadeColor(color, 40));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, this.shadeColor(color, -20));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const centerX = x + CELL_SIZE/2;
        const centerY = y + CELL_SIZE/2;
        const radius = CELL_SIZE/2;

        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3 - Math.PI / 6;
            const px = centerX + radius * Math.cos(angle);
            const py = centerY + radius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    private drawHeadDetails(ctx: CanvasRenderingContext2D, head: SnakePart) {
        const x = head.lerpX * CELL_SIZE;
        const y = head.lerpY * CELL_SIZE;
        const size = CELL_SIZE;
        const eyeSize = 14;
        const eyeOffset = 17;
        const eyeY = y + eyeOffset;

        // Add eyes with enhanced glow
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 20;
        ctx.fillStyle = "#fff";

        // Draw diamond-shaped eyes
        const drawDiamondEye = (centerX: number, centerY: number) => {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - eyeSize/2);
            ctx.lineTo(centerX + eyeSize/2, centerY);
            ctx.lineTo(centerX, centerY + eyeSize/2);
            ctx.lineTo(centerX - eyeSize/2, centerY);
            ctx.closePath();
            ctx.fill();
        };

        drawDiamondEye(x + eyeOffset, eyeY);
        drawDiamondEye(x + size - eyeOffset, eyeY);

        // Add pupils that follow movement direction
        let pupilX = 0;
        let pupilY = 0;

        // Get direction from the head's current and target positions
        const dx = head.targetX - head.x;
        const dy = head.targetY - head.y;

        if (dx < 0 || (dx < -GRID_WIDTH/2)) pupilX = -3;
        if (dx > 0 || (dx > GRID_WIDTH/2)) pupilX = 3;
        if (dy < 0 || (dy < -GRID_HEIGHT/2)) pupilY = -3;
        if (dy > 0 || (dy > GRID_HEIGHT/2)) pupilY = 3;

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';

        // Draw larger, rounder pupils
        const drawPupil = (centerX: number, centerY: number) => {
            ctx.beginPath();
            const pupilSize = eyeSize/2;
            ctx.arc(centerX + pupilX, centerY + pupilY, pupilSize/2, 0, Math.PI * 2);
            ctx.fill();
        };

        drawPupil(x + eyeOffset, eyeY);
        drawPupil(x + size - eyeOffset, eyeY);

        // Add sparkles in the eyes
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        const drawSparkle = (centerX: number, centerY: number) => {
            // Main shine
            ctx.beginPath();
            ctx.arc(centerX - 2 + pupilX/2, centerY - 2 + pupilY/2, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Small secondary shine
            ctx.beginPath();
            ctx.arc(centerX + 2 + pupilX/2, centerY + 2 + pupilY/2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        };

        drawSparkle(x + eyeOffset, eyeY);
        drawSparkle(x + size - eyeOffset, eyeY);
    }

    private drawGhostEffect(ctx: CanvasRenderingContext2D, part: SnakePart, index: number) {
        const x = part.lerpX * CELL_SIZE;
        const y = part.lerpY * CELL_SIZE;
        const size = CELL_SIZE;

        ctx.save();
        ctx.globalAlpha = GHOST_ALPHA;

        // Add ghost aura with stronger opacity
        const pulseAlpha = GHOST_ALPHA + Math.sin(this.effectRotation + index * 0.2) * 0.2;

        // Create larger ghost aura gradient
        const gradient = ctx.createRadialGradient(
            x + size/2, y + size/2, size/3,
            x + size/2, y + size/2, size
        );
        gradient.addColorStop(0, GHOST_COLOR.replace('1)', `${pulseAlpha})`));
        gradient.addColorStop(0.5, GHOST_COLOR.replace('1)', `${pulseAlpha * 0.5})`));
        gradient.addColorStop(1, GHOST_COLOR.replace('1)', '0)'));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size, 0, Math.PI * 2);
        ctx.fill();

        // Add ethereal particles
        this.drawGhostParticles(ctx, x, y, size, index);

        ctx.restore();
    }

    private drawGhostParticles(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, index: number) {
        ctx.shadowColor = GHOST_COLOR.replace('1)', '0.8)');
        ctx.shadowBlur = 10;

        for (let i = 0; i < 5; i++) {
            const angle = this.effectRotation * 2 + index * 0.5 + i * (Math.PI * 2 / 5);
            const radius = size/2 + Math.sin(this.effectRotation * 3 + i) * 8;
            const px = x + size/2 + Math.cos(angle) * radius;
            const py = y + size/2 + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = GHOST_COLOR.replace('1)', '0.8)');
            ctx.fill();
        }

        // Add ghostly trails
        ctx.strokeStyle = GHOST_COLOR.replace('1)', '0.4)');
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const trailAngle = this.effectRotation + i * (Math.PI * 2 / 3);
            const trailLength = size/2 + Math.sin(this.effectRotation * 2) * 10;

            ctx.beginPath();
            ctx.moveTo(x + size/2, y + size/2);
            ctx.lineTo(
                x + size/2 + Math.cos(trailAngle) * trailLength,
                y + size/2 + Math.sin(trailAngle) * trailLength
            );
            ctx.stroke();
        }
    }

    private drawSlowMotionEffect(ctx: CanvasRenderingContext2D, part: SnakePart, index: number) {
        const x = part.lerpX * CELL_SIZE;
        const y = part.lerpY * CELL_SIZE;
        const size = CELL_SIZE;

        ctx.save();
        ctx.globalAlpha = 0.4 + Math.sin(this.effectRotation + index * 0.1) * 0.1;

        // Time ripple effect
        const rippleSize = size/2 + Math.sin(this.effectRotation * 2 + index * 0.3) * 10;
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, rippleSize, 0, Math.PI * 2);
        ctx.stroke();

        // Clock hand effect
        const handLength = size/3;
        const handAngle = this.effectRotation * 2 + index * 0.2;

        ctx.beginPath();
        ctx.moveTo(x + size/2, y + size/2);
        ctx.lineTo(
            x + size/2 + Math.cos(handAngle) * handLength,
            y + size/2 + Math.sin(handAngle) * handLength
        );
        ctx.stroke();

        ctx.restore();
    }

    private getSegmentColor(food: Food | null, index: number): { color: string, effect?: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void } {
        if (!food) {
            return { color: index === 0 ? "#4CAF50" : "#2E7D32" };
        }

        const baseColor = this.getBaseColorForFood(food, index);
        const effect = this.getEffectForFood(food, index, 1.0);

        return {
            color: baseColor,
            effect: effect
        };
    }

    getBaseColorForFood(food: Food, index: number): string {
        if (food instanceof StarFood) {
            return index === 0 ? '#FF5722' : '#F4511E';
        } else if (food instanceof RainbowFood) {
            const hue = (index * 30 + this.effectRotation * 50) % 360;
            return `hsl(${hue}, 100%, 50%)`;
        } else if (food instanceof CrystalFood) {
            return '#64B5F6';
        } else if (food instanceof PulsarFood) {
            return '#9C27B0';
        }
        return index === 0 ? "#4CAF50" : "#2E7D32";
    }

    private getEffectForFood(food: Food, index: number, progress: number): ((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void) | undefined {
        if (progress <= 0.2) return undefined;

        if (food instanceof StarFood) {
            return this.getStarFoodEffect(index, progress);
        } else if (food instanceof RainbowFood) {
            return this.getRainbowFoodEffect(index, progress);
        } else if (food instanceof CrystalFood) {
            return this.getCrystalFoodEffect(index, progress);
        } else if (food instanceof PulsarFood) {
            return this.getPulsarFoodEffect(index, progress);
        }
        return undefined;
    }

    private getStarFoodEffect(index: number, progress: number) {
        return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            ctx.fillStyle = '#FFB74D';
            const angle = this.effectRotation + (index * Math.PI / 8);
            const orbitX = x + size/2 + Math.cos(angle) * 25 * progress;
            const orbitY = y + size/2 + Math.sin(angle) * 25 * progress;
            ctx.beginPath();
            ctx.arc(orbitX, orbitY, 3 * progress, 0, Math.PI * 2);
            ctx.fill();
        };
    }

    private getRainbowFoodEffect(index: number, progress: number) {
        return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const hue = (index * 30 + this.effectRotation * 50) % 360;
            const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
            gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, ${progress * 0.3})`);
            gradient.addColorStop(1, `hsla(${(hue + 60) % 360}, 100%, 50%, 0)`);
            ctx.fillStyle = gradient;
            ctx.fill();
        };
    }

    private getCrystalFoodEffect(index: number, progress: number) {
        return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            ctx.strokeStyle = `rgba(255, 255, 255, ${progress * 0.5})`;
            ctx.lineWidth = 1;
            const angle = this.effectRotation + (index * Math.PI / 6);
            ctx.beginPath();
            ctx.moveTo(x + size/2, y + size/2);
            ctx.lineTo(
                x + size/2 + Math.cos(angle) * size/2 * progress,
                y + size/2 + Math.sin(angle) * size/2 * progress
            );
            ctx.stroke();
        };
    }

    private getPulsarFoodEffect(index: number, progress: number) {
        return (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            ctx.strokeStyle = `rgba(225, 190, 231, ${progress * 0.6})`;
            ctx.lineWidth = 2;
            const angles = [0, Math.PI/2, Math.PI, Math.PI*3/2];
            angles.forEach(baseAngle => {
                const angle = baseAngle + this.effectRotation + (index * 0.2);
                const length = 15 * progress;
                ctx.beginPath();
                ctx.moveTo(
                    x + size/2 + Math.cos(angle) * length * 0.3,
                    y + size/2 + Math.sin(angle) * length * 0.3
                );
                ctx.lineTo(
                    x + size/2 + Math.cos(angle) * length,
                    y + size/2 + Math.sin(angle) * length
                );
                ctx.stroke();
            });
        };
    }

    private shadeColor(color: string, percent: number) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
    }
}
