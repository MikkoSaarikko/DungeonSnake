class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 30 + 20; // Random size between 20 and 50
        this.points = this.generateRockPoints();
        this.color = this.generateRockColor();
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
        const grayValue = Math.floor(Math.random() * 60 + 100); // 100-160
        return `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
    }

    update(dungeon, deltaTime) {
        this.x -= dungeon.speed * deltaTime * BASE_SPEED;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw main rock shape
        ctx.fillStyle = this.color;
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
        const gradient = ctx.createRadialGradient(
            -this.size / 4, -this.size / 4, 0,
            -this.size / 4, -this.size / 4, this.size / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
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
        this.minSpawnInterval = 60; // Minimum frames between spawns
        this.maxSpawnInterval = 120; // Maximum frames between spawns
        this.nextSpawnInterval = this.getRandomSpawnInterval();
    }

    getRandomSpawnInterval() {
        return Math.random() * (this.maxSpawnInterval - this.minSpawnInterval) + this.minSpawnInterval;
    }

    update(deltaTime) {
        // Move existing obstacles
        for (let obstacle of this.obstacles) {
            obstacle.update(this.dungeon, deltaTime);
        }

        // Remove off-screen obstacles
        this.obstacles = this.obstacles.filter(obstacle => 
            obstacle.x + obstacle.size / 2 > 0
        );

        // Spawn new obstacles
        this.spawnTimer += deltaTime * BASE_SPEED;
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
        const x = GAME_WIDTH + 50; // Spawn obstacles slightly off-screen to the right
        
        // Find the rightmost segment of the dungeon
        const rightmostSegment = this.dungeon.segments[this.dungeon.segments.length - 1];
        
        // Get the floor and ceiling Y coordinates at the spawn point
        const floorY = rightmostSegment.floorPoints[rightmostSegment.floorPoints.length - 1].y;
        const ceilingY = rightmostSegment.ceilingPoints[rightmostSegment.ceilingPoints.length - 1].y;
        
        // Calculate the safe area for spawning
        const safeAreaTop = ceilingY + 50; // Increased padding from the ceiling
        const safeAreaBottom = floorY - 50; // Increased padding from the floor
        
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