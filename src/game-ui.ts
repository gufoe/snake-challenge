export class GameUI {
    drawScore(ctx: CanvasRenderingContext2D, score: number, lastFoodColor: string) {
        const x = 960;
        const y = 40;
        const hexRadius = 25;

        // Draw hexagonal background
        ctx.save();
        ctx.translate(x, y);

        // Rotate slowly
        const rotationSpeed = 0.0005;
        const rotation = Date.now() * rotationSpeed;
        ctx.rotate(rotation);

        // Draw outer hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const px = hexRadius * Math.cos(angle);
            const py = hexRadius * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw inner hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const px = (hexRadius - 5) * Math.cos(angle);
            const py = (hexRadius - 5) * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.stroke();
        ctx.restore();

        // Draw score text
        ctx.save();
        ctx.translate(x, y);

        // Add glow effect
        ctx.shadowColor = lastFoodColor || '#4CAF50';
        ctx.shadowBlur = 10;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(score.toString(), 0, 0);

        ctx.restore();
    }

    drawGameOver(ctx: CanvasRenderingContext2D, score: number, progress: number) {
        // Dark overlay with radial gradient
        const gradient = ctx.createRadialGradient(300, 525, 0, 300, 525, 600);
        gradient.addColorStop(0, `rgba(0, 0, 0, ${0.5 * progress})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${0.9 * progress})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 600, 1050);

        // Set up text properties
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw "GAME OVER" text with enhanced effects
        ctx.save();
        ctx.translate(300, 450);
        const scale = 1 + Math.sin(Date.now() / 200) * 0.15;
        ctx.scale(scale, scale);

        // Multiple shadow layers for stronger glow
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 30 * progress;
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 70px Arial';
        ctx.fillText('GAME OVER', 0, 0);

        // Add second layer of text
        ctx.shadowBlur = 15 * progress;
        ctx.fillStyle = '#ff6666';
        ctx.fillText('GAME OVER', 0, 0);
        ctx.restore();

        // Draw score with growing effect
        ctx.save();
        ctx.translate(300, 550);
        const scoreScale = Math.min(1, progress * 1.5);
        ctx.scale(scoreScale, scoreScale);

        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15 * progress;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 35px Arial';
        ctx.fillText(`Score: ${score}`, 0, 0);
        ctx.restore();

        // Draw restart instructions with floating effect
        ctx.save();
        ctx.translate(300, 650 + Math.sin(Date.now() / 400) * 5);
        const pulseScale = 1 + Math.sin(Date.now() / 500) * 0.1;
        ctx.scale(pulseScale, pulseScale);

        // Draw desktop instruction
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * progress})`;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE or', 0, -20);

        // Draw mobile instruction
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * progress})`;
        ctx.fillText('Tap anywhere', 0, 20);

        ctx.restore();

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    private drawKey(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, text: string) {
        const radius = 5;

        // Draw key background
        ctx.beginPath();
        ctx.moveTo(x - width/2 + radius, y - height/2);
        ctx.lineTo(x + width/2 - radius, y - height/2);
        ctx.quadraticCurveTo(x + width/2, y - height/2, x + width/2, y - height/2 + radius);
        ctx.lineTo(x + width/2, y + height/2 - radius);
        ctx.quadraticCurveTo(x + width/2, y + height/2, x + width/2 - radius, y + height/2);
        ctx.lineTo(x - width/2 + radius, y + height/2);
        ctx.quadraticCurveTo(x - width/2, y + height/2, x - width/2, y + height/2 - radius);
        ctx.lineTo(x - width/2, y - height/2 + radius);
        ctx.quadraticCurveTo(x - width/2, y - height/2, x - width/2 + radius, y - height/2);
        ctx.stroke();

        // Draw key text with proper centering
        ctx.textAlign = 'center';
        ctx.font = '16px Arial';
        ctx.fillText(text, x, y + 2);
    }
}
