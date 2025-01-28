import { Direction } from './types';

// Key mappings
const KEY_MAPPINGS = {
    'ArrowLeft': 'l',
    'ArrowRight': 'r',
    'ArrowUp': 'u',
    'ArrowDown': 'd',
    'a': 'l',
    'd': 'r',
    'w': 'u',
    's': 'd'
} as const;

type KeyMap = typeof KEY_MAPPINGS;
type ValidKey = keyof KeyMap;

export class InputHandler {
    private keys: Set<string> = new Set();
    private directionQueue: Direction[] = ['l'];
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private readonly minSwipeDistance: number = 30;

    constructor() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Add touch event listeners
        window.addEventListener('touchstart', this.handleTouchStart.bind(this));
        window.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (this.isValidKey(e.key)) {
            e.preventDefault();
            this.keys.add(e.key);
            this.updateDirection();
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        if (this.isValidKey(e.key)) {
            this.keys.delete(e.key);
        }
    }

    private isValidKey(key: string): key is ValidKey {
        return key in KEY_MAPPINGS;
    }

    private isOppositeDirection(dir1: Direction, dir2: Direction): boolean {
        const opposites = {
            'l': 'r',
            'r': 'l',
            'u': 'd',
            'd': 'u'
        };
        return opposites[dir1] === dir2;
    }

    private updateDirection(): void {
        const pressedKeys = Array.from(this.keys);
        const lastPressedKey = pressedKeys[pressedKeys.length - 1];

        if (!lastPressedKey || !this.isValidKey(lastPressedKey)) {
            return;
        }

        const newDirection = KEY_MAPPINGS[lastPressedKey];
        const lastDirection = this.directionQueue[this.directionQueue.length - 1];

        if (newDirection !== lastDirection && !this.isOppositeDirection(newDirection, lastDirection)) {
            this.directionQueue = [lastDirection, newDirection];
        }
    }

    private handleTouchStart(e: TouchEvent): void {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    private handleTouchEnd(e: TouchEvent): void {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;

        // Only process swipe if the distance is greater than minimum threshold
        if (Math.abs(deltaX) < this.minSwipeDistance && Math.abs(deltaY) < this.minSwipeDistance) {
            return;
        }

        let newDirection: Direction;

        // Determine swipe direction based on which delta is larger
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newDirection = deltaX > 0 ? 'r' : 'l';
        } else {
            newDirection = deltaY > 0 ? 'd' : 'u';
        }

        const lastDirection = this.directionQueue[this.directionQueue.length - 1];
        if (newDirection !== lastDirection && !this.isOppositeDirection(newDirection, lastDirection)) {
            this.directionQueue = [lastDirection, newDirection];
        }
    }

    getNextDirection(): Direction {
        if (this.directionQueue.length > 1) {
            return this.directionQueue.shift()!;
        }
        return this.directionQueue[0];
    }

    clearQueue(): void {
        const currentDirection = this.directionQueue[0];
        this.directionQueue = [currentDirection];
    }
}
