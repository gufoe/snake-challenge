import { CrystalFood, Food, PulsarFood, RainbowFood, StarFood } from './food';
import { InputHandler } from './input-handler';
import { PowerUp } from './powerup';
import { Direction, Drawable, Position, Updateable } from './types';
import { hexToRgb, randInt } from './utils';


export class SnakePart implements Position {
    public lerpX: number;
    public lerpY: number;
    public targetX: number;
    public targetY: number;
    public progress: number = 1;

    constructor(public x: number, public y: number) {
        this.lerpX = x;
        this.lerpY = y;
        this.targetX = x;
        this.targetY = y;
    }

    setTarget(x: number, y: number) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.targetX = x;
        this.targetY = y;
        this.progress = 0;
    }

    updateLerp(deltaTime: number, moveInterval: number) {
        // Use the current move interval for animation timing
        const speed = deltaTime / moveInterval;

        this.progress = Math.min(1, this.progress + speed);

        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;

        if (Math.abs(dx) > GRID_WIDTH/2) {
            if (dx > 0) dx -= GRID_WIDTH;
            else dx += GRID_WIDTH;
            if (this.progress === 0) {
                if (dx < 0) this.x = GRID_WIDTH;
                else this.x = -1;
            }
        }
        if (Math.abs(dy) > GRID_HEIGHT/2) {
            if (dy > 0) dy -= GRID_HEIGHT;
            else dy += GRID_HEIGHT;
            if (this.progress === 0) {
                if (dy < 0) this.y = GRID_HEIGHT;
                else this.y = -1;
            }
        }

        this.lerpX = this.x + dx * this.progress;
        this.lerpY = this.y + dy * this.progress;

        if (this.lerpX < 0) this.lerpX += GRID_WIDTH;
        if (this.lerpX >= GRID_WIDTH) this.lerpX -= GRID_WIDTH;
        if (this.lerpY < 0) this.lerpY += GRID_HEIGHT;
        if (this.lerpY >= GRID_HEIGHT) this.lerpY -= GRID_HEIGHT;
    }

    draw(ctx: CanvasRenderingContext2D, color: string, isHead: boolean = false, nextPart?: SnakePart) {
        // Draw the snake part
        ctx.fillStyle = color;
        ctx.strokeStyle = shadeColor(color, -20);
        ctx.lineWidth = 2;

        const x = this.lerpX * CELL_SIZE;
        const y = this.lerpY * CELL_SIZE;

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

            let dx = nextPart.lerpX - this.lerpX;
            let dy = nextPart.lerpY - this.lerpY;

            // Handle wrap-around for connections
            if (Math.abs(dx) > 10) {
                dx = dx > 0 ? dx - 20 : dx + 20;
            }
            if (Math.abs(dy) > 10) {
                dy = dy > 0 ? dy - 20 : dy + 20;
            }

            dx *= CELL_SIZE; // Convert to pixel coordinates
            dy *= CELL_SIZE;

            // Create more vibrant gradient for connection
            const gradient = ctx.createLinearGradient(
                x + CELL_SIZE/2, y + CELL_SIZE/2,
                x + CELL_SIZE/2 + dx, y + CELL_SIZE/2 + dy
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.2, shadeColor(color, 15));
            gradient.addColorStop(0.8, shadeColor(color, 15));
            gradient.addColorStop(1, color);

            ctx.fillStyle = gradient;
            ctx.beginPath();

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

        // Create dynamic gradient for the main segment body
        const gradient = ctx.createLinearGradient(
            x, y,
            x + CELL_SIZE, y + CELL_SIZE
        );
        gradient.addColorStop(0, shadeColor(color, 40));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, shadeColor(color, -20));

        // Draw hexagonal body
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

        // Add tech-inspired details
        if (isHead) {
            // Add metallic shine effect
            const shineGradient = ctx.createLinearGradient(
                x + 10, y + 10,
                x + CELL_SIZE - 10, y + CELL_SIZE - 10
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
}

function shadeColor(color: string, percent: number) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

// Constants for game configuration
const GRID_WIDTH = 12;
const GRID_HEIGHT = 21;
const CELL_SIZE = 50;
const INITIAL_LIVES = 1;

// Visual constants for ghost effect
const GHOST_ALPHA = 0.6;
const GHOST_COLOR = 'rgba(147, 112, 219, 1)';

export class Snake implements Updateable, Drawable {
    score = 0;
    lives = INITIAL_LIVES;
    rects: SnakePart[] = [];
    dir: Direction = "l";
    moveTimer = 0;
    moveInterval = 150;
    baseInterval = 150;  // Store the initial interval
    minInterval = 60;    // Minimum interval (max speed)
    speedIncrease = 5;   // How much faster to get per food
    isGameOver = false;
    gameOverTime = 0;
    gameOverDuration = 1000;
    isGhostMode = false;
    ghostModeEndTime = 0;
    isSlowMotion = false;
    slowMotionEndTime = 0;
    private inputHandler: InputHandler;

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
        this.inputHandler = new InputHandler();
    }

    private isOppositeDirection(dir1: Direction, dir2: Direction): boolean {
        return (
            (dir1 === 'l' && dir2 === 'r') ||
            (dir1 === 'r' && dir2 === 'l') ||
            (dir1 === 'u' && dir2 === 'd') ||
            (dir1 === 'd' && dir2 === 'u')
        );
    }

    update(deltaTime: number) {
        if (this.isGameOver) {
            this.gameOverTime = Math.max(0, this.gameOverTime - deltaTime);
            return;
        }

        // Update power-up states
        const currentTime = Date.now();
        if (this.isGhostMode && currentTime > this.ghostModeEndTime) {
            this.isGhostMode = false;
        }
        if (this.isSlowMotion && currentTime > this.slowMotionEndTime) {
            this.isSlowMotion = false;
            this.moveInterval /= 1.5; // Reset speed
        }

        // Only update rotation for effects
        this.effectRotation += 0.1;

        this.moveTimer += deltaTime;
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;

            // Get and apply next direction from the queue
            const nextDir = this.inputHandler.getNextDirection();
            if (!this.isOppositeDirection(nextDir, this.dir)) {
                this.dir = nextDir;
            }

            this.move();
        }

        this.rects.forEach(part => {
            part.updateLerp(deltaTime, this.moveInterval);
        });
    }

    draw(ctx: CanvasRenderingContext2D): void {
        this.render(ctx);
    }

    render(ctx: CanvasRenderingContext2D): void {
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
                    r.lerpX * CELL_SIZE + 4,
                    r.lerpY * CELL_SIZE + 4,
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
                const x = r.lerpX * CELL_SIZE;
                const y = r.lerpY * CELL_SIZE;
                effect(ctx, x, y, CELL_SIZE);
            }

            // Draw power-up effects
            if (this.isGhostMode) {
                this.drawGhostEffect(ctx, r, i);
            }
            if (this.isSlowMotion) {
                this.drawSlowMotionEffect(ctx, r, i);
            }
        });

        // Draw head details last (eyes, etc.)
        if (this.rects.length > 0) {
            this.drawHeadDetails(ctx);
        }

        // Draw score
        this.drawScore(ctx);

        // Draw game over screen
        if (this.isGameOver) {
            const progress = 1 - (this.gameOverTime / this.gameOverDuration);
            this.drawGameOver(ctx, progress);
        }
    }

    private drawHeadDetails(ctx: CanvasRenderingContext2D) {
        const head = this.rects[0];
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

    drawScore(ctx: CanvasRenderingContext2D): void {
        const x = 960;
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

    drawGameOver(ctx: CanvasRenderingContext2D, progress: number): void {
        // Dark overlay with radial gradient
        const gradient = ctx.createRadialGradient(300, 525, 0, 300, 525, 600);
        gradient.addColorStop(0, `rgba(0, 0, 0, ${0.5 * progress})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${0.9 * progress})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 600, 1050);

        // Set up text properties
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw "GAME OVER" text with enhanced effects
        ctx.save();
        ctx.translate(300, 450);
        const scale = 1 + Math.sin(Date.now() / 200) * 0.15;
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
        ctx.translate(300, 550);
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
        ctx.translate(300, 650 + Math.sin(Date.now() / 400) * 5);
        const pulseScale = 1 + Math.sin(Date.now() / 500) * 0.1;
        ctx.scale(pulseScale, pulseScale);

        // Draw key hint with proper centering
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * progress})`;
        ctx.font = '20px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Press', -40, 0);

        // Draw SPACE key centered
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * progress})`;
        ctx.lineWidth = 2;
        this.drawKey(ctx, 0, 0, 70, 25, 'SPACE');

        // Draw "to restart" text
        ctx.textAlign = 'left';
        ctx.fillText('to restart', 40, 0);
        ctx.restore();

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    // Keep drawKey as private since it's an internal helper
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

    move() {
        const head = this.rects[0];
        const newPos = this.getNewPosition(head);

        // Check for collision with snake body
        if (this.checkCollision(newPos)) {
            this.handleCollision();
            return;
        }

        this.updateSnakePositions(newPos);
    }

    private getNewPosition(head: SnakePart): Position {
        const newPos = { x: head.targetX, y: head.targetY };

        switch (this.dir) {
            case "l": newPos.x = (newPos.x - 1 + GRID_WIDTH) % GRID_WIDTH; break;
            case "r": newPos.x = (newPos.x + 1) % GRID_WIDTH; break;
            case "u": newPos.y = (newPos.y - 1 + GRID_HEIGHT) % GRID_HEIGHT; break;
            case "d": newPos.y = (newPos.y + 1) % GRID_HEIGHT; break;
        }

        return newPos;
    }

    private checkCollision(newPos: Position): boolean {
        return !this.isGhostMode &&
               this.rects.length > 2 &&
               this.rects.slice(1).some(r => r.targetX === newPos.x && r.targetY === newPos.y);
    }

    private handleCollision() {
        if (this.lives > 1) {
            this.lives--;
            this.respawnSnake();
        } else {
            this.isGameOver = true;
            this.gameOverTime = this.gameOverDuration;
        }
    }

    private respawnSnake() {
        const oldLength = this.rects.length;
        this.rects = [
            new SnakePart(randInt(GRID_WIDTH), randInt(GRID_HEIGHT)),
            new SnakePart(this.rects[0].targetX + 1, this.rects[0].targetY)
        ];
        // Regrow to previous length
        for (let i = 2; i < oldLength; i++) {
            this.grow({ x: this.rects[i-1].targetX, y: this.rects[i-1].targetY });
        }
    }

    private updateSnakePositions(newPos: Position) {
        const positions = this.rects.map(r => ({ x: r.targetX, y: r.targetY }));

        // Update all segments to their new positions
        this.rects.forEach((part, i) => {
            if (i === 0) {
                part.setTarget(newPos.x, newPos.y);
            } else {
                part.setTarget(positions[i - 1].x, positions[i - 1].y);
            }
        });
    }

    grow(lastPos: Position) {
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
        this.rects = [
            new SnakePart(x, y),
            new SnakePart(x + 1, y)
        ];
        this.score = 0;
        this.dir = "l";
        this.moveTimer = 0;
        this.moveInterval = this.baseInterval;
        this.isGameOver = false;
        this.gameOverTime = 0;
        this.lives = 1;
        this.isGhostMode = false;
        this.ghostModeEndTime = 0;
        this.isSlowMotion = false;
        this.slowMotionEndTime = 0;
    }

    checkFoodCollision(food: Food): boolean {
        if (this.isGameOver) return false;
        const head = this.rects[0];
        if (head.targetX === food.x && head.targetY === food.y) {
            // Add new tail segment
            const lastPos = this.rects[this.rects.length - 1];
            this.grow({ x: lastPos.targetX, y: lastPos.targetY });

            // Update score based on food type
            this.score += food.points;

            return true;
        }
        return false;
    }

    checkPowerUpCollision(powerUp: PowerUp): boolean {
        if (this.isGameOver) return false;
        const head = this.rects[0];
        return head.targetX === powerUp.x && head.targetY === powerUp.y;
    }

    private drawGhostEffect(ctx: CanvasRenderingContext2D, part: SnakePart, index: number) {
        const x = part.lerpX * CELL_SIZE;
        const y = part.lerpY * CELL_SIZE;
        const size = CELL_SIZE;

        ctx.save();

        // Make the snake semi-transparent when in ghost mode
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

        // Add ethereal particles with stronger glow
        ctx.shadowColor = GHOST_COLOR.replace('1)', '0.8)');
        ctx.shadowBlur = 10;

        for (let i = 0; i < 5; i++) {
            const angle = this.effectRotation * 2 + index * 0.5 + i * (Math.PI * 2 / 5);
            const radius = size/2 + Math.sin(this.effectRotation * 3 + i) * 8;
            const px = x + size/2 + Math.cos(angle) * radius;
            const py = y + size/2 + Math.sin(angle) * radius;

            // Draw larger ghost particles
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

        ctx.restore();
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
}
