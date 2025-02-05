import "./style.css";
import { GameState } from './game-state';
import { Renderer } from './renderer';
import { AmbientParticle } from './ambient-particle';

// Declare gs on window
declare global {
    interface Window {
        gs: GameState;
    }
}

// Remove unused imports

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
// Expose game state globally
window.gs = gameState;
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

// Add touch event handling for game restart
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (gameState.snake.isGameOver) {
        gameState.reset();
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
