import { Food, StarFood, RainbowFood, CrystalFood, PulsarFood } from './food';
import { hexToRgb } from './utils';

export class SnakePart {
    // Current interpolated position (smooth movement)
    public lerpX: number;
    public lerpY: number;
    // Target grid position to move towards
    public targetX: number;
    public targetY: number;
    // Progress of movement from current to target position (0 to 1)
    public progress: number = 1;

    public constructor(public x: number, public y: number) {
        this.lerpX = x;
        this.lerpY = y;
        this.targetX = x;
        this.targetY = y;
    }

    /**
     * Draws the snake segment and its connection to the next segment
     * @param c - Color of the segment
     * @param isHead - Whether this segment is the snake's head
     * @param nextPart - The next segment to connect to (if any)
     */
    draw(ctx: CanvasRenderingContext2D, c: string, isHead: boolean = false, nextPart?: SnakePart) {
        const x = this.lerpX * 50;
        const y = this.lerpY * 50;
        const size = 50;
        const padding = 4;

        // Enhanced glow effect
        ctx.shadowColor = c;
        ctx.shadowBlur = 25;

        // Draw connection to next segment if it exists
        if (nextPart) {
            const nx = nextPart.lerpX * 50;
            const ny = nextPart.lerpY * 50;

            let dx = nx - x;
            let dy = ny - y;

            if (Math.abs(dx) > size * 2) dx = dx > 0 ? dx - 500 : dx + 500;
            if (Math.abs(dy) > size * 2) dy = dy > 0 ? dy - 500 : dy + 500;

            // Create more vibrant gradient for connection
            const gradient = ctx.createLinearGradient(
                x + size/2, y + size/2,
                x + size/2 + dx/2, y + size/2 + dy/2
            );
            gradient.addColorStop(0, c);
            gradient.addColorStop(0.2, shadeColor(c, 15));
            gradient.addColorStop(0.8, shadeColor(c, 15));
            gradient.addColorStop(1, c);

            ctx.fillStyle = gradient;
            ctx.beginPath();

            const angle = Math.atan2(dy, dx);
            ctx.save();
            ctx.translate(x + size/2, y + size/2);
            ctx.rotate(angle);

            // Smoother connection with curved edges
            const length = Math.sqrt(dx*dx + dy*dy);
            const width = 42;
            ctx.beginPath();
            ctx.moveTo(-5, -width/2);
            ctx.lineTo(length + 5, -width/2);
            ctx.quadraticCurveTo(length + 15, 0, length + 5, width/2);
            ctx.lineTo(-5, width/2);
            ctx.quadraticCurveTo(-15, 0, -5, -width/2);
            ctx.fill();

            ctx.restore();
        }

        // Create dynamic gradient for the main segment body
        const gradient = ctx.createRadialGradient(
            x + size/2 - 15, y + size/2 - 15, 0,
            x + size/2, y + size/2, size/1.2
        );
        gradient.addColorStop(0, shadeColor(c, 40));
        gradient.addColorStop(0.5, c);
        gradient.addColorStop(1, shadeColor(c, -20));

        // Draw main body with rounded corners
        ctx.fillStyle = gradient;
        ctx.beginPath();
        const radius = 24;
        ctx.roundRect(x + padding, y + padding, size - padding*2, size - padding*2, radius);
        ctx.fill();

        // Add details for head segment
        if (isHead) {
            // Add metallic shine effect
            const shineGradient = ctx.createLinearGradient(
                x + padding, y + padding,
                x + size - padding, y + size - padding
            );
            shineGradient.addColorStop(0, 'rgba(255,255,255,0.2)');
            shineGradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
            shineGradient.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.fillStyle = shineGradient;
            ctx.beginPath();
            ctx.roundRect(x + padding, y + padding, size - padding*2, size - padding*2, radius);
            ctx.fill();
        }

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    /**
     * Updates the interpolated position based on progress towards target
     * @param deltaTime - Time elapsed since last update (for smooth animation)
     */
    updateLerp(deltaTime: number) {
        // Calculate movement speed based on time elapsed
        const speed = deltaTime / 150; // 150ms to move one cell

        // Update progress towards target position
        this.progress = Math.min(1, this.progress + speed);

        // Calculate the shortest path to target (handling wrap-around)
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;

        // Handle wrap-around movement across screen edges
        if (Math.abs(dx) > 5) {
            if (dx > 0) dx -= 10;
            else dx += 10;
        }
        if (Math.abs(dy) > 5) {
            if (dy > 0) dy -= 10;
            else dy += 10;
        }

        // Update interpolated position
        this.lerpX = this.x + dx * this.progress;
        this.lerpY = this.y + dy * this.progress;

        // Keep interpolated positions within bounds
        if (this.lerpX < 0) this.lerpX += 10;
        if (this.lerpX > 9) this.lerpX -= 10;
        if (this.lerpY < 0) this.lerpY += 10;
        if (this.lerpY > 9) this.lerpY -= 10;
    }

    /**
     * Sets a new target position for the segment to move towards
     */
    setTarget(x: number, y: number) {
        // Current target becomes new starting position
        this.x = this.targetX;
        this.y = this.targetY;
        // Set new target position
        this.targetX = x;
        this.targetY = y;
        // Reset progress for new movement
        this.progress = 0;
    }
}

function shadeColor(color: string, percent: number) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

export class Snake {
    score = 0;
    rects: SnakePart[] = [];
    dir: "l" | "u" | "d" | "r" = "l";
    moveTimer = 0;
    moveInterval = 150;
    isGameOver = false;
    gameOverTime = 0;
    gameOverDuration = 1000;

