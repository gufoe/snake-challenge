import { Food, foodTypes, StarFood } from './food';
import { Snake } from './snake';
import { Particle } from './particle';
import { PopupText, POPUP_MESSAGES } from './popup';
import { randInt } from './utils';
import { Updateable, Drawable } from './types';
import { PowerUp, powerUpTypes, ExtraLifePowerUp, TimeSlowPowerUp, GhostPowerUp } from './powerup';

export class GameState implements Updateable, Drawable {
    snake: Snake;
    currentFood: Food | null = null;
    currentPowerUp: PowerUp | null = null;
    powerUpSpawnTimer: number = 15000; // Spawn power-up every 15 seconds
    particles: Particle[] = [];
    popupTexts: PopupText[] = [];
    glowIntensity: number = 0;
    keys: { [key: string]: boolean } = {};
    currentFoodIndex: number = 0;
    nextFoodType: Food | null = null;

    constructor() {
        this.snake = new Snake(6, 10);
        this.spawnNewFood();
        // Set initial snake style to match first food
        if (this.currentFood) {
            this.snake.lastFoodType = this.currentFood;
            this.snake.transitionTime = 0;
            this.snake.effectRotation = 0;
        }
    }

    update(deltaTime: number): void {
        // Update snake
        this.snake.update(deltaTime);

        // Update food animations
        if (this.currentFood) {
            this.currentFood.update();
            // Always keep snake style matching current food
            this.snake.lastFoodType = this.currentFood;
        }

        // Update power-up
        if (this.currentPowerUp) {
            this.currentPowerUp.update();
            if (this.currentPowerUp.isExpired()) {
                this.currentPowerUp = null;
            }
        }

        // Update power-up spawn timer
        if (!this.currentPowerUp) {
            this.powerUpSpawnTimer -= deltaTime;
            if (this.powerUpSpawnTimer <= 0) {
                this.spawnNewPowerUp();
                this.powerUpSpawnTimer = 15000; // Reset timer
            }
        }

        // Update particles
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            p.update();
            // Scale deltaTime to match particle life values (convert ms to frames at 60fps)
            p.life -= (deltaTime / 16.67);
        });

        // Update popup texts
        this.popupTexts = this.popupTexts.filter(p => p.life > 0);
        this.popupTexts.forEach(p => p.update());

        // Check for food collision
        if (this.currentFood && this.snake.checkFoodCollision(this.currentFood)) {
            // Create food collection effects
            this.currentFood.createEatEffect(this.particles);

            // Create popup text
            const foodX = this.currentFood.x * 50 + 25;
            const foodY = this.currentFood.y * 50 + 25;
            const message = POPUP_MESSAGES[Math.floor(Math.random() * POPUP_MESSAGES.length)];
            this.popupTexts.push(new PopupText(message, foodX, foodY));

            // Reset transition effect
            this.snake.transitionTime = 0;
            this.snake.effectRotation = 0;

            // Spawn new food
            this.spawnNewFood();
        }

        // Check for power-up collision
        if (this.currentPowerUp && this.snake.checkPowerUpCollision(this.currentPowerUp)) {
            // Create power-up collection effects
            const particles = this.currentPowerUp.createCollectEffect(
                this.currentPowerUp.x * 50 + 25,
                this.currentPowerUp.y * 50 + 25
            );
            this.particles.push(...particles);

            // Apply power-up effect
            this.currentPowerUp.applyEffect(this.snake);

            // Create descriptive popup text based on power-up type
            const powerUpX = this.currentPowerUp.x * 50 + 25;
            const powerUpY = this.currentPowerUp.y * 50 + 25;
            let message = "";

            if (this.currentPowerUp instanceof ExtraLifePowerUp) {
                message = "+1 Life!";
            } else if (this.currentPowerUp instanceof TimeSlowPowerUp) {
                message = "Slow Motion! (5s)";
            } else if (this.currentPowerUp instanceof GhostPowerUp) {
                message = "Ghost Mode! (7s)";
            }

            this.popupTexts.push(new PopupText(message, powerUpX, powerUpY));

            this.currentPowerUp = null;
            this.powerUpSpawnTimer = 15000; // Reset timer
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        // Draw food
        if (this.currentFood) {
            this.currentFood.draw(ctx);
        }

        // Draw power-up
        if (this.currentPowerUp) {
            this.currentPowerUp.draw(ctx);
        }

        // Draw particles
        this.particles.forEach(p => p.draw(ctx));

        // Draw snake
        this.snake.draw(ctx);

        // Draw popup texts
        this.popupTexts.forEach(p => p.draw(ctx));
    }

    spawnNewFood(): void {
        let x: number, y: number;
        do {
            x = randInt(12);
            y = randInt(21);
        } while (this.snake.rects.some(r => r.targetX === x && r.targetY === y));

        const foodType = foodTypes[randInt(foodTypes.length)];
        this.currentFood = new foodType(x, y);
    }

    spawnNewPowerUp(): void {
        let x: number, y: number;
        do {
            x = randInt(12);
            y = randInt(21);
        } while (
            this.snake.rects.some(r => r.targetX === x && r.targetY === y) ||
            (this.currentFood && this.currentFood.x === x && this.currentFood.y === y)
        );

        const PowerUpType = powerUpTypes[randInt(powerUpTypes.length)];
        this.currentPowerUp = new PowerUpType(x, y);

        // Add descriptive popup text when power-up spawns
        const powerUpX = x * 50 + 25;
        const powerUpY = y * 50 + 25;
        let message = "";

        if (this.currentPowerUp instanceof ExtraLifePowerUp) {
            message = "Extra Life Power-up!";
        } else if (this.currentPowerUp instanceof TimeSlowPowerUp) {
            message = "Time Slow Power-up!";
        } else if (this.currentPowerUp instanceof GhostPowerUp) {
            message = "Ghost Mode Power-up!";
        }

        this.popupTexts.push(new PopupText(message, powerUpX, powerUpY));
    }

    reset(): void {
        this.snake.reset(6, 10);
        this.particles = [];
        this.popupTexts = [];
        this.currentPowerUp = null;
        this.powerUpSpawnTimer = 15000;
        this.spawnNewFood();
        // Reset snake style to match new food
        if (this.currentFood) {
            this.snake.lastFoodType = this.currentFood;
            this.snake.transitionTime = 0;
            this.snake.effectRotation = 0;
        }
    }
}
