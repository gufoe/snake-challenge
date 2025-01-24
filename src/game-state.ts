import { Food, foodTypes, StarFood } from './food';
import { Snake } from './snake';
import { Particle } from './particle';
import { PopupText } from './popup';
import { randInt } from './utils';

export class GameState {
    particles: Particle[] = [];
    popupTexts: PopupText[] = [];
    glowIntensity: number = 0;
    keys: { [key: string]: boolean } = {};
    currentFood: Food;
    currentFoodIndex: number;
    nextFoodType: Food;
    snake: Snake;

    constructor() {
        // Initialize food system
        this.currentFoodIndex = Math.floor(Math.random() * foodTypes.length);
        const initialFoodType = foodTypes[this.currentFoodIndex];
        this.currentFood = new initialFoodType(randInt(12), randInt(21));

        // Create snake
        this.snake = new Snake(randInt(12), randInt(21));
        this.snake.lastFoodType = this.currentFood;
        this.snake.transitionTime = 0; // No transition needed for initial state

        // Prepare next food
        this.currentFoodIndex = (this.currentFoodIndex + 1) % foodTypes.length;
        const NextFoodType = foodTypes[this.currentFoodIndex];
        this.nextFoodType = new NextFoodType(0, 0);
    }

    spawnNewFood() {
        let x: number, y: number;
        do {
            x = randInt(12);
            y = randInt(21);
        } while (this.snake.rects.some((r) => r.targetX == x && r.targetY == y));

        // Current food becomes the previously prepared next food
        if (this.nextFoodType) {
            this.currentFood = this.nextFoodType;
            this.currentFood.x = x;
            this.currentFood.y = y;
        } else {
            // First food spawn
            this.currentFoodIndex = Math.floor(Math.random() * foodTypes.length);
            const FoodType = foodTypes[this.currentFoodIndex];
            this.currentFood = new FoodType(x, y);
        }

        // Prepare next food
        this.currentFoodIndex = (this.currentFoodIndex + 1) % foodTypes.length;
        const NextFoodType = foodTypes[this.currentFoodIndex];
        this.nextFoodType = new NextFoodType(0, 0);
    }

    reset() {
        this.snake.reset(randInt(12), randInt(21));
        this.particles = [];
        this.glowIntensity = 0;
        this.spawnNewFood();
        // Reset snake style to match current food
        this.snake.lastFoodType = this.currentFood;
        this.snake.transitionTime = this.snake.transitionDuration;
    }

    processInput(e: KeyboardEvent) {
        if ((e.key === "Enter" || e.code === "Space") && this.snake.isGameOver) {
            this.reset();
            return;
        }

        this.keys = {};
        this.keys[e.key] = true;
        this.snake.processInput(this.keys);
    }

    update(deltaTime: number) {
        // Update food animation
        this.currentFood.update();

        // Update particles
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            p.update();
        });

        // Update popup texts
        this.popupTexts = this.popupTexts.filter(t => t.life > 0);
        this.popupTexts.forEach(t => {
            t.update();
        });

        // Fade out glow intensity
        this.glowIntensity = Math.max(0, this.glowIntensity - deltaTime * 0.1);

        // Update snake
        this.snake.update(deltaTime);
    }
}
