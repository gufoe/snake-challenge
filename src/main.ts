import { Rect, drawRect, randInt } from "./lib";
import "./style.css";

// Set up the canvas element in the HTML
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <canvas id="canvas" width=500 height=500/>
`;

// Initialize canvas and context
const canvas: HTMLCanvasElement = document.querySelector("#canvas")!;
const ctx = canvas.getContext("2d")!;
const map: Rect = {
    x: 0,
    y: 0,
    s: 500,
};

/**
 * Represents a single segment of the snake
 * Each segment smoothly interpolates between positions using lerp (linear interpolation)
 */
class SnakePart {
    // Current interpolated position (smooth movement)
    public lerpX: number;
    public lerpY: number;
    // Target grid position to move towards
    public targetX: number;
    public targetY: number;
    // Progress of movement from current to target position (0 to 1)
    public progress: number = 1;

    public constructor(public x: number, public y: number) {
        this.lerpX = x;
        this.lerpY = y;
        this.targetX = x;
        this.targetY = y;
    }

    /**
     * Draws the snake segment and its connection to the next segment
     * @param c - Color of the segment
     * @param isHead - Whether this segment is the snake's head
     * @param nextPart - The next segment to connect to (if any)
     */
    draw(c: string, isHead: boolean = false, nextPart?: SnakePart) {
        const ctx = canvas.getContext("2d")!;
        const x = this.lerpX * 50;
        const y = this.lerpY * 50;
        const size = 50;
        const padding = 4;

        // Enhanced glow effect
        ctx.shadowColor = c;
        ctx.shadowBlur = 25 + glowIntensity;

        // Draw connection to next segment if it exists
        if (nextPart) {
            const nx = nextPart.lerpX * 50;
            const ny = nextPart.lerpY * 50;

            let dx = nx - x;
            let dy = ny - y;

            if (Math.abs(dx) > size * 2) dx = dx > 0 ? dx - 500 : dx + 500;
            if (Math.abs(dy) > size * 2) dy = dy > 0 ? dy - 500 : dy + 500;

            // Create more vibrant gradient for connection
            const gradient = ctx.createLinearGradient(
                x + size/2, y + size/2,
                x + size/2 + dx/2, y + size/2 + dy/2
            );
            gradient.addColorStop(0, c);
            gradient.addColorStop(0.2, shadeColor(c, 15));
            gradient.addColorStop(0.8, shadeColor(c, 15));
            gradient.addColorStop(1, c);

            ctx.fillStyle = gradient;
            ctx.beginPath();

            const angle = Math.atan2(dy, dx);
            ctx.save();
            ctx.translate(x + size/2, y + size/2);
            ctx.rotate(angle);

            // Smoother connection with curved edges
            const length = Math.sqrt(dx*dx + dy*dy);
            const width = 42;
            ctx.beginPath();
            ctx.moveTo(-5, -width/2);
            ctx.lineTo(length + 5, -width/2);
            ctx.quadraticCurveTo(length + 15, 0, length + 5, width/2);
            ctx.lineTo(-5, width/2);
            ctx.quadraticCurveTo(-15, 0, -5, -width/2);
            ctx.fill();

            ctx.restore();
        }

        // Create dynamic gradient for the main segment body
        const gradient = ctx.createRadialGradient(
            x + size/2 - 15, y + size/2 - 15, 0,
            x + size/2, y + size/2, size/1.2
        );
        gradient.addColorStop(0, shadeColor(c, 40));
        gradient.addColorStop(0.5, c);
        gradient.addColorStop(1, shadeColor(c, -20));

        // Draw main body with rounded corners
        ctx.fillStyle = gradient;
        ctx.beginPath();
        const radius = 24;
        ctx.roundRect(x + padding, y + padding, size - padding*2, size - padding*2, radius);
        ctx.fill();

        // Add details for head segment
        if (isHead) {
            // Add metallic shine effect
            const shineGradient = ctx.createLinearGradient(
                x + padding, y + padding,
                x + size - padding, y + size - padding
            );
            shineGradient.addColorStop(0, 'rgba(255,255,255,0.2)');
            shineGradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
            shineGradient.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.fillStyle = shineGradient;
            ctx.beginPath();
            ctx.roundRect(x + padding, y + padding, size - padding*2, size - padding*2, radius);
            ctx.fill();

            // Add eyes with enhanced glow
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 15;
            ctx.fillStyle = "#fff";
            const eyeSize = 9;
            const eyeOffset = 15;
            const eyeY = y + eyeOffset;

            // Left eye
            ctx.beginPath();
            ctx.arc(x + eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // Right eye
            ctx.beginPath();
            ctx.arc(x + size - eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // Add pupils that follow movement direction with gradient
            ctx.shadowBlur = 0;
            const pupilGradient = ctx.createRadialGradient(
                x + eyeOffset, eyeY, 0,
                x + eyeOffset, eyeY, eyeSize/1.5
            );
            pupilGradient.addColorStop(0, '#444');
            pupilGradient.addColorStop(1, '#000');
            ctx.fillStyle = pupilGradient;

            let pupilX = 0;
            let pupilY = 0;

            // Adjust pupil position based on movement direction
            if (snake.dir === 'l') pupilX = -3;
            if (snake.dir === 'r') pupilX = 3;
            if (snake.dir === 'u') pupilY = -3;
            if (snake.dir === 'd') pupilY = 3;

            ctx.beginPath();
            ctx.arc(x + eyeOffset + pupilX, eyeY + pupilY, eyeSize/1.8, 0, Math.PI * 2);
            ctx.arc(x + size - eyeOffset + pupilX, eyeY + pupilY, eyeSize/1.8, 0, Math.PI * 2);
            ctx.fill();

            // Add eye shine
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            const shineSize = 3;
            ctx.beginPath();
            ctx.arc(x + eyeOffset - 2, eyeY - 2, shineSize, 0, Math.PI * 2);
            ctx.arc(x + size - eyeOffset - 2, eyeY - 2, shineSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    /**
     * Updates the interpolated position based on progress towards target
     * @param deltaTime - Time elapsed since last update (for smooth animation)
     */
    updateLerp(deltaTime: number) {
        // Calculate movement speed based on time elapsed
        const speed = deltaTime / 150; // 150ms to move one cell

        // Update progress towards target position
        this.progress = Math.min(1, this.progress + speed);

        // Calculate the shortest path to target (handling wrap-around)
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;

        // Handle wrap-around movement across screen edges
        if (Math.abs(dx) > 5) {
            if (dx > 0) dx -= 10;
            else dx += 10;
        }
        if (Math.abs(dy) > 5) {
            if (dy > 0) dy -= 10;
            else dy += 10;
        }

        // Update interpolated position
        this.lerpX = this.x + dx * this.progress;
        this.lerpY = this.y + dy * this.progress;

        // Keep interpolated positions within bounds
        if (this.lerpX < 0) this.lerpX += 10;
        if (this.lerpX > 9) this.lerpX -= 10;
        if (this.lerpY < 0) this.lerpY += 10;
        if (this.lerpY > 9) this.lerpY -= 10;
    }

    /**
     * Sets a new target position for the segment to move towards
     */
    setTarget(x: number, y: number) {
        // Current target becomes new starting position
        this.x = this.targetX;
        this.y = this.targetY;
        // Set new target position
        this.targetX = x;
        this.targetY = y;
        // Reset progress for new movement
        this.progress = 0;
    }
}

/**
 * Helper function to create darker/lighter variations of colors
 * Used for gradients to create 3D effect
 */
function shadeColor(color: string, percent: number) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

// Initialize game state variables
let particles: Particle[] = [];
let glowIntensity = 0;
let foodRotation = 0;
let foodScale = 1;
let foodGlowIntensity = 20;
let foodPulse = 0;
let keys: any = {};
let currentFood: Food;

// Define Particle class first as it's used by other classes
class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
    rotation: number = 0;
    rotationSpeed: number;
    shape: 'circle' | 'star' | 'spark' = 'circle';

    constructor(x: number, y: number, color: string, options: {
        speed?: number,
        size?: number,
        life?: number,
        shape?: 'circle' | 'star' | 'spark'
    } = {}) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = (options.speed || 1) * (Math.random() * 5 + 2);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = options.size || 4;
        this.maxLife = options.life || (50 + Math.random() * 30);
        this.life = this.maxLife;
        this.color = color;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.shape = options.shape || 'circle';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.life--;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const alpha = this.life / this.maxLife;
        const currentSize = Math.max(0.1, this.size * alpha); // Prevent size from going to 0
        ctx.fillStyle = this.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'star') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                const nextAngle = ((i + 1) * Math.PI * 2) / 5 - Math.PI / 2;
                const r1 = currentSize;
                const r2 = currentSize * 0.5;

                const x1 = Math.cos(angle) * r1;
                const y1 = Math.sin(angle) * r1;
                const x2 = Math.cos((angle + nextAngle) / 2) * r2;
                const y2 = Math.sin((angle + nextAngle) / 2) * r2;

                if (i === 0) ctx.moveTo(x1, y1);
                else ctx.lineTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (this.shape === 'spark') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            ctx.moveTo(-currentSize, 0);
            ctx.lineTo(currentSize, 0);
            ctx.moveTo(0, -currentSize);
            ctx.lineTo(0, currentSize);
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = Math.max(0.5, 2 * alpha); // Prevent line width from going too small
            ctx.stroke();
            ctx.restore();
        }
    }
}

// Define base Food class and food types
abstract class Food {
    x: number;
    y: number;
    rotation: number = 0;
    scale: number = 1;
    pulse: number = 0;
    glowIntensity: number = 20;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    update() {
        this.pulse = (this.pulse + 0.1) % (Math.PI * 2);
        this.rotation = (this.rotation + 0.02);
        this.scale = 1 + Math.sin(this.pulse) * 0.1;
        this.glowIntensity = 20 + Math.sin(this.pulse) * 10;
    }

    abstract draw(ctx: CanvasRenderingContext2D): void;
    abstract createEatEffect(x: number, y: number): void;
    abstract get points(): number;
}

class StarFood extends Food {
    draw(ctx: CanvasRenderingContext2D) {
        const centerX = this.x * 50 + 25;
        const centerY = this.y * 50 + 25;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        ctx.shadowColor = "#FF5722";
        ctx.shadowBlur = this.glowIntensity;

        // Draw star shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const nextAngle = ((i + 1) * Math.PI * 2) / 5 - Math.PI / 2;
            const outerX = Math.cos(angle) * 18;
            const outerY = Math.sin(angle) * 18;
            const innerX = Math.cos((angle + nextAngle) / 2) * 8;
            const innerY = Math.sin((angle + nextAngle) / 2) * 8;

            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(-8, -8, 0, 0, 0, 20);
        gradient.addColorStop(0, '#FF7043');
        gradient.addColorStop(0.6, '#FF5722');
        gradient.addColorStop(1, '#F4511E');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Orbital dots
        ctx.fillStyle = '#FFB74D';
        for (let i = 0; i < 4; i++) {
            const angle = this.rotation * 2 + (i * Math.PI * 2) / 4;
            const x = Math.cos(angle) * 25;
            const y = Math.sin(angle) * 25;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    createEatEffect(x: number, y: number) {
        // Original particle effect
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            particles.push(new Particle(x, y, 'rgb(255, 87, 34)', {
                speed: 2,
                size: 5,
                life: 40,
                shape: 'star'
            }));
        }
    }

    get points() { return 1; }
}

class RainbowFood extends Food {
    private hue: number = 0;

    update() {
        super.update();
        this.hue = (this.hue + 1) % 360;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const centerX = this.x * 50 + 25;
        const centerY = this.y * 50 + 25;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
        ctx.shadowBlur = this.glowIntensity;

        // Draw spiral
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 15;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${(this.hue + i * 60) % 360}, 100%, 50%)`;
            ctx.fill();
        }

        ctx.restore();
    }

    createEatEffect(x: number, y: number) {
        // Rainbow explosion
        for (let i = 0; i < 36; i++) {
            const hue = (this.hue + i * 10) % 360;
            particles.push(new Particle(x, y, `hsl(${hue}, 100%, 50%)`, {
                speed: 3,
                size: 4,
                life: 50,
                shape: 'circle'
            }));
        }
    }

    get points() { return 2; }
}

