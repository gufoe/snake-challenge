import { Direction } from './types';

export class InputHandler {
    private keys: { [key: string]: boolean } = {};
    private currentDirection: Direction = 'l';
    private nextDirection: Direction = 'l';

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

        // If the new direction is valid (not opposite to current direction)
        if (!this.isOppositeDirection(newDirection, this.currentDirection)) {
            this.nextDirection = newDirection;
        }
    }

    public getNextDirection(): Direction {
        return this.nextDirection;
    }

    public setCurrentDirection(dir: Direction) {
        this.currentDirection = dir;
    }

    public isKeyPressed(key: string): boolean {
        return this.keys[key] || false;
    }
}
