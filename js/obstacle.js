class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 30 + 20; // Random size between 20 and 50
        this.points = this.generateRockPoints();
        this.baseColor = this.generateRockColor();
        this.colorVariations = this.generateColorVariations();
    }

    generateRockPoints() {
        const points = [];
        const numPoints = Math.floor(Math.random() * 5) + 6; // 6 to 10 points
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = this.size / 2;
            const variation = radius * 0.3; // 30% variation
            const r = radius + Math.random() * variation - variation / 2;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            points.push({ x, y });
        }
        return points;
    }

    generateRockColor() {
        const r = Math.floor(Math.random() * 60 + 100); // 100-160
        const g = Math.floor(Math.random() * 60 + 100); // 100-160
        const b = Math.floor(Math.random() * 60 + 100); // 100-160
        return { r, g, b };
    }

    generateColorVariations() {
        const variations = [];
        const numVariations = 3;
        for (let i = 0; i < numVariations; i++) {
            variations.push({
                offset: Math.random(),
                color: {
                    r: this.baseColor.r + Math.random() * 30 - 15,
                    g: this.baseColor.g + Math.random() * 30 - 15,
                    b: this.baseColor.b + Math.random() * 30 - 15
                }
            });
        }
        return variations;
    }

    update(speed, deltaTime) {
        this.x -= speed * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Create gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size / 2);
        gradient.addColorStop(0, `rgb(${this.baseColor.r}, ${this.baseColor.g}, ${this.baseColor.b})`);
        for (let variation of this.colorVariations) {
            gradient.addColorStop(
                variation.offset, 
                `rgb(${variation.color.r}, ${variation.color.g}, ${variation.color.b})`
            );
        }

        // Draw main rock shape
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        ctx.fill();

        // Add subtle outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add highlight
        const highlightGradient = ctx.createRadialGradient(
            -this.size / 4, -this.size / 4, 0,
            -this.size / 4, -this.size / 4, this.size / 2
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.fill();

        ctx.restore();
    }
}