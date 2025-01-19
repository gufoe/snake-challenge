import { Snake } from './snake';
import { Food, foodTypes } from './food';
import { Particle } from './particle';
import { Rect, drawRect, randInt, drawGrid } from './utils';
import "./style.css";

// Set up the canvas element in the HTML
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="game-container">
    <canvas id="canvas" width=500 height=500></canvas>
  </div>
`;

// Initialize canvas and context
const canvas: HTMLCanvasElement = document.querySelector("#canvas")!;
const ctx = canvas.getContext("2d")!;
const map: Rect = {
    x: 0,
    y: 0,
    s: 500,
};

// Add popup text messages
const POPUP_MESSAGES = [
    "Well done! 🎯",
    "Tasty! 😋",
    "Awesome! ⭐",
    "Yummy! 🍎",
    "Great catch! 🎮",
    "Delicious! 🍕",
    "Perfect! 💯",
    "Amazing! 🌟",
    "Fantastic! 🎨",
    "Superb! 🚀",
    "Epic! 🎪",
    "Excellent! 🏆",
];

class PopupText {
    life: number = 1;
    y: number;
    scale: number = 0;
    rotation: number = (Math.random() - 0.5) * 0.2;

    constructor(public x: number, public y0: number, public text: string) {
        this.y = y0;
    }

    update() {
        this.life = Math.max(0, this.life - 0.02);
        this.y = this.y0 - (1 - this.life) * 100;
        this.scale = Math.min(1, this.scale + 0.2);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        // Set text properties
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw text with glow effect
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.life})`;
        ctx.fillText(this.text, 0, 0);

        ctx.restore();
    }
}

// Initialize game state variables
let particles: Particle[] = [];
let popupTexts: PopupText[] = [];
let glowIntensity = 0;
let keys: { [key: string]: boolean } = {};
let currentFood: Food;
let currentFoodIndex = Math.floor(Math.random() * foodTypes.length);

// Add ambient particles
class AmbientParticle {
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    speed: number;
    color: string;
    pulse: number;

    constructor(public x: number, public y: number) {
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 4 + 1;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.speed = Math.random() * 0.3 + 0.1;
        // Random color between green and cyan
        const hue = Math.random() * 60 + 120; // 120-180 range (green to cyan)
        this.color = `hsla(${hue}, 70%, 50%`;
        this.pulse = Math.random() * Math.PI * 2; // Random start phase
    }

    update() {
        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;

        // Wrap around screen
        if (this.x < 0) this.x = 500;
        if (this.x > 500) this.x = 0;
        if (this.y < 0) this.y = 500;
        if (this.y > 500) this.y = 0;

        // Slowly change direction
        const angle = Math.sin(Date.now() / 2000) * 0.02;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const vx = this.vx * cos - this.vy * sin;
        const vy = this.vx * sin + this.vy * cos;
        this.vx = vx;
        this.vy = vy;

        // Pulsing effect
        this.pulse += 0.02;
        const pulseOpacity = this.opacity * (0.7 + 0.3 * Math.sin(this.pulse));
        this.currentOpacity = pulseOpacity;
    }

    currentOpacity: number = 0;

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 2
        );
        gradient.addColorStop(0, `${this.color}, ${this.currentOpacity})`);
        gradient.addColorStop(0.6, `${this.color}, ${this.currentOpacity * 0.3})`);
        gradient.addColorStop(1, `${this.color}, 0)`);
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Create more ambient particles with different layers
const ambientParticles: AmbientParticle[] = [
    // Background layer (slower, larger particles)
    ...Array(50).fill(0).map(() => {
        const p = new AmbientParticle(Math.random() * 500, Math.random() * 500);
        p.speed *= 0.5;
        p.size *= 2;
        p.opacity *= 0.7;
        return p;
    }),
    // Middle layer
    ...Array(75).fill(0).map(() =>
        new AmbientParticle(Math.random() * 500, Math.random() * 500)
    ),
    // Foreground layer (faster, smaller particles)
    ...Array(25).fill(0).map(() => {
        const p = new AmbientParticle(Math.random() * 500, Math.random() * 500);
        p.speed *= 1.5;
        p.size *= 0.7;
        p.opacity *= 1.2;
        return p;
    })
];

// Create the snake
const snake = new Snake(randInt(10), randInt(10));

// Set up keyboard controls
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

// Swipe detection variables
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 30; // Minimum distance for a swipe

// Prevent default touch behavior on the canvas
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (snake.isGameOver) {
        snake.reset(randInt(10), randInt(10));
        particles = [];
        glowIntensity = 0;
        spawnNewFood();
        return;
    }

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Only process swipe if it's long enough
    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
        // Determine swipe direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            keys = {};
            if (deltaX > 0) {
                keys['ArrowRight'] = true;
            } else {
                keys['ArrowLeft'] = true;
            }
        } else {
            // Vertical swipe
            keys = {};
            if (deltaY > 0) {
                keys['ArrowDown'] = true;
            } else {
                keys['ArrowUp'] = true;
            }
        }
    }
}, { passive: false });

// Prevent page scrolling on mobile
document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

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

    // Draw ambient particles with depth effect
    ambientParticles.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    // Update and draw particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    // Update and draw popup texts
    popupTexts = popupTexts.filter(t => t.life > 0);
    popupTexts.forEach(t => {
        t.update();
        t.draw(ctx);
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

            // Add popup text
            const randomMessage = POPUP_MESSAGES[Math.floor(Math.random() * POPUP_MESSAGES.length)];
            popupTexts.push(new PopupText(foodX, foodY, randomMessage));

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
