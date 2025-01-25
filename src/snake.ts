import { Food, StarFood, RainbowFood, CrystalFood, PulsarFood } from './food';
import { hexToRgb, randInt } from './utils';
import { PowerUp, ExtraLifePowerUp, TimeSlowPowerUp, GhostPowerUp } from './powerup';
import { Particle } from './particle';
import { Direction, Position, Drawable, Updateable } from './types';
import { InputHandler } from './input-handler';

// Game state variables
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let lastTime: number;
let snake: Snake;
let currentFood: Food | null = null;
let currentPowerUp: PowerUp | null = null;
let powerUpSpawnTimer = 0;
const powerUpSpawnInterval = 15000; // Spawn power-up every 15 seconds
const powerUpTypes = [ExtraLifePowerUp, TimeSlowPowerUp, GhostPowerUp];
let particles: Particle[] = []; // Initialize particles as an empty array

// Camera shake effect variables
let shakeTime = 0;
let shakeIntensity = 0;
const shakeDuration = 200; // Duration of shake in milliseconds
const baseShakeAmount = 40; // Base intensity of the shake

// Initialize the game
function initGame() {
    // Get canvas and context
    canvas = document.querySelector('canvas')!;
    ctx = canvas.getContext('2d')!;

    // Initialize game state
    lastTime = performance.now();
    snake = new Snake(6, 10);
    particles = []; // Reset particles array

    // Handle game restart on space
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && snake.isGameOver) {
            snake.reset(6, 10);
            requestAnimationFrame(gameLoop);
        }

        // Prevent default behavior for arrow keys to avoid scrolling
        if (e.key.startsWith('Arrow')) {
            e.preventDefault();
        }
    });

    // Start game loop
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;

    // Update shake effect
    if (shakeTime > 0) {
        shakeTime = Math.max(0, shakeTime - dt);
    }

    // Clear canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate shake offset with more intense values
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (shakeTime > 0) {
        const shakeProgress = shakeTime / shakeDuration;
        const currentIntensity = shakeIntensity * shakeProgress;
        // Use multiple frequencies for more chaotic shake
        shakeOffsetX = (
            Math.sin(Date.now() / 20) * 1.5 + // Fast shake
            Math.sin(Date.now() / 10) * 0.5   // Very fast shake
        ) * currentIntensity;
        shakeOffsetY = (
            Math.cos(Date.now() / 25) * 1.5 + // Fast shake
            Math.cos(Date.now() / 12) * 0.5   // Very fast shake
        ) * currentIntensity;
    }

    // Center the game with shake effect
    ctx.translate(
        canvas.width / 2 - 300 + shakeOffsetX,
        canvas.height / 2 - 525 + shakeOffsetY
    );

    // Draw background grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 600; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 1050);
        ctx.stroke();
    }
    for (let y = 0; y <= 1050; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(600, y);
        ctx.stroke();
    }

    // Update snake
    snake.update(dt);

    // Spawn food if needed
    if (!currentFood) {
        const foodX = randInt(12);
        const foodY = randInt(21);
        const foodType = Math.random();
        if (foodType < 0.6) {
            currentFood = new StarFood(foodX, foodY);
        } else if (foodType < 0.8) {
            currentFood = new RainbowFood(foodX, foodY);
        } else if (foodType < 0.9) {
            currentFood = new CrystalFood(foodX, foodY);
        } else {
            currentFood = new PulsarFood(foodX, foodY);
        }
    }

    // Update power-up spawn timer
    powerUpSpawnTimer -= dt;
    if (powerUpSpawnTimer <= 0 && !currentPowerUp) {
        powerUpSpawnTimer = powerUpSpawnInterval;
        const powerUpX = randInt(12);
        const powerUpY = randInt(21);
        const powerUpType = powerUpTypes[randInt(powerUpTypes.length)];
        currentPowerUp = new powerUpType(powerUpX, powerUpY);
    }

    // Check for food collision
    if (currentFood && snake.checkFoodCollision(currentFood)) {
        currentFood.createEatEffect(particles);
        currentFood = null;

        // Trigger shake effect based on score
        shakeTime = shakeDuration;
        // Calculate shake intensity based on score
        shakeIntensity = snake.score <= 20
            ? baseShakeAmount * (snake.score / 20) // Linear increase up to score 20
            : baseShakeAmount + (baseShakeAmount * ((snake.score - 20) / 40) * 0.5); // Half intensity increase after 20

        // Vibrate if supported (short, crisp vibration)
        if ('vibrate' in navigator) {
            navigator.vibrate([20, 15, 10]); // Three quick pulses
        }
    }

    // Check for power-up collision
    if (currentPowerUp && snake.rects[0].targetX === currentPowerUp.x && snake.rects[0].targetY === currentPowerUp.y) {
        currentPowerUp.applyEffect(snake);
        currentPowerUp.createCollectEffect(snake.rects[0].targetX, snake.rects[0].targetY);
        currentPowerUp = null;
        // Vibrate if supported (longer vibration for power-up)
        if ('vibrate' in navigator) {
            navigator.vibrate([40, 30, 20]); // Three stronger pulses
        }
    }

    // Draw food
    if (currentFood) {
        currentFood.draw(ctx);
    }

    // Draw power-up
    if (currentPowerUp) {
        currentPowerUp.draw(ctx);
        currentPowerUp.update();
        if (currentPowerUp.isExpired()) {
            currentPowerUp = null;
        }
    }

    // Update and draw particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    // Draw snake
    snake.render(ctx);

    // Draw score
    snake.drawScore(ctx);

    // Draw lives
    ctx.fillText(`Lives: ${snake.lives}`, 10, 60);

    // Restore the canvas transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Request next frame if game is not over
    if (!snake.isGameOver) {
        requestAnimationFrame(gameLoop);
    } else {
        // Draw game over screen
        snake.drawGameOver(ctx, 1);
    }
}