class CrystalFood extends Food {
    draw(ctx: CanvasRenderingContext2D) {
        const centerX = this.x * 50 + 25;
        const centerY = this.y * 50 + 25;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        ctx.shadowColor = "#64B5F6";
        ctx.shadowBlur = this.glowIntensity;

        // Draw hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const x = Math.cos(angle) * 15;
            const y = Math.sin(angle) * 15;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        gradient.addColorStop(0, '#E3F2FD');
        gradient.addColorStop(0.5, '#64B5F6');
        gradient.addColorStop(1, '#1E88E5');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI) / 3;
            ctx.beginPath();
            ctx.moveTo(-15 * Math.cos(angle), -15 * Math.sin(angle));
            ctx.lineTo(15 * Math.cos(angle), 15 * Math.sin(angle));
            ctx.stroke();
        }

        ctx.restore();
    }

    createEatEffect(x: number, y: number) {
        // Crystal shatter effect
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            particles.push(new Particle(x, y, '#64B5F6', {
                speed: 2,
                size: 8,
                life: 45,
                shape: 'spark'
            }));
        }
        // Add some sparkles
        for (let i = 0; i < 15; i++) {
            particles.push(new Particle(x, y, '#E3F2FD', {
                speed: 1,
                size: 3,
                life: 30,
                shape: 'circle'
            }));
        }
    }

    get points() { return 3; }
}

