import { Position } from './types';
import { GRID_WIDTH, GRID_HEIGHT } from './constants';

export class SnakePart implements Position {
    public lerpX: number;
    public lerpY: number;
    public targetX: number;
    public targetY: number;
    public progress: number = 1;

    constructor(public x: number, public y: number) {
        this.lerpX = x;
        this.lerpY = y;
        this.targetX = x;
        this.targetY = y;
    }

    setTarget(x: number, y: number) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.targetX = x;
        this.targetY = y;
        this.progress = 0;
    }

    updateLerp(deltaTime: number, moveInterval: number) {
        // Use the current move interval for animation timing
        const speed = deltaTime / moveInterval;

        this.progress = Math.min(1, this.progress + speed);

        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;

        if (Math.abs(dx) > GRID_WIDTH/2) {
            if (dx > 0) dx -= GRID_WIDTH;
            else dx += GRID_WIDTH;
            if (this.progress === 0) {
                if (dx < 0) this.x = GRID_WIDTH;
                else this.x = -1;
            }
        }
        if (Math.abs(dy) > GRID_HEIGHT/2) {
            if (dy > 0) dy -= GRID_HEIGHT;
            else dy += GRID_HEIGHT;
            if (this.progress === 0) {
                if (dy < 0) this.y = GRID_HEIGHT;
                else this.y = -1;
            }
        }

        this.lerpX = this.x + dx * this.progress;
        this.lerpY = this.y + dy * this.progress;

        if (this.lerpX < 0) this.lerpX += GRID_WIDTH;
        if (this.lerpX >= GRID_WIDTH) this.lerpX -= GRID_WIDTH;
        if (this.lerpY < 0) this.lerpY += GRID_HEIGHT;
        if (this.lerpY >= GRID_HEIGHT) this.lerpY -= GRID_HEIGHT;
    }
}
