import { Direction } from './types';

export class InputHandler {
    private keys: { [key: string]: boolean } = {};
    private currentDirection: Direction = 'l';
    private directionQueue: Direction[] = ['l'];  // Queue of directions to process
    private maxQueueSize = 3;  // Limit queue size to prevent too many buffered inputs

    constructor() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.updateDirection();

            // Prevent default behavior for arrow keys
            if (e.key.startsWith('Arrow')) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    private isOppositeDirection(dir1: Direction, dir2: Direction): boolean {
        return (
            (dir1 === 'l' && dir2 === 'r') ||
            (dir1 === 'r' && dir2 === 'l') ||
            (dir1 === 'u' && dir2 === 'd') ||
            (dir1 === 'd' && dir2 === 'u')
        );
    }

    private updateDirection() {
        let newDirection: Direction | null = null;

        // Get the latest pressed direction
        if (this.keys["a"] || this.keys["ArrowLeft"]) newDirection = "l";
        if (this.keys["d"] || this.keys["ArrowRight"]) newDirection = "r";
        if (this.keys["w"] || this.keys["ArrowUp"]) newDirection = "u";
        if (this.keys["s"] || this.keys["ArrowDown"]) newDirection = "d";

        if (!newDirection) return;

        // Get the last direction in the queue
        const lastDirection = this.directionQueue[this.directionQueue.length - 1];

        // Only add to queue if it's not the same as the last direction and not opposite to the last queued direction
        if (newDirection !== lastDirection && !this.isOppositeDirection(newDirection, lastDirection)) {
            // Add to queue if within size limit
            if (this.directionQueue.length < this.maxQueueSize) {
                this.directionQueue.push(newDirection);
            }
        }
    }

    public getNextDirection(): Direction {
        // If queue is empty, return current direction
        if (this.directionQueue.length === 0) {
            return this.currentDirection;
        }
        return this.directionQueue[0];
    }

    public setCurrentDirection(dir: Direction) {
        this.currentDirection = dir;
        // Remove the direction we just used from the queue
        if (this.directionQueue.length > 0) {
            this.directionQueue.shift();
        }
    }

    public isKeyPressed(key: string): boolean {
        return this.keys[key] || false;
    }
}
