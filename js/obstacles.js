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
        // Generate a base gray color
        const grayValue = Math.floor(Math.random() * 60 + 100); // 100-160
        // Add a slight brown tint
        const brownTint = Math.floor(Math.random() * 20); // 0-20
        return {
            r: grayValue + brownTint,
            g: grayValue + Math.floor(brownTint / 2),
            b: grayValue
        };
    }

    generateColorVariations() {
        const variations = [];
        const numVariations = 3;
        for (let i = 0; i < numVariations; i++) {
            const variationAmount = Math.random() * 30 - 15; // -15 to 15
            variations.push({
                offset: Math.random(),
                color: {
                    r: this.baseColor.r + variationAmount + Math.random() * 10,
                    g: this.baseColor.g + variationAmount,
                    b: this.baseColor.b + variationAmount - Math.random() * 10
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
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.fill();

        ctx.restore();
    }

    checkCollision(snake) {
        const dx = snake.x - this.x;
        const dy = snake.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.size / 2 + snake.radius) {
            return false; // Too far away to collide
        }

        // Check if any point of the rock is inside the snake
        for (let point of this.points) {
            const pointX = point.x + this.x;
            const pointY = point.y + this.y;
            const distanceToPoint = Math.sqrt((snake.x - pointX) ** 2 + (snake.y - pointY) ** 2);
            if (distanceToPoint <= snake.radius) {
                return true; // Collision detected
            }
        }

        return false;
    }
}

class Obstacles {
    constructor(dungeon) {
        this.dungeon = dungeon;
        this.obstacles = [];
        this.spawnTimer = 0;
        this.nextSpawnInterval = this.getRandomSpawnInterval();
    }

    getRandomSpawnInterval() {
        return Math.random() * 100 + 50; // Random interval between 50 and 150 frames
    }

    update(speed, deltaTime) {
        // Move existing obstacles
        for (let obstacle of this.obstacles) {
            obstacle.update(speed, deltaTime);
        }

        // Remove off-screen obstacles
        this.obstacles = this.obstacles.filter(obstacle => 
            obstacle.x + obstacle.size > 0
        );

        // Spawn new obstacles
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.nextSpawnInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;
            this.nextSpawnInterval = this.getRandomSpawnInterval();
        }
    }

    draw(ctx) {
        for (let obstacle of this.obstacles) {
            obstacle.draw(ctx);
        }
    }

    spawnObstacle() {
        const x = GAME_WIDTH;
        
        // Find the rightmost segment of the dungeon
        const rightmostSegment = this.dungeon.segments[this.dungeon.segments.length - 1];
        
        // Get the floor and ceiling Y coordinates at the spawn point
        const floorY = rightmostSegment.floorPoints[rightmostSegment.floorPoints.length - 1].y;
        const ceilingY = rightmostSegment.ceilingPoints[rightmostSegment.ceilingPoints.length - 1].y;
        
        // Calculate the safe area for spawning
        const safeAreaTop = ceilingY + 30; // Add some padding from the ceiling
        const safeAreaBottom = floorY - 30; // Add some padding from the floor
        
        // Generate a random Y position within the safe area
        const y = Math.random() * (safeAreaBottom - safeAreaTop) + safeAreaTop;

        const obstacle = new Obstacle(x, y);
        
        // Ensure the obstacle fits within the safe area
        if (y - obstacle.size / 2 < safeAreaTop) {
            obstacle.y = safeAreaTop + obstacle.size / 2;
        } else if (y + obstacle.size / 2 > safeAreaBottom) {
            obstacle.y = safeAreaBottom - obstacle.size / 2;
        }

        this.obstacles.push(obstacle);
    }

    checkCollision(snake) {
        for (let obstacle of this.obstacles) {
            if (obstacle.checkCollision(snake)) {
                return true;
            }
        }
        return false;
    }
}