    // Add transition properties
    transitionTime = 0;
    transitionDuration = 1000; // 1 second transition
    lastFoodType: Food | null = null;
    effectRotation = 0;

    constructor(x: number, y: number) {
        this.rects = [
            new SnakePart(x, y),
            new SnakePart(x + 1, y)
        ];
    }

    getSegmentColor(index: number): { color: string, effect?: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void } {
        if (this.transitionTime <= 0) {
            return { color: index === 0 ? "#4CAF50" : "#2E7D32" };
        }

        const progress = this.transitionTime / this.transitionDuration;
        const delayedProgress = Math.max(0, Math.min(1, progress * 2 - (index * 0.1)));

        if (!this.lastFoodType) {
            return { color: index === 0 ? "#4CAF50" : "#2E7D32" };
        }

        const baseColor = this.getBaseColorForFood(this.lastFoodType, index);
        const effect = this.getEffectForFood(this.lastFoodType, index, delayedProgress);

        // Special handling for HSL colors (from RainbowFood)
        if (this.lastFoodType instanceof RainbowFood) {
            return {
                color: baseColor.replace(')', `, ${delayedProgress})`).replace('hsl', 'hsla'),
                effect: effect
            };
        }

        // For hex colors, use the existing RGB conversion
        return {
            color: `rgba(${hexToRgb(baseColor).join(',')},${delayedProgress})`,
            effect: effect
        };
    }

