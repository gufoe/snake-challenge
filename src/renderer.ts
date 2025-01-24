import { GameState } from './game-state';
import { ScreenShake } from './screen-shake';
import { AmbientParticle } from './ambient-particle';

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private screenShake: ScreenShake;
    private ambientParticles: AmbientParticle[];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.screenShake = new ScreenShake();
        this.ambientParticles = [];

        // Initialize ambient particles
        for (let i = 0; i < 50; i++) {
            this.ambientParticles.push(new AmbientParticle());
        }
    }

    draw(gameState: GameState) {
        const { ctx } = this;

        // Clear canvas with black background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply screen shake
        this.screenShake.update();
        ctx.save();
        ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);

        // Draw background grid
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= 600; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 1050);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= 1050; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(600, y);
            ctx.stroke();
        }

        // Draw ambient particles
        this.ambientParticles.forEach(p => p.draw(ctx, gameState.currentFood));

        // Draw food
        gameState.currentFood.draw(ctx);

        // Draw snake
        gameState.snake.draw(ctx, gameState.currentFood);

        // Draw particles
        gameState.particles.forEach(p => p.draw(ctx));

        // Draw popup texts
        gameState.popupTexts.forEach(t => t.draw(ctx));

        // Draw game over screen if needed
        if (gameState.snake.isGameOver) {
            gameState.snake.drawGameOver(ctx);
        }

        // Restore canvas transform
        ctx.restore();
    }

    startShake(intensity: number, duration: number) {
        this.screenShake.start(intensity, duration);
    }
}
