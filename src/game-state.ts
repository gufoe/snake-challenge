import { Food, foodTypes, StarFood } from './food';
import { Snake } from './snake';
import { Particle } from './particle';
import { PopupText, POPUP_MESSAGES } from './popup';
import { randInt } from './utils';
import { Updateable, Drawable } from './types';

export class GameState implements Updateable, Drawable {
    snake: Snake;
    currentFood: Food | null = null;
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
    }

    draw(ctx: CanvasRenderingContext2D): void {
        // Draw food
        if (this.currentFood) {
            this.currentFood.draw(ctx);
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

    reset(): void {
        this.snake.reset(6, 10);
        this.particles = [];
        this.popupTexts = [];
        this.spawnNewFood();
        // Reset snake style to match new food
        if (this.currentFood) {
            this.snake.lastFoodType = this.currentFood;
            this.snake.transitionTime = 0;
            this.snake.effectRotation = 0;
        }
    }
}
