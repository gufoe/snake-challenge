export interface Rect {
    x: number;
    y: number;
    s?: number;
}

export interface Position {
    x: number;
    y: number;
}

export interface Velocity {
    vx: number;
    vy: number;
}

export interface ParticleOptions {
    speed?: number;
    size?: number;
    life?: number;
    shape?: 'circle' | 'star' | 'spark' | 'beam' | 'crystal' | 'triangle' | 'square' | 'pentagon';
    angle?: number;
    spin?: boolean;
    trail?: boolean;
    rainbow?: boolean;
    shimmer?: boolean;
    pulse?: boolean;
    quantum?: boolean;
}

export type Direction = 'l' | 'u' | 'd' | 'r';

export interface DrawableEffect {
    draw(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void;
}

export interface Updateable {
    update(deltaTime: number): void;
}

export interface Drawable {
    draw(ctx: CanvasRenderingContext2D): void;
}