// Add new Pulsar food type
class PulsarFood extends Food {
    private innerRotation = 0;
    private outerRotation = 0;

    update() {
        super.update();
        this.innerRotation = (this.innerRotation + 0.03) % (Math.PI * 2);
        this.outerRotation = (this.outerRotation - 0.02) % (Math.PI * 2);
    }

    draw(ctx: CanvasRenderingContext2D) {
        const centerX = this.x * 50 + 25;
        const centerY = this.y * 50 + 25;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(this.scale, this.scale);

        // Outer glow
        ctx.shadowColor = "#9C27B0";
        ctx.shadowBlur = this.glowIntensity;

        // Draw outer ring
        ctx.strokeStyle = "#E1BEE7";
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = this.outerRotation + (i * Math.PI * 2) / 8;
            const x = Math.cos(angle) * 20;
            const y = Math.sin(angle) * 20;
            ctx.beginPath();
            ctx.moveTo(x * 0.7, y * 0.7);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Draw inner core
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
        gradient.addColorStop(0, '#E040FB');
        gradient.addColorStop(0.6, '#9C27B0');
        gradient.addColorStop(1, '#7B1FA2');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw energy beams
        ctx.strokeStyle = 'rgba(225, 190, 231, 0.6)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = this.innerRotation + (i * Math.PI * 2) / 4;
            const x = Math.cos(angle) * 12;
            const y = Math.sin(angle) * 12;
            ctx.beginPath();
            ctx.moveTo(-x, -y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    createEatEffect(x: number, y: number) {
        // Create energy burst effect
        for (let i = 0; i < 16; i++) {
            const angle = (i * Math.PI * 2) / 16;
            particles.push(new Particle(x, y, '#E040FB', {
                speed: 3,
                size: 6,
                life: 35,
                shape: 'spark'
            }));
        }

        // Add some purple sparkles
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(x, y, '#E1BEE7', {
                speed: 1.5,
                size: 3,
                life: 45,
                shape: 'circle'
            }));
        }
    }

