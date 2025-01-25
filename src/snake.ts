import { GRID_HEIGHT, GRID_WIDTH, INITIAL_LIVES } from './constants';
import { Food } from './food';
import { GameUI } from './game-ui';
import { InputHandler } from './input-handler';
import { PowerUp } from './powerup';
import { SnakePart } from './snake-part';
import { SnakeRenderer } from './snake-renderer';
import { Direction, Drawable, Position, Updateable } from './types';
import { randInt } from './utils';

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

    // Add transition properties
    transitionTime = 0;
    transitionDuration = 1000; // 1 second transition
    lastFoodType: Food | null = null;

    constructor(x: number, y: number) {
        this.rects = [
            new SnakePart(x, y),
            new SnakePart(x + 1, y)
        ];
        this.inputHandler = new InputHandler();
        this.renderer = new SnakeRenderer();
        this.ui = new GameUI();
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
        // Draw the snake using the renderer
        this.renderer.drawSnake(ctx, this.rects, this.lastFoodType, this.isGhostMode, this.isSlowMotion);

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
            this.grow({ x: this.rects[i - 1].targetX, y: this.rects[i - 1].targetY });
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
