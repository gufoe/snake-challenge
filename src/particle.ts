export class Particle {
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
    shape: 'circle' | 'star' | 'spark' | 'beam' | 'crystal' | 'triangle' | 'square' | 'pentagon' = 'circle';
    angle?: number;
    spin?: boolean;
    trail?: boolean;
    rainbow?: boolean;
    shimmer?: boolean;
    pulse?: boolean;
    quantum?: boolean;
    trailPositions: {x: number, y: number}[] = [];

    constructor(x: number, y: number, color: string, options: {
        speed?: number,
        size?: number,
        life?: number,
        shape?: 'circle' | 'star' | 'spark' | 'beam' | 'crystal' | 'triangle' | 'square' | 'pentagon',
        angle?: number,
        spin?: boolean,
        trail?: boolean,
        rainbow?: boolean,
        shimmer?: boolean,
        pulse?: boolean,
        quantum?: boolean
    } = {}) {
        this.x = x;
        this.y = y;
        const speed = (options.speed || 1) * (Math.random() * 5 + 2);
        const angle = options.angle !== undefined ? options.angle : Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = options.size || 4;
        this.maxLife = options.life || (50 + Math.random() * 30);
        this.life = this.maxLife;
        this.color = color;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.shape = options.shape || 'circle';
        this.angle = options.angle;
        this.spin = options.spin;
        this.trail = options.trail;
        this.rainbow = options.rainbow;
        this.shimmer = options.shimmer;
        this.pulse = options.pulse;
        this.quantum = options.quantum;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity

        if (this.spin) {
            this.rotation += this.rotationSpeed * 2;
        }

        if (this.trail) {
            this.trailPositions.unshift({ x: this.x, y: this.y });
            if (this.trailPositions.length > 10) {
                this.trailPositions.pop();
            }
        }

        if (this.quantum && Math.random() < 0.1) {
            // Random teleportation
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20;
            this.x += Math.cos(angle) * distance;
            this.y += Math.sin(angle) * distance;
        }

        if (this.pulse) {
            this.size = this.size * (1 + Math.sin(this.life * 0.2) * 0.2);
        }

        this.life--;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const alpha = this.life / this.maxLife;
        const currentSize = Math.max(0.1, this.size * (this.pulse ? (1 + Math.sin(this.life * 0.2) * 0.3) : alpha));

        // Handle rainbow color
        if (this.rainbow) {
            const hue = (Date.now() / 20 + this.x + this.y) % 360;
            this.color = `hsl(${hue}, 100%, 60%)`;
        }

        // Handle shimmer effect
        const shimmerAlpha = this.shimmer ?
            alpha * (0.5 + Math.sin(Date.now() * 0.01 + this.x + this.y) * 0.5) :
            alpha;

        ctx.fillStyle = this.color.replace(')', `,${shimmerAlpha})`).replace('rgb', 'rgba');
        ctx.strokeStyle = ctx.fillStyle;

        // Draw trail if enabled
        if (this.trail && this.trailPositions.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trailPositions[0].x, this.trailPositions[0].y);
            for (let i = 1; i < this.trailPositions.length; i++) {
                ctx.lineTo(this.trailPositions[i].x, this.trailPositions[i].y);
            }
            ctx.strokeStyle = this.color.replace(')', `,${shimmerAlpha * 0.5})`).replace('rgb', 'rgba');
            ctx.lineWidth = currentSize * 0.5;
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.spin || this.shape !== 'circle') {
            ctx.rotate(this.rotation);
        }

        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'star':
                this.drawStar(ctx, currentSize);
                break;

            case 'spark':
                this.drawSpark(ctx, currentSize);
                break;

            case 'beam':
                this.drawBeam(ctx, currentSize);
                break;

            case 'crystal':
                this.drawCrystal(ctx, currentSize);
                break;

            case 'triangle':
            case 'square':
            case 'pentagon':
                this.drawPolygon(ctx, currentSize, this.shape === 'triangle' ? 3 : this.shape === 'square' ? 4 : 5);
                break;
        }

        ctx.restore();
    }

    private drawStar(ctx: CanvasRenderingContext2D, size: number) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const nextAngle = ((i + 1) * Math.PI * 2) / 5 - Math.PI / 2;
            const r1 = size;
            const r2 = size * 0.5;

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
    }

    private drawSpark(ctx: CanvasRenderingContext2D, size: number) {
        ctx.lineWidth = Math.max(0.5, 2 * (this.life / this.maxLife));
        ctx.beginPath();
        ctx.moveTo(-size, 0);
        ctx.lineTo(size, 0);
        ctx.moveTo(0, -size);
        ctx.lineTo(0, size);
        ctx.stroke();
    }

    private drawBeam(ctx: CanvasRenderingContext2D, size: number) {
        const gradient = ctx.createLinearGradient(-size, 0, size, 0);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(-size, -size/4);
        ctx.lineTo(size, -size/4);
        ctx.lineTo(size, size/4);
        ctx.lineTo(-size, size/4);
        ctx.closePath();
        ctx.fill();
    }

    private drawCrystal(ctx: CanvasRenderingContext2D, size: number) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    private drawPolygon(ctx: CanvasRenderingContext2D, size: number, sides: number) {
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i * Math.PI * 2) / sides - Math.PI / 2;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }
}
