class Dungeon {
    constructor() {
        this.segments = [];
        this.segmentWidth = 100; // Increased for better visibility
        this.minHeight = 200;  // Minimum cave height
        this.speed = 2;
        this.difficulty = 1;
        this.curvePoints = 5;  // Number of points to create for each curve
        this.totalDistance = 0;
        this.initialDistance = 0;        
        // Initialize the first set of segments
        for (let x = 0; x < GAME_WIDTH + this.segmentWidth; x += this.segmentWidth) {
            this.addSegment(x);
        }
    }

    addSegment(x) {
        let lastSegment = this.segments[this.segments.length - 1];
        let floorY, ceilingY;

        if (lastSegment) {
            // Generate new segment based on the last one
            floorY = this.clamp(
                lastSegment.floorPoints[lastSegment.floorPoints.length - 1].y + (Math.random() - 0.5) * 40,
                GAME_HEIGHT - 100,
                GAME_HEIGHT - 20
            );
            ceilingY = this.clamp(
                lastSegment.ceilingPoints[lastSegment.ceilingPoints.length - 1].y + (Math.random() - 0.5) * 40,
                20,
                floorY - this.minHeight
            );
        } else {
            // Initial segment
            floorY = GAME_HEIGHT - 50;
            ceilingY = 50;
        }

        // Create curve points
        let floorPoints = [];
        let ceilingPoints = [];
        for (let i = 0; i < this.curvePoints; i++) {
            let pointX = x + (i * this.segmentWidth) / (this.curvePoints - 1);
            floorPoints.push({
                x: pointX,
                y: floorY + (Math.random() - 0.5) * 20
            });
            ceilingPoints.push({
                x: pointX,
                y: ceilingY + (Math.random() - 0.5) * 20
            });
        }

        this.segments.push({ x, floorPoints, ceilingPoints });
    }

    update(deltaTime = 1) {
        // Move segments
        for (let segment of this.segments) {
            segment.x -= this.speed * deltaTime;
            segment.floorPoints.forEach(point => point.x -= this.speed * deltaTime);
            segment.ceilingPoints.forEach(point => point.x -= this.speed * deltaTime);
        }

        // Remove off-screen segments
        while (this.segments.length > 0 && this.segments[0].x + this.segmentWidth < 0) {
            this.segments.shift();
        }

        // Add new segments
        while (this.segments[this.segments.length - 1].x < GAME_WIDTH) {
            this.addSegment(this.segments[this.segments.length - 1].x + this.segmentWidth);
        }

        // Increase difficulty over time
        this.difficulty += 0.001 * deltaTime;
        this.speed = 2 + this.difficulty * 0.5;

        this.totalDistance += this.speed * deltaTime * BASE_SPEED;
 
    }

    draw(ctx) {
        // Create gradient for cave walls
        let gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#4a4a4a');
        gradient.addColorStop(0.5, '#696969');
        gradient.addColorStop(1, '#4a4a4a');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        // Draw ceiling
        ctx.moveTo(0, 0);
        for (let segment of this.segments) {
            this.drawCurve(ctx, segment.ceilingPoints);
        }
        ctx.lineTo(GAME_WIDTH, 0);
        
        // Draw floor (in reverse to create a complete shape)
        for (let i = this.segments.length - 1; i >= 0; i--) {
            this.drawCurve(ctx, this.segments[i].floorPoints.slice().reverse());
        }
        ctx.lineTo(0, GAME_HEIGHT);
        
        ctx.closePath();
        ctx.fill();
    }

    drawCurve(ctx, points) {
        ctx.lineTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 2; i++) {
            let xc = (points[i].x + points[i + 1].x) / 2;
            let yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        // Curve through the last two points
        if (points.length > 2) {
            ctx.quadraticCurveTo(
                points[points.length - 2].x, 
                points[points.length - 2].y, 
                points[points.length - 1].x, 
                points[points.length - 1].y
            );
        }
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    getCollisionPoints() {
        let points = [];
        for (let segment of this.segments) {
            points = points.concat(segment.floorPoints, segment.ceilingPoints);
        }
        return points;
    }
}