    private getBaseColorForFood(food: Food, index: number): string {
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
            return (ctx, x, y, size) => {
                ctx.fillStyle = '#FFB74D';
                const angle = this.effectRotation + (index * Math.PI / 8);
                const orbitX = x + size/2 + Math.cos(angle) * 25 * progress;
                const orbitY = y + size/2 + Math.sin(angle) * 25 * progress;
                ctx.beginPath();
                ctx.arc(orbitX, orbitY, 3 * progress, 0, Math.PI * 2);
                ctx.fill();
            };
        } else if (food instanceof RainbowFood) {
            return (ctx, x, y, size) => {
                const hue = (index * 30 + this.effectRotation * 50) % 360;
                const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
                gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, ${progress * 0.3})`);
                gradient.addColorStop(1, `hsla(${(hue + 60) % 360}, 100%, 50%, 0)`);
                ctx.fillStyle = gradient;
                ctx.fill();
            };
        } else if (food instanceof CrystalFood) {
            return (ctx, x, y, size) => {
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
        } else if (food instanceof PulsarFood) {
            return (ctx, x, y, size) => {
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
        return undefined;
    }

    draw(ctx: CanvasRenderingContext2D) {
        // Update transition effect
        if (this.transitionTime > 0) {
            this.transitionTime = Math.max(0, this.transitionTime - 16);
            this.effectRotation += 0.1;
        }

        // Draw trail effect with gradient
        const trailGradient = ctx.createLinearGradient(0, 0, 500, 500);
        trailGradient.addColorStop(0, 'rgba(76, 175, 80, 0.1)');
        trailGradient.addColorStop(1, 'rgba(76, 175, 80, 0.05)');

        // Draw trails
        this.rects.forEach((r, i) => {
            const alpha = 0.15 - (i * 0.01);
            if (alpha > 0) {
                ctx.fillStyle = trailGradient;
                ctx.beginPath();
                ctx.roundRect(
                    r.lerpX * 50 + 4,
                    r.lerpY * 50 + 4,
                    42,
                    42,
                    22
                );
                ctx.fill();
            }
        });

        // Draw snake segments
        this.rects.forEach((r, i) => {
            const nextPart = this.rects[i + 1];
            const { color, effect } = this.getSegmentColor(i);

            // Draw base segment
            r.draw(ctx, color, i === 0, nextPart);

            // Apply special effect if any
            if (effect) {
                const x = r.lerpX * 50;
                const y = r.lerpY * 50;
                effect(ctx, x, y, 50);
            }
        });

        // Draw head details last (eyes, etc.)
        if (this.rects.length > 0) {
            this.drawHeadDetails(ctx);
        }

        // Draw game over screen
        if (this.isGameOver) {
            const progress = 1 - (this.gameOverTime / this.gameOverDuration);
            this.drawGameOver(ctx, progress);
        }
    }

    drawHeadDetails(ctx: CanvasRenderingContext2D) {
        const head = this.rects[0];
        const x = head.lerpX * 50;
        const y = head.lerpY * 50;
        const size = 50;
        const eyeSize = 9;
        const eyeOffset = 15;
        const eyeY = y + eyeOffset;

        // Add eyes with enhanced glow
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#fff";

        // Draw eyes
        ctx.beginPath();
        ctx.arc(x + eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.arc(x + size - eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Add pupils that follow movement direction
        let pupilX = 0;
        let pupilY = 0;

        if (this.dir === 'l') pupilX = -3;
        if (this.dir === 'r') pupilX = 3;
        if (this.dir === 'u') pupilY = -3;
        if (this.dir === 'd') pupilY = 3;

        ctx.shadowBlur = 0;
        const pupilGradient = ctx.createRadialGradient(
            x + eyeOffset, eyeY, 0,
            x + eyeOffset, eyeY, eyeSize/1.5
        );
        pupilGradient.addColorStop(0, '#444');
        pupilGradient.addColorStop(1, '#000');
        ctx.fillStyle = pupilGradient;

        ctx.beginPath();
        ctx.arc(x + eyeOffset + pupilX, eyeY + pupilY, eyeSize/1.8, 0, Math.PI * 2);
        ctx.arc(x + size - eyeOffset + pupilX, eyeY + pupilY, eyeSize/1.8, 0, Math.PI * 2);
        ctx.fill();

        // Add eye shine
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        const shineSize = 3;
        ctx.beginPath();
        ctx.arc(x + eyeOffset - 2, eyeY - 2, shineSize, 0, Math.PI * 2);
        ctx.arc(x + size - eyeOffset - 2, eyeY - 2, shineSize, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGameOver(ctx: CanvasRenderingContext2D, progress: number) {
        // Fade in background
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * progress})`;
        ctx.fillRect(0, 0, 500, 500);

        // Set up text properties
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw "GAME OVER" text with glow effect
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 20 * progress;
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 60px Arial';
        ctx.fillText('GAME OVER', 250, 200);

        // Draw score
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10 * progress;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px Arial';
        ctx.fillText(`Score: ${this.score}`, 250, 270);

        // Draw restart instruction with pulsing effect
        const pulseScale = 1 + Math.sin(Date.now() / 500) * 0.1;
        ctx.font = `${20 * pulseScale}px Arial`;
        ctx.fillText('Press ENTER to restart', 250, 350);

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    processInput(keys: { [key: string]: boolean }) {
        if ((keys["a"] || keys["ArrowLeft"]) && this.dir != "r") {
            this.dir = "l";
        }
        if ((keys["d"] || keys["ArrowRight"]) && this.dir != "l") {
            this.dir = "r";
        }
        if ((keys["w"] || keys["ArrowUp"]) && this.dir != "d") {
            this.dir = "u";
        }
        if ((keys["s"] || keys["ArrowDown"]) && this.dir != "u") {
            this.dir = "d";
        }
    }

    move() {
        const head = this.rects[0];
        let newX = head.targetX;
        let newY = head.targetY;

        // Update position with wrap-around
        if (this.dir == "l") newX = (newX - 1 + 10) % 10;
        if (this.dir == "r") newX = (newX + 1) % 10;
        if (this.dir == "u") newY = (newY - 1 + 10) % 10;
        if (this.dir == "d") newY = (newY + 1) % 10;

        // Check for collision with snake body
        if (this.rects.some(r => r.targetX === newX && r.targetY === newY)) {
            this.isGameOver = true;
            this.gameOverTime = this.gameOverDuration;
            return;
        }

        // Store current positions before moving
        const positions: {x: number, y: number}[] = this.rects.map(r => ({
            x: r.targetX,
            y: r.targetY
        }));

        // Update all segments to their new positions
        this.rects.forEach((part, i) => {
            if (i === 0) {
                part.setTarget(newX, newY);
            } else {
                part.setTarget(positions[i - 1].x, positions[i - 1].y);
            }
        });

        return { newX, newY };
    }

    update(deltaTime: number) {
        if (this.isGameOver) {
            this.gameOverTime = Math.max(0, this.gameOverTime - deltaTime);
            return;
        }

        this.moveTimer += deltaTime;
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.move();
        }

        this.rects.forEach(part => {
            part.updateLerp(deltaTime);
        });
    }

    grow(lastPos: { x: number, y: number }) {
        const newTail = new SnakePart(lastPos.x, lastPos.y);
        newTail.setTarget(lastPos.x, lastPos.y);
        this.rects.push(newTail);
    }

    reset(x: number, y: number) {
        this.rects = [
            new SnakePart(x, y),
            new SnakePart(x + 1, y)
        ];
        this.score = 0;
        this.dir = "l";
        this.moveTimer = 0;
        this.transitionTime = 0;
        this.lastFoodType = null;
        this.effectRotation = 0;
        this.isGameOver = false;
        this.gameOverTime = 0;
    }
}
