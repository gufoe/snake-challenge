import { Rect, drawRect, randInt } from "./lib";
import "./style.css";

// Set up the canvas element in the HTML
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <canvas id="canvas" width=500 height=500/>
`;

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

// Initialize game objects
let food: SnakePart = new SnakePart(randInt(10), randInt(10));
let foodPulse = 0; // Used for food animation
let keys: any = {}; // Tracks currently pressed keys

// Add particle system for effects
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

// Add to existing game state
let particles: Particle[] = [];
let glowIntensity = 0;
let foodRotation = 0;
let foodScale = 1;
let foodGlowIntensity = 20;

/**
 * Main snake class that handles game logic and snake movement
 */
class Snake {
    score = 0;
    // Initialize with two segments - head and one body part
    rects: SnakePart[] = [
        new SnakePart(randInt(10), randInt(10)),
        new SnakePart(randInt(10), randInt(10))
    ];
    dir: "l" | "u" | "d" | "r" = "l"; // Current direction
    moveTimer = 0;
    moveInterval = 150; // Time between moves in milliseconds

    constructor() {
        // Make sure the second segment starts at a valid position behind the head
        const head = this.rects[0];
        const tail = this.rects[1];
        tail.x = (head.x + 1) % 10; // Place tail to the right of head
        tail.y = head.y;
        tail.lerpX = tail.x;
        tail.lerpY = tail.y;
        tail.targetX = tail.x;
        tail.targetY = tail.y;
    }

    /**
     * Draws all snake segments with their connections
     */
    draw() {
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

        // Draw snake segments in order, but draw the head's body first
        if (this.rects.length > 1) {
            // Draw head's body (without eyes) first
            this.rects[0].draw("#4CAF50", false, this.rects[1]);
        }

        // Draw body segments
        for (let i = 1; i < this.rects.length; i++) {
            const nextPart = this.rects[i + 1];
            this.rects[i].draw("#2E7D32", false, nextPart);
        }

        // Draw head's eyes and details last
        if (this.rects.length > 0) {
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
        if (newX === food.x && newY === food.y) {
            const foodX = food.x * 50 + 25;
            const foodY = food.y * 50 + 25;

            // Create expanding ring effect
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                const p = new Particle(
                    foodX + Math.cos(angle) * 20,
                    foodY + Math.sin(angle) * 20,
                    'rgb(255, 255, 255)',
                    { speed: 0.5, life: 30, shape: 'spark' }
                );
                p.vx = Math.cos(angle) * 3;
                p.vy = Math.sin(angle) * 3;
                particles.push(p);
            }

            // Add star particles
            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(foodX, foodY, 'rgb(255, 193, 7)', {
                    speed: 1.5,
                    size: 8,
                    life: 60,
                    shape: 'star'
                }));
            }

            // Add regular particles with different colors
            const colors = [
                'rgb(255, 87, 34)',  // Orange
                'rgb(255, 193, 7)',  // Gold
                'rgb(255, 235, 59)', // Yellow
                'rgb(76, 175, 80)'   // Green
            ];

            for (let i = 0; i < 30; i++) {
                particles.push(new Particle(foodX, foodY, colors[i % colors.length], {
                    speed: 2,
                    size: 5 + Math.random() * 3
                }));
            }

            // Add some trailing sparks
            for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                    if (particles) { // Check if particles array still exists
                        particles.push(new Particle(foodX, foodY, 'rgb(255, 255, 255)', {
                            speed: 3,
                            size: 3,
                            life: 20,
                            shape: 'spark'
                        }));
                    }
                }, i * 50);
            }

            // Add flash effect
            glowIntensity = 40;

            // Add new tail segment
            const lastPos = positions[positions.length - 1];
            const newTail = new SnakePart(lastPos.x, lastPos.y);
            newTail.setTarget(lastPos.x, lastPos.y);
            this.rects.push(newTail);

            // Move food to new random position
            do {
                food = new SnakePart(randInt(10), randInt(10));
            } while (this.rects.some((r) => r.targetX == food.x && r.targetY == food.y));
            this.score++;
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
}

// Initialize canvas and game objects
const canvas: HTMLCanvasElement = document.querySelector("#canvas")!;
const ctx = canvas.getContext("2d")!;
const map: Rect = {
    x: 0,
    y: 0,
    s: 500,
};
const snake = new Snake();

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
    const centerX = food.x * 50 + 25;
    const centerY = food.y * 50 + 25;

    // Update animations
    foodPulse = (foodPulse + 0.1) % (Math.PI * 2);
    foodRotation = (foodRotation + 0.02);
    foodScale = 1 + Math.sin(foodPulse) * 0.1;
    foodGlowIntensity = 20 + Math.sin(foodPulse) * 10;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(foodRotation);
    ctx.scale(foodScale, foodScale);

    // Draw outer glow (matching snake's glow style)
    ctx.shadowColor = "#FF5722";
    ctx.shadowBlur = foodGlowIntensity;

    // Draw main shape (star)
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const nextAngle = ((i + 1) * Math.PI * 2) / 5 - Math.PI / 2;

        // Outer point
        const outerX = Math.cos(angle) * 18;
        const outerY = Math.sin(angle) * 18;

        // Inner point
        const innerX = Math.cos((angle + nextAngle) / 2) * 8;
        const innerY = Math.sin((angle + nextAngle) / 2) * 8;

        if (i === 0) {
            ctx.moveTo(outerX, outerY);
        } else {
            ctx.lineTo(outerX, outerY);
        }

        ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();

    // Use flat colors with subtle gradient like the snake
    const baseColor = "#FF5722";
    const gradient = ctx.createRadialGradient(
        -8, -8, 0,
        0, 0, 20
    );
    gradient.addColorStop(0, shadeColor(baseColor, 30));
    gradient.addColorStop(0.6, baseColor);
    gradient.addColorStop(1, shadeColor(baseColor, -20));

    ctx.fillStyle = gradient;
    ctx.fill();

    // Add simple shine effect (matching snake's style)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();

    // Add simple orbital dots (matching snake's minimal style)
    ctx.fillStyle = shadeColor(baseColor, 30);
    const orbitRadius = 25;
    const dotCount = 4;
    for (let i = 0; i < dotCount; i++) {
        const angle = foodRotation * 2 + (i * Math.PI * 2) / dotCount;
        const x = Math.cos(angle) * orbitRadius;
        const y = Math.sin(angle) * orbitRadius;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
    ctx.shadowBlur = 0;
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
