import { Snake } from './snake';
import { Food, foodTypes } from './food';
import { Particle } from './particle';
import { Rect, drawRect, randInt, drawGrid } from './utils';
import "./style.css";

// Set up the canvas element in the HTML
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <canvas id="canvas" width=500 height=500/>
`;

// Initialize canvas and context
const canvas: HTMLCanvasElement = document.querySelector("#canvas")!;
const ctx = canvas.getContext("2d")!;
const map: Rect = {
    x: 0,
    y: 0,
    s: 500,
};

// Initialize game state variables
let particles: Particle[] = [];
let glowIntensity = 0;
let keys: { [key: string]: boolean } = {};
let currentFood: Food;
let currentFoodIndex = Math.floor(Math.random() * foodTypes.length);

// Create the snake
const snake = new Snake(randInt(10), randInt(10));

// Modify spawn function to cycle through food types
function spawnNewFood() {
    let x: number, y: number;
    do {
        x = randInt(10);
        y = randInt(10);
    } while (snake.rects.some((r) => r.targetX == x && r.targetY == y));

    // Cycle to next food type
    currentFoodIndex = (currentFoodIndex + 1) % foodTypes.length;
    const FoodType = foodTypes[currentFoodIndex];
    currentFood = new FoodType(x, y);
}

// Initialize first food
spawnNewFood();

/**
 * Draws the food with enhanced animations and effects
 */
function drawFood() {
    // Update current food's animation state
    currentFood.update();
    // Draw current food using its specific drawing method
    currentFood.draw(ctx);
}

// Track time for smooth animation
let lastTime = performance.now();

/**
 * Main game loop
 * Updates and renders the game state each frame
 */
function gameLoop(currentTime: number) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Clear and draw background
    drawRect(ctx, map, "#1A1A1A");
    drawGrid(ctx);

    // Update and draw particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    // Fade out glow intensity
    glowIntensity = Math.max(0, glowIntensity - deltaTime * 0.1);

    // Draw score with enhanced shadow effect
    ctx.fillStyle = "#FFF";
    ctx.font = "bold 40px 'Arial'";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(`Score: ${snake.score}`, 10, 490);
    ctx.shadowBlur = 0;

    // Update and draw game objects
    drawFood();
    snake.processInput(keys);
    snake.update(deltaTime);

    // Check for food collision if game is not over
    if (!snake.isGameOver) {
        const head = snake.rects[0];
        if (head.targetX === currentFood.x && head.targetY === currentFood.y) {
            const foodX = currentFood.x * 50 + 25;
            const foodY = currentFood.y * 50 + 25;

            // Store the food type for transition effect
            snake.lastFoodType = currentFood;
            snake.transitionTime = snake.transitionDuration;
            snake.effectRotation = 0;

            // Create food-specific eat effect
            const newParticles = currentFood.createEatEffect(foodX, foodY);
            particles.push(...newParticles);

            // Add flash effect
            glowIntensity = 40;

            // Add new tail segment
            const lastPos = snake.rects[snake.rects.length - 1];
            snake.grow({ x: lastPos.targetX, y: lastPos.targetY });

            // Update score based on food type
            snake.score += currentFood.points;

            // Spawn new food
            spawnNewFood();
        }
    }

    snake.draw(ctx);

    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);

// Set up keyboard input handling
window.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && snake.isGameOver) {
        // Reset the game
        snake.reset(randInt(10), randInt(10));
        particles = [];
        glowIntensity = 0;
        spawnNewFood();
        return;
    }

    keys = {};
    keys[e.key] = true;
});
