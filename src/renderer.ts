import { GameState } from './game-state';
import { ScreenShake } from './screen-shake';
import { AmbientParticle } from './ambient-particle';

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private screenShake: ScreenShake;
    private ambientParticles: AmbientParticle[];
    private width: number;
    private height: number;
    private shakeTime: number = 0;
    private shakeIntensity: number = 0;
    private readonly shakeDuration: number = 200;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.screenShake = new ScreenShake();
        this.width = canvas.width;
        this.height = canvas.height;

        // Initialize ambient particles in layers
        this.ambientParticles = [
            // Background layer (slower, larger particles)
            ...Array(50).fill(0).map(() => {
                const p = new AmbientParticle();
                p.speed *= 0.5;
                p.size *= 2.5;  // Increased size for more visibility
                p.opacity = Math.random() * 0.4 + 0.2;  // Increased opacity range (0.2 to 0.6)
                return p;
            }),
            // Middle layer
            ...Array(75).fill(0).map(() => {
                const p = new AmbientParticle();
                p.opacity = Math.random() * 0.5 + 0.3;  // Increased opacity range (0.3 to 0.8)
                return p;
            }),
            // Foreground layer (faster, smaller particles)
            ...Array(25).fill(0).map(() => {
                const p = new AmbientParticle();
                p.speed *= 1.5;
                p.size *= 0.7;
                p.opacity = Math.random() * 0.6 + 0.4;  // Increased opacity range (0.4 to 1.0)
                return p;
            })
        ];
    }

    draw(gameState: GameState): void {
        // Clear canvas with a dark background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Apply screen shake
        this.applyScreenShake();

        // Draw ambient particles
        this.ambientParticles.forEach(p => {
            p.update(16.67); // Assuming 60fps
            p.draw(this.ctx, gameState.currentFood);
        });

        // Draw game elements
        gameState.draw(this.ctx);

        // Reset transform
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    private applyScreenShake(): void {
        if (this.shakeTime > 0) {
            const progress = this.shakeTime / this.shakeDuration;
            const intensity = this.shakeIntensity * progress;
            const offsetX = Math.sin(Date.now() / 50) * intensity;
            const offsetY = Math.cos(Date.now() / 40) * intensity;
            this.ctx.translate(offsetX, offsetY);
            this.shakeTime = Math.max(0, this.shakeTime - 16.67); // Assuming 60fps
        }
    }

    startShake(intensity: number, duration: number = this.shakeDuration): void {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }
}
