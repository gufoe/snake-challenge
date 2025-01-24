export class ScreenShake {
    private intensity: number = 0;
    private duration: number = 0;
    private decay: number = 0.9; // How quickly the shake effect fades
    offsetX: number = 0;
    offsetY: number = 0;

    update() {
        if (this.duration > 0) {
            this.duration--;
            this.intensity *= this.decay;

            // Random shake offset
            this.offsetX = (Math.random() - 0.5) * this.intensity;
            this.offsetY = (Math.random() - 0.5) * this.intensity;
        } else {
            this.intensity = 0;
            this.offsetX = 0;
            this.offsetY = 0;
        }
    }

    start(intensity: number, duration: number) {
        this.intensity = intensity;
        this.duration = duration;
    }
}
