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
        ctx.shadowBlur = 15;

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

        // Create dynamic gradient for the main segment body
        const gradient = ctx.createLinearGradient(
            x, y,
            x + size, y + size
        );
        gradient.addColorStop(0, shadeColor(c, 40));
        gradient.addColorStop(0.5, c);
        gradient.addColorStop(1, shadeColor(c, -20));

        // Draw hexagonal body
        ctx.fillStyle = gradient;
        ctx.beginPath();
        const centerX = x + size/2;
        const centerY = y + size/2;
        const radius = size/2 - padding;
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

        // Add tech-inspired details
        if (isHead) {
            // Add metallic shine effect
            const shineGradient = ctx.createLinearGradient(
                x + padding, y + padding,
                x + size - padding, y + size - padding
            );
            shineGradient.addColorStop(0, 'rgba(255,255,255,0.2)');
            shineGradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
            shineGradient.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.fillStyle = shineGradient;
            ctx.beginPath();
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

            // Add tech pattern
            ctx.strokeStyle = `rgba(255,255,255,0.15)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(centerX - radius/2, centerY);
            ctx.lineTo(centerX + radius/2, centerY);
            ctx.moveTo(centerX, centerY - radius/2);
            ctx.lineTo(centerX, centerY + radius/2);
            ctx.stroke();
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
    baseInterval = 150;  // Store the initial interval
    minInterval = 60;    // Minimum interval (max speed)
    speedIncrease = 5;   // How much faster to get per food
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
        // If no food type is set, use default green
        if (!this.lastFoodType) {
            return { color: index === 0 ? "#4CAF50" : "#2E7D32" };
        }

        const baseColor = this.getBaseColorForFood(this.lastFoodType, index);
        const effect = this.getEffectForFood(this.lastFoodType, index, 1.0);

        // Special handling for HSL colors (from RainbowFood)
        if (this.lastFoodType instanceof RainbowFood) {
            return {
                color: baseColor,
                effect: effect
            };
        }

        // For hex colors, use solid colors
        return {
            color: baseColor,
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
        // Only update rotation for effects
        this.effectRotation += 0.1;

        // Draw trail effect with gradient
        const trailGradient = ctx.createLinearGradient(0, 0, 500, 500);
        if (this.lastFoodType) {
            const baseColor = this.getBaseColorForFood(this.lastFoodType, 0);
            if (this.lastFoodType instanceof RainbowFood) {
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

        // Draw trail effect with gradient
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

        // Draw in-game score
        if (!this.isGameOver) {
            this.drawScore(ctx);
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

        if (this.dir === 'l') pupilX = -3;
        if (this.dir === 'r') pupilX = 3;
        if (this.dir === 'u') pupilY = -3;
        if (this.dir === 'd') pupilY = 3;

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

        // Add cute sparkles in the eyes
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

    private drawScore(ctx: CanvasRenderingContext2D) {
        const x = 460;
        const y = 40;
        const hexRadius = 25;

        // Draw hexagonal background
        ctx.save();
        ctx.translate(x, y);

        // Rotate slowly
        const rotationSpeed = 0.0005;
        const rotation = Date.now() * rotationSpeed;
        ctx.rotate(rotation);

        // Draw outer hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const px = hexRadius * Math.cos(angle);
            const py = hexRadius * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw inner hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const px = (hexRadius - 5) * Math.cos(angle);
            const py = (hexRadius - 5) * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.stroke();
        ctx.restore();

        // Draw score text
        ctx.save();
        ctx.translate(x, y);

        // Add glow effect
        ctx.shadowColor = this.lastFoodType ?
            this.getBaseColorForFood(this.lastFoodType, 0) :
            '#4CAF50';
        ctx.shadowBlur = 10;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.score.toString(), 0, 0);

        ctx.restore();
    }

    drawGameOver(ctx: CanvasRenderingContext2D, progress: number) {
        // Dark overlay with radial gradient
        const gradient = ctx.createRadialGradient(250, 250, 0, 250, 250, 400);
        gradient.addColorStop(0, `rgba(0, 0, 0, ${0.5 * progress})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${0.9 * progress})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 500, 500);

        // Set up text properties
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';


        // Draw "GAME OVER" text with enhanced effects
        ctx.save();
        const shake = Math.sin(Date.now() / 100) * 2 * progress;
        ctx.translate(250 + shake, 200);
        const scale = 1 + Math.sin(Date.now() / 500) * 0.05;
        ctx.scale(scale, scale);

        // Multiple shadow layers for stronger glow
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 30 * progress;
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 70px Arial';
        ctx.fillText('GAME OVER', 0, 0);

        // Add second layer of text
        ctx.shadowBlur = 15 * progress;
        ctx.fillStyle = '#ff6666';
        ctx.fillText('GAME OVER', 0, 0);
        ctx.restore();

        // Draw score with growing effect
        ctx.save();
        ctx.translate(250, 270);
        const scoreScale = Math.min(1, progress * 1.5);
        ctx.scale(scoreScale, scoreScale);

        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15 * progress;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 35px Arial';
        ctx.fillText(`Score: ${this.score}`, 0, 0);
        ctx.restore();

        // Draw restart instruction with floating effect
        ctx.save();
        ctx.translate(250, 350 + Math.sin(Date.now() / 400) * 5);
        const pulseScale = 1 + Math.sin(Date.now() / 500) * 0.1;
        ctx.scale(pulseScale, pulseScale);

        // Draw key hint with proper centering
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * progress})`;
        ctx.font = '20px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Press', -40, 0);

        // Draw ENTER key centered
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * progress})`;
        ctx.lineWidth = 2;
        this.drawKey(ctx, 0, 0, 70, 25, 'ENTER');

        // Draw "to restart" text
        ctx.textAlign = 'left';
        ctx.fillText('to restart', 40, 0);
        ctx.restore();

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    // Helper method to draw a key
    private drawKey(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, text: string) {
        const radius = 5;

        // Draw key background
        ctx.beginPath();
        ctx.moveTo(x - width/2 + radius, y - height/2);
        ctx.lineTo(x + width/2 - radius, y - height/2);
        ctx.quadraticCurveTo(x + width/2, y - height/2, x + width/2, y - height/2 + radius);
        ctx.lineTo(x + width/2, y + height/2 - radius);
        ctx.quadraticCurveTo(x + width/2, y + height/2, x + width/2 - radius, y + height/2);
        ctx.lineTo(x - width/2 + radius, y + height/2);
        ctx.quadraticCurveTo(x - width/2, y + height/2, x - width/2, y + height/2 - radius);
        ctx.lineTo(x - width/2, y - height/2 + radius);
        ctx.quadraticCurveTo(x - width/2, y - height/2, x - width/2 + radius, y - height/2);
        ctx.stroke();

        // Draw key text with proper centering
        ctx.textAlign = 'center';
        ctx.font = '16px Arial';
        ctx.fillText(text, x, y + 2);
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

        // Increase speed by reducing the interval
        this.moveInterval = Math.max(
            this.minInterval,
            this.moveInterval - this.speedIncrease
        );
    }

    reset(x: number, y: number) {
        // Store current style
        const currentFoodType = this.lastFoodType;

        this.rects = [
            new SnakePart(x, y),
            new SnakePart(x + 1, y)
        ];
        this.score = 0;
        this.dir = "l";
        this.moveTimer = 0;
        this.moveInterval = this.baseInterval;  // Reset speed to initial value

        // Restore the current food style
        this.lastFoodType = currentFoodType;
        this.transitionTime = this.transitionDuration;
        this.effectRotation = 0;
        this.isGameOver = false;
        this.gameOverTime = 0;
    }
}
