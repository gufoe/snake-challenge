import { Snake } from './snake';
import { Food, foodTypes, StarFood } from './food';
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

// Add keyboard event handling
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState.snake.isGameOver) {
        gameState.reset();
    }

    // Prevent default behavior for arrow keys and space to avoid scrolling
    if (e.key.startsWith('Arrow') || e.code === 'Space') {
        e.preventDefault();
    }
});

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

// Game loop
let lastTime = performance.now();

function gameLoop(currentTime: number) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Update ambient particles
    ambientParticles.forEach(p => p.update(deltaTime));

    // Update game state
    gameState.update(deltaTime);

    // Draw everything
    renderer.draw(gameState);

    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start game loop
requestAnimationFrame(gameLoop);
