import { GRID_HEIGHT, GRID_WIDTH, INITIAL_LIVES } from './constants';
import { Food } from './food';
import { GameUI } from './game-ui';
import { InputHandler } from './input-handler';
import { PowerUp } from './powerup';
import { SnakePart } from './snake-part';
import { SnakeRenderer } from './snake-renderer';
import { Direction, Drawable, Position, Updateable } from './types';
import { randInt } from './utils';
import { PortalEffect } from './portal-effect';

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
    private renderer: SnakeRenderer;
    private ui: GameUI;
    onRespawn?: () => void;

    // Add transition properties
    transitionTime = 0;
    transitionDuration = 1000; // 1 second transition
    lastFoodType: Food | null = null;

    // Add portal transition properties
    private isRespawning = false;
    private respawnProgress = 0;
    private deathPortal = { x: 0, y: 0 };
    private spawnPortal = { x: 0, y: 0 };
    private respawnDelay = 50; // ms delay between each segment respawning
    private deathPortalEffect: PortalEffect;
    private spawnPortalEffect: PortalEffect;

    constructor(x: number, y: number) {
        this.rects = [
            new SnakePart(x, y),
            new SnakePart(x + 1, y)
        ];
        this.inputHandler = new InputHandler();
        this.renderer = new SnakeRenderer();
        this.ui = new GameUI();
        this.deathPortalEffect = new PortalEffect();
        this.spawnPortalEffect = new PortalEffect();
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

        // Update portal effects
        if (this.isRespawning) {
            this.deathPortalEffect.update(deltaTime);
            this.spawnPortalEffect.update(deltaTime);
        }

        // Handle respawn transition
        if (this.isRespawning) {
            this.respawnProgress += deltaTime;
            const segmentDelay = this.respawnDelay;
            const totalTime = segmentDelay * this.rects.length;

            // Continue normal movement even during respawn
            this.moveTimer += deltaTime;
            if (this.moveTimer >= this.moveInterval) {
                this.moveTimer = 0;
                const nextDir = this.inputHandler.getNextDirection();
                if (!this.isOppositeDirection(nextDir, this.dir)) {
                    this.dir = nextDir;
                }
                this.updateSnakePositions(this.getNewPosition(this.rects[0]));
            }

            // Check each segment for portal collision
            this.rects.forEach((segment, i) => {
                if (i > 0) { // Skip head as it's already teleported
                    const distToDeathPortal = Math.sqrt(
                        Math.pow(segment.x - this.deathPortal.x, 2) +
                        Math.pow(segment.y - this.deathPortal.y, 2)
                    );

                    if (distToDeathPortal < 0.5) {
                        // Instantly teleport segment to spawn portal with no interpolation
                        segment.x = this.spawnPortal.x;
                        segment.y = this.spawnPortal.y;
                        segment.targetX = this.spawnPortal.x;
                        segment.targetY = this.spawnPortal.y;
                        segment.lerpX = this.spawnPortal.x;
                        segment.lerpY = this.spawnPortal.y;
                        segment.progress = 1;
                    }
                }

                // Only update lerp if the segment hasn't hit the portal yet
                const currentDistToPortal = Math.sqrt(
                    Math.pow(segment.x - this.deathPortal.x, 2) +
                    Math.pow(segment.y - this.deathPortal.y, 2)
                );
                if (currentDistToPortal >= 0.5) {
                    segment.updateLerp(deltaTime, this.moveInterval);
                }
            });

            if (this.respawnProgress >= totalTime) {
                this.isRespawning = false;
                this.respawnProgress = 0;
            }
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

        this.renderer.updateEffects();

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
        if (this.isRespawning) {
            this.drawRespawnTransition(ctx);
        } else {
            // Original draw code
            this.renderer.drawSnake(ctx, this.rects, this.lastFoodType, this.isGhostMode, this.isSlowMotion);
        }

        // Draw score
        const lastFoodColor = this.lastFoodType ?
            this.renderer.getBaseColorForFood(this.lastFoodType, 0) :
            '#4CAF50';
        this.ui.drawScore(ctx, this.score, lastFoodColor);

        // Draw game over screen
        if (this.isGameOver) {
            const progress = 1 - (this.gameOverTime / this.gameOverDuration);
            this.ui.drawGameOver(ctx, this.score, progress);
        }
    }

    private drawRespawnTransition(ctx: CanvasRenderingContext2D) {
        // Draw portal background layers first
        this.deathPortalEffect.drawBackground(ctx, this.deathPortal.x, this.deathPortal.y, '#ff4444');
        this.spawnPortalEffect.drawBackground(ctx, this.spawnPortal.x, this.spawnPortal.y, '#44ff44');

        // Draw snake segments
        this.rects.forEach((segment, i) => {
            if (i > 0) { // Skip head
                const distToDeathPortal = Math.sqrt(
                    Math.pow(segment.x - this.deathPortal.x, 2) +
                    Math.pow(segment.y - this.deathPortal.y, 2)
                );

                // Only draw if not at portal
                if (distToDeathPortal >= 0.5) {
                    this.renderer.drawSnake(ctx, [segment], this.lastFoodType, false, false, true);
                }
            }
        });

        // Draw the head
        this.renderer.drawSnake(ctx, [this.rects[0]], this.lastFoodType, false, false, false);

        // Draw portal foreground layers on top
        this.deathPortalEffect.drawForeground(ctx, this.deathPortal.x, this.deathPortal.y, '#ff4444');
        this.spawnPortalEffect.drawForeground(ctx, this.spawnPortal.x, this.spawnPortal.y, '#44ff44');
    }

    private finalizeRespawn() {
        // Set all segments to their new positions
        this.rects.forEach((segment, i) => {
            if (i === 0) {
                segment.setImmediate(this.spawnPortal.x, this.spawnPortal.y);
            } else {
                const prevSegment = this.rects[i - 1];
                segment.setImmediate(prevSegment.targetX, prevSegment.targetY);
            }
        });

        // Reset movement state
        this.moveTimer = this.moveInterval;
        this.dir = "r";

        // Call the respawn callback if it exists
        this.onRespawn?.();
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
            // Store collision point for death portal
            const head = this.rects[0];
            const collisionPoint = this.getNewPosition(head);
            this.deathPortal = collisionPoint;

            // Choose new spawn location away from death portal
            do {
                this.spawnPortal = {
                    x: randInt(GRID_WIDTH),
                    y: randInt(GRID_HEIGHT)
                };
            } while (
                Math.abs(this.spawnPortal.x - this.deathPortal.x) < 3 &&
                Math.abs(this.spawnPortal.y - this.deathPortal.y) < 3
            );

            // Immediately move head to spawn portal
            head.setImmediate(this.spawnPortal.x, this.spawnPortal.y);

            this.isRespawning = true;
            this.respawnProgress = 0;
            this.respawnDelay = 150; // Slightly slower transition for better effect
        } else {
            this.isGameOver = true;
            this.gameOverTime = this.gameOverDuration;
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
        this.lives = INITIAL_LIVES;
        this.isGhostMode = false;
        this.ghostModeEndTime = 0;
        this.isSlowMotion = false;
        this.slowMotionEndTime = 0;
        this.lastFoodType = null;
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
            this.lastFoodType = food;

            return true;
        }
        return false;
    }

    checkPowerUpCollision(powerUp: PowerUp): boolean {
        if (this.isGameOver) return false;
        const head = this.rects[0];
        return head.targetX === powerUp.x && head.targetY === powerUp.y;
    }
}