    get points() { return 4; }
}

// Update available food types
const foodTypes = [StarFood, RainbowFood, CrystalFood, PulsarFood];
let currentFoodIndex = Math.floor(Math.random() * foodTypes.length);

// Define Snake class
class Snake {
    score = 0;
    rects: SnakePart[] = [
        new SnakePart(randInt(10), randInt(10)),
        new SnakePart(randInt(10), randInt(10))
    ];
    dir: "l" | "u" | "d" | "r" = "l";
    moveTimer = 0;
    moveInterval = 150;

    // Add transition properties
    transitionTime = 0;
    transitionDuration = 1000; // 1 second transition
    lastFoodType: Food | null = null;
    effectRotation = 0;

    getSegmentColor(index: number): { color: string, effect?: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void } {
        if (this.transitionTime <= 0) {
            return { color: index === 0 ? "#4CAF50" : "#2E7D32" };
        }

        const progress = this.transitionTime / this.transitionDuration;
        const reverseProgress = 1 - progress;

        // Calculate position-based delay (wave effect from head to tail)
        const delayedProgress = Math.max(0, Math.min(1, progress * 2 - (index * 0.1)));

        if (this.lastFoodType instanceof StarFood) {
            const baseColor = index === 0 ? '#FF5722' : '#F4511E';
            return {
                color: `rgba(${hexToRgb(baseColor).join(',')},${delayedProgress})`,
                effect: (ctx, x, y, size) => {
                    if (delayedProgress > 0.2) {
                        ctx.fillStyle = '#FFB74D';
                        const angle = this.effectRotation + (index * Math.PI / 8);
                        const orbitX = x + size/2 + Math.cos(angle) * 25 * delayedProgress;
                        const orbitY = y + size/2 + Math.sin(angle) * 25 * delayedProgress;
                        ctx.beginPath();
                        ctx.arc(orbitX, orbitY, 3 * delayedProgress, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            };
        } else if (this.lastFoodType instanceof RainbowFood) {
            const hue = (index * 30 + this.effectRotation * 50) % 360;
            return {
                color: `hsla(${hue}, 100%, 50%, ${delayedProgress})`,
                effect: (ctx, x, y, size) => {
                    if (delayedProgress > 0.2) {
                        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
                        gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, ${delayedProgress * 0.3})`);
                        gradient.addColorStop(1, `hsla(${(hue + 60) % 360}, 100%, 50%, 0)`);
                        ctx.fillStyle = gradient;
                        ctx.fill();
                    }
                }
            };
        } else if (this.lastFoodType instanceof CrystalFood) {
            const baseColor = '#64B5F6';
            return {
                color: `rgba(${hexToRgb(baseColor).join(',')},${delayedProgress})`,
                effect: (ctx, x, y, size) => {
                    if (delayedProgress > 0.2) {
                        ctx.strokeStyle = `rgba(255, 255, 255, ${delayedProgress * 0.5})`;
                        ctx.lineWidth = 1;
                        const angle = this.effectRotation + (index * Math.PI / 6);
                        ctx.beginPath();
                        ctx.moveTo(x + size/2, y + size/2);
                        ctx.lineTo(
                            x + size/2 + Math.cos(angle) * size/2 * delayedProgress,
                            y + size/2 + Math.sin(angle) * size/2 * delayedProgress
                        );
                        ctx.stroke();
                    }
                }
            };
        } else if (this.lastFoodType instanceof PulsarFood) {
            const baseColor = '#9C27B0';
            return {
                color: `rgba(${hexToRgb(baseColor).join(',')},${delayedProgress})`,
                effect: (ctx, x, y, size) => {
                    if (delayedProgress > 0.2) {
                        ctx.strokeStyle = `rgba(225, 190, 231, ${delayedProgress * 0.6})`;
                        ctx.lineWidth = 2;
                        const angles = [0, Math.PI/2, Math.PI, Math.PI*3/2];
                        angles.forEach(baseAngle => {
                            const angle = baseAngle + this.effectRotation + (index * 0.2);
                            const length = 15 * delayedProgress;
                            ctx.beginPath();
                            ctx.moveTo(
                                x + size/2 + Math.cos(angle) * length * 0.3,
                                y + size/2 + Math.sin(angle) * length * 0.3
                            );
                            ctx.lineTo(
                                x + size/2 + Math.cos(angle) * length,
                                y + size/2 + Math.sin(angle) * length
                            );
                            ctx.stroke();
                        });
                    }
                }
            };
        }

        return { color: index === 0 ? "#4CAF50" : "#2E7D32" };
    }

    draw() {
        // Update transition effect
        if (this.transitionTime > 0) {
            this.transitionTime = Math.max(0, this.transitionTime - 16); // Assuming 60fps
            this.effectRotation += 0.1;
        }

        // Draw trail effect with gradient
        const trailGradient = ctx.createLinearGradient(0, 0, 500, 500);
        trailGradient.addColorStop(0, 'rgba(76, 175, 80, 0.1)');
        trailGradient.addColorStop(1, 'rgba(76, 175, 80, 0.05)');

        // Draw trails
        this.rects.forEach((r, i) => {
            const alpha = 0.15 - (i * 0.01);
            if (alpha > 0) {
                ctx.fillStyle = trailGradient;
                ctx.beginPath();
                ctx.roundRect(
                    r.lerpX * 50 + 4,
                    r.lerpY * 50 + 4,
                    42,
                    42,
                    22
                );
                ctx.fill();
            }
        });

        // Draw snake segments
        this.rects.forEach((r, i) => {
            const nextPart = this.rects[i + 1];
            const { color, effect } = this.getSegmentColor(i);

            // Draw base segment
            r.draw(color, i === 0, nextPart);

            // Apply special effect if any
            if (effect) {
                const x = r.lerpX * 50;
                const y = r.lerpY * 50;
                effect(ctx, x, y, 50);
            }
        });

        // Draw head details last (eyes, etc.)
        if (this.rects.length > 0) {
            this.drawHeadDetails();
        }
    }

    /**
     * Handles keyboard input for snake direction
     * Prevents 180-degree turns
     */
    processInput() {
        if ((keys["a"] || keys["ArrowLeft"]) && this.dir != "r") {
            this.dir = "l";
        }
        if ((keys["d"] || keys["ArrowRight"]) && this.dir != "l") {
            this.dir = "r";
        }
        if ((keys["w"] || keys["ArrowUp"]) && this.dir != "d") {
            this.dir = "u";
        }
        if ((keys["s"] || keys["ArrowDown"]) && this.dir != "u") {
            this.dir = "d";
        }
        keys = {};
    }

    /**
     * Updates snake position and handles collisions
     */
    move() {
        const head = this.rects[0];
        let newX = head.targetX;
        let newY = head.targetY;

        // Update position with wrap-around
        if (this.dir == "l") newX = (newX - 1 + 10) % 10;
        if (this.dir == "r") newX = (newX + 1) % 10;
        if (this.dir == "u") newY = (newY - 1 + 10) % 10;
        if (this.dir == "d") newY = (newY + 1) % 10;

        // Check for collision with snake body
        if (this.rects.some(r => r.targetX === newX && r.targetY === newY)) {
            alert("scarso");
            location.reload();
            this.rects.splice(1);
            return;
        }

        // Store current positions before moving
        const positions: {x: number, y: number}[] = this.rects.map(r => ({
            x: r.targetX,
            y: r.targetY
        }));

        // Update all segments to their new positions
        this.rects.forEach((part, i) => {
            if (i === 0) {
                part.setTarget(newX, newY);
            } else {
                part.setTarget(positions[i - 1].x, positions[i - 1].y);
            }
        });

        // Handle food collision and snake growth
        if (newX === currentFood.x && newY === currentFood.y) {
            const foodX = currentFood.x * 50 + 25;
            const foodY = currentFood.y * 50 + 25;

            // Store the food type for transition effect
            this.lastFoodType = currentFood;
            this.transitionTime = this.transitionDuration;
            this.effectRotation = 0;

            // Create food-specific eat effect
            currentFood.createEatEffect(foodX, foodY);

            // Add flash effect
            glowIntensity = 40;

            // Add new tail segment
            const lastPos = positions[positions.length - 1];
            const newTail = new SnakePart(lastPos.x, lastPos.y);
            newTail.setTarget(lastPos.x, lastPos.y);
            this.rects.push(newTail);

            // Update score based on food type
            this.score += currentFood.points;

            // Spawn new food
            spawnNewFood();
        }
    }

    /**
     * Main update function called every frame
     * Handles movement timing and position interpolation
     */
    update(deltaTime: number) {
        // Update movement timer and move snake when interval is reached
        this.moveTimer += deltaTime;
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.move();
        }

        // Update smooth movement interpolation for all segments
        this.rects.forEach(part => {
            part.updateLerp(deltaTime);
        });
    }

    drawHeadDetails() {
        // Only draw the head details (eyes, etc.)
        const head = this.rects[0];
        const x = head.lerpX * 50;
        const y = head.lerpY * 50;
        const size = 50;
        const padding = 4;
        const radius = 24;

        // Add eyes with enhanced glow
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#fff";
        const eyeSize = 9;
        const eyeOffset = 15;
        const eyeY = y + eyeOffset;

        // Left eye
        ctx.beginPath();
        ctx.arc(x + eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Right eye
        ctx.beginPath();
        ctx.arc(x + size - eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Add pupils that follow movement direction with gradient
        ctx.shadowBlur = 0;
        const pupilGradient = ctx.createRadialGradient(
            x + eyeOffset, eyeY, 0,
            x + eyeOffset, eyeY, eyeSize/1.5
        );
        pupilGradient.addColorStop(0, '#444');
        pupilGradient.addColorStop(1, '#000');
        ctx.fillStyle = pupilGradient;

        let pupilX = 0;
        let pupilY = 0;

        // Adjust pupil position based on movement direction
        if (this.dir === 'l') pupilX = -3;
        if (this.dir === 'r') pupilX = 3;
        if (this.dir === 'u') pupilY = -3;
        if (this.dir === 'd') pupilY = 3;

        ctx.beginPath();
        ctx.arc(x + eyeOffset + pupilX, eyeY + pupilY, eyeSize/1.8, 0, Math.PI * 2);
        ctx.arc(x + size - eyeOffset + pupilX, eyeY + pupilY, eyeSize/1.8, 0, Math.PI * 2);
        ctx.fill();

        // Add eye shine
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        const shineSize = 3;
        ctx.beginPath();
        ctx.arc(x + eyeOffset - 2, eyeY - 2, shineSize, 0, Math.PI * 2);
        ctx.arc(x + size - eyeOffset - 2, eyeY - 2, shineSize, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;
    }
}

// Create the snake
const snake = new Snake();

// Modify spawn function to cycle through food types
function spawnNewFood() {
    let x: number, y: number;
    do {
        x = randInt(10);
        y = randInt(10);
    } while (snake.rects.some((r) => r.targetX == x && r.targetY == y));

    // Cycle to next food type
    currentFoodIndex = (currentFoodIndex + 1) % foodTypes.length;
    const FoodType = foodTypes[currentFoodIndex];
    currentFood = new FoodType(x, y);
}

// Initialize first food
spawnNewFood();

/**
 * Draws the game grid
 */
function drawGrid() {
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 50, 0);
        ctx.lineTo(i * 50, 500);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * 50);
        ctx.lineTo(500, i * 50);
        ctx.stroke();
    }
}

/**
 * Draws the food with enhanced animations and effects
 */
function drawFood() {
    // Update current food's animation state
    currentFood.update();
    // Draw current food using its specific drawing method
    currentFood.draw(ctx);
}

// Track time for smooth animation
let lastTime = performance.now();

/**
 * Main game loop
 * Updates and renders the game state each frame
 */
function gameLoop(currentTime: number) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Clear and draw background
    drawRect(ctx, map, "#1A1A1A");
    drawGrid();

    // Update and draw particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    // Fade out glow intensity
    glowIntensity = Math.max(0, glowIntensity - deltaTime * 0.1);

    // Draw score with enhanced shadow effect
    ctx.fillStyle = "#FFF";
    ctx.font = "bold 40px 'Arial'";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(`Score: ${snake.score}`, 10, 490);
    ctx.shadowBlur = 0;

    // Update and draw game objects
    drawFood();
    snake.processInput();
    snake.update(deltaTime);
    snake.draw();

    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);

// Set up keyboard input handling
window.addEventListener("keydown", function (e) {
    keys = {};
    keys[e.key] = true;
});

// Helper function to convert hex to rgb
function hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}
