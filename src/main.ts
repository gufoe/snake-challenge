import { Snake } from './snake';
import { Food, foodTypes, StarFood, RainbowFood, CrystalFood, PulsarFood } from './food';
import { Particle } from './particle';
import { Rect, drawRect, randInt } from './utils';
import "./style.css";
import { GameState } from './game-state';
import { Renderer } from './renderer';
import { PopupText } from './popup';
import { POPUP_MESSAGES } from './popup';
import { AmbientParticle } from './ambient-particle';

// Set up the canvas element in the HTML
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="game-container">
    <canvas id="canvas" width=600 height=1050></canvas>
  </div>
`;

// Initialize canvas
const canvas = document.querySelector('canvas')!;
canvas.width = 600;
canvas.height = 1050;

// Initialize game state and renderer
const gameState = new GameState();
const renderer = new Renderer(canvas);

// Create ambient particles with different layers
const ambientParticles: AmbientParticle[] = [
    // Background layer (slower, larger particles)
    ...Array(50).fill(0).map(() => {
        const p = new AmbientParticle();
        p.speed *= 0.5;
        p.size *= 2;
        p.opacity *= 0.7;
        return p;
    }),
    // Middle layer
    ...Array(75).fill(0).map(() => new AmbientParticle()),
    // Foreground layer (faster, smaller particles)
    ...Array(25).fill(0).map(() => {
        const p = new AmbientParticle();
        p.speed *= 1.5;
        p.size *= 0.7;
        p.opacity *= 1.2;
        return p;
    })
];

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    gameState.processInput(e);
});

// Swipe detection variables
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 30; // Minimum distance for a swipe

// Prevent default touch behavior on the canvas
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.snake.isGameOver) {
        gameState.reset();
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
        // Create a synthetic keyboard event based on swipe direction
        const key = Math.abs(deltaX) > Math.abs(deltaY)
            ? (deltaX > 0 ? 'ArrowRight' : 'ArrowLeft')
            : (deltaY > 0 ? 'ArrowDown' : 'ArrowUp');

        gameState.processInput(new KeyboardEvent('keydown', { key }));
    }
}, { passive: false });

// Prevent page scrolling on mobile
document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Game loop
let lastTime = 0;

function gameLoop(currentTime: number) {
    // Calculate delta time in milliseconds (not seconds)
    const deltaTime = lastTime ? (currentTime - lastTime) : 0;
    lastTime = currentTime;

    // Update ambient particles
    ambientParticles.forEach(p => p.update());

    // Update game state
    gameState.update(deltaTime);

    // Check for food collision
    if (gameState.snake.checkFoodCollision(gameState.currentFood)) {
        // Vibrate if supported
        if ('vibrate' in navigator) {
            navigator.vibrate([20, 15, 10]);
        }

        // Create explosion effect for current food
        gameState.currentFood.createEatEffect(gameState.particles);

        // Spawn new food and create its explosion effect
        gameState.spawnNewFood();
        gameState.currentFood.createEatEffect(gameState.particles);

        // Create popup text
        const foodX = gameState.currentFood.x * 50 + 25;
        const foodY = gameState.currentFood.y * 50 + 25;
        const message = POPUP_MESSAGES[Math.floor(Math.random() * POPUP_MESSAGES.length)];
        gameState.popupTexts.push(new PopupText(message, foodX, foodY));

        // Trigger screen shake
        renderer.startShake(5 + Math.min(gameState.snake.score, 20), 200);
    }

    // Draw everything
    renderer.draw(gameState);

    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start game loop
requestAnimationFrame(gameLoop);
