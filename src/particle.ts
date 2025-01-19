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
