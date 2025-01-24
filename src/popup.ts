export const POPUP_MESSAGES = [
    "Well done! 🎯",
    "Tasty! 😋",
    "Awesome! ⭐",
    "Yummy! 🍎",
    "Great catch! 🎮",
    "Delicious! 🍕",
    "Perfect! 💯",
    "Amazing! 🌟",
    "Fantastic! 🎨",
    "Superb! 🚀",
    "Epic! 🎪",
    "Excellent! 🏆",
];

export class PopupText {
    life: number = 1;
    y: number;
    scale: number = 0;
    rotation: number = (Math.random() - 0.5) * 0.2;

    constructor(public text: string, public x: number, public y0: number) {
        this.y = y0;
    }

    update() {
        this.life = Math.max(0, this.life - 0.02);
        this.y = this.y0 - (1 - this.life) * 100;
        this.scale = Math.min(1, this.scale + 0.2);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        // Set text properties
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw text with glow effect
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.life})`;
        ctx.fillText(this.text, 0, 0);

        ctx.restore();
    }
}