export class SnakePart implements Position {
    // Current interpolated position (smooth movement)
    public lerpX: number;
    public lerpY: number;
    // Target grid position to move towards
    public targetX: number;
    public targetY: number;
    // Progress of movement from current to target position (0 to 1)
    public progress: number = 1;

    constructor(public x: number, public y: number) {
        this.lerpX = x;
        this.lerpY = y;
        this.targetX = x;
        this.targetY = y;
    }

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

    updateLerp(deltaTime: number) {
        // Calculate movement speed based on time elapsed
        const speed = deltaTime / 150; // 150ms to move one cell

        // Update progress towards target position
        this.progress = Math.min(1, this.progress + speed);

        // Calculate the shortest path to target (handling wrap-around)
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;

        // Handle wrap-around movement across screen edges
        if (Math.abs(dx) > 6) {
            if (dx > 0) dx -= 12;
            else dx += 12;
            // Adjust the current position for smoother wrap-around
            if (this.progress === 0) {
                if (dx < 0) this.x = 12;
                else this.x = -1;
            }
        }
        if (Math.abs(dy) > 10) {
            if (dy > 0) dy -= 21;
            else dy += 21;
            // Adjust the current position for smoother wrap-around
            if (this.progress === 0) {
                if (dy < 0) this.y = 21;
                else this.y = -1;
            }
        }

        // Update interpolated position
        this.lerpX = this.x + dx * this.progress;
        this.lerpY = this.y + dy * this.progress;

        // Keep interpolated positions within bounds
        if (this.lerpX < 0) this.lerpX += 12;
        if (this.lerpX >= 12) this.lerpX -= 12;
        if (this.lerpY < 0) this.lerpY += 21;
        if (this.lerpY >= 21) this.lerpY -= 21;
    }

    draw(ctx: CanvasRenderingContext2D, color: string, isHead: boolean = false, nextPart?: SnakePart) {
        const x = this.lerpX * 50;
        const y = this.lerpY * 50;
        const size = 50;
        const padding = 4;

        // Enhanced glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        // Draw connection to next segment if it exists
        if (nextPart) {
            const nx = nextPart.lerpX * 50;
            const ny = nextPart.lerpY * 50;

            let dx = nextPart.lerpX - this.lerpX;
            let dy = nextPart.lerpY - this.lerpY;

            // Handle wrap-around for connections
            if (Math.abs(dx) > 10) {
                dx = dx > 0 ? dx - 20 : dx + 20;
            }
            if (Math.abs(dy) > 10) {
                dy = dy > 0 ? dy - 20 : dy + 20;
            }

            dx *= 50; // Convert to pixel coordinates
            dy *= 50;

            // Create more vibrant gradient for connection
            const gradient = ctx.createLinearGradient(
                x + size/2, y + size/2,
                x + size/2 + dx, y + size/2 + dy
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.2, shadeColor(color, 15));
            gradient.addColorStop(0.8, shadeColor(color, 15));
            gradient.addColorStop(1, color);

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
        gradient.addColorStop(0, shadeColor(color, 40));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, shadeColor(color, -20));

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
}

function shadeColor(color: string, percent: number) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

export class Snake implements Updateable, Drawable {
    score = 0;
    lives = 1;
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
    private inputHandler: InputHandler;
    private lastMoveDirection: Direction = "l";  // Track the actual last move direction

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
            // Update the input handler with our current direction
            this.inputHandler.setCurrentDirection(this.dir);
        }

        this.rects.forEach(part => {
            part.updateLerp(deltaTime);
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
        let newX = head.targetX;
        let newY = head.targetY;

        // Update position with wrap-around
        if (this.dir == "l") newX = (newX - 1 + 12) % 12;
        if (this.dir == "r") newX = (newX + 1) % 12;
        if (this.dir == "u") newY = (newY - 1 + 21) % 21;
        if (this.dir == "d") newY = (newY + 1) % 21;

        // Check for collision with snake body
        if (!this.isGhostMode && this.rects.length > 2 && this.rects.slice(1).some(r => {
            return r.targetX === newX && r.targetY === newY;
        })) {
            if (this.lives > 1) {
                this.lives--;
                // Reset snake position but keep score and length
                const oldLength = this.rects.length;
                this.rects = [
                    new SnakePart(randInt(12), randInt(21)),
                    new SnakePart(this.rects[0].targetX + 1, this.rects[0].targetY)
                ];
                // Regrow to previous length
                for (let i = 2; i < oldLength; i++) {
                    this.grow({ x: this.rects[i-1].targetX, y: this.rects[i-1].targetY });
                }
                return;
            }
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
}
