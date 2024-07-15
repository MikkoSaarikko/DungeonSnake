class Collectible {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.type = type;
    this.value = type === "coin" ? 1000 : 0;
  }

  draw(ctx) {
    if (this.type === "coin") {
      // Draw the coin
      ctx.fillStyle = "gold";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw the plus sign
      ctx.strokeStyle = "gray";
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Horizontal line
      ctx.moveTo(this.x - this.radius / 3, this.y);
      ctx.lineTo(this.x + this.radius / 3, this.y);
      // Vertical line
      ctx.moveTo(this.x, this.y - this.radius / 3);
      ctx.lineTo(this.x, this.y + this.radius / 3);
      ctx.stroke();
    } else if (this.type === "timeSlow") {
      ctx.fillStyle = "lightblue";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw clock hands
      ctx.strokeStyle = "navy";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.radius * 0.6, this.y);
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x, this.y - this.radius * 0.6);
      ctx.stroke();
    } else if (this.type === "reverseGravity") {
      const arrowHeight = this.radius * 2.2;  // Overall height
      const arrowWidth = this.radius * 1.0;   // Increased width for wider arrowhead
      const arrowHeadSize = this.radius * 1.5; // Shorter arrowhead
      const arrowSpacing = this.radius * 1.2;  // Space between arrows
  
      // Draw upward arrow (green)
      this.drawArrow(ctx, this.x - arrowSpacing / 2, this.y, arrowWidth, arrowHeight, "green", true, arrowHeadSize);
  
      // Draw downward arrow (red)
      this.drawArrow(ctx, this.x + arrowSpacing / 2, this.y, arrowWidth, arrowHeight, "red", false, arrowHeadSize);
  
    }
  }

  drawArrow(ctx, x, y, width, height, color, pointingUp, headSize) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
  
    // Calculate arrow points
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const lineEndY = pointingUp ? y + halfHeight - headSize : y - halfHeight + headSize;
  
    // Draw the line
    ctx.beginPath();
    ctx.moveTo(x, pointingUp ? y + halfHeight : y - halfHeight);
    ctx.lineTo(x, lineEndY);
    ctx.stroke();
  
    // Draw the arrowhead
    ctx.beginPath();
    if (pointingUp) {
      ctx.moveTo(x - halfWidth, lineEndY);
      ctx.lineTo(x, y - halfHeight);
      ctx.lineTo(x + halfWidth, lineEndY);
    } else {
      ctx.moveTo(x - halfWidth, lineEndY);
      ctx.lineTo(x, y + halfHeight);
      ctx.lineTo(x + halfWidth, lineEndY);
    }
    ctx.closePath();
    ctx.fill();
  }

  update(speed) {
    this.x -= speed;
  }
}

class Collectibles {
  constructor() {
    this.items = [];
  }

  update(dungeon, deltaTime, obstacles) {
    // Remove off-screen collectibles
    this.items = this.items.filter((item) => item.x > -10);

    // Move collectibles
    this.items.forEach((item) => {
      item.update(dungeon.speed * deltaTime);
    });

    // Occasionally add new collectibles
    if (Math.random() < 0.02 * deltaTime) {
      this.spawnCollectible(dungeon, obstacles);
    }
  }

  draw(ctx) {
    this.items.forEach((item) => item.draw(ctx));
  }

  checkCollisions(snake) {
    return this.items.filter((item) => {
      const dx = snake.x - item.x;
      const dy = snake.y - item.y;
      return Math.sqrt(dx * dx + dy * dy) < snake.radius + item.radius;
    });
  }

  spawnCollectible(dungeon, obstacles) {
    const x = GAME_WIDTH;
    const safeArea = this.findSafeArea(dungeon);
    if (!safeArea) return; // No safe area to spawn

    let y,
      type,
      attempts = 0;
    const maxAttempts = 10;

    do {
      y = Math.random() * (safeArea.bottom - safeArea.top) + safeArea.top;
      type =
        Math.random() < 0.7
          ? "coin"
          : Math.random() < 0.5
          ? "timeSlow"
          : "reverseGravity";
      attempts++;
    } while (
      this.collidesWithObstacles(x, y, obstacles) &&
      attempts < maxAttempts
    );

    if (attempts < maxAttempts) {
      this.items.push(new Collectible(x, y, type));
    }
  }

  findSafeArea(dungeon) {
    const rightmostSegment = dungeon.segments[dungeon.segments.length - 1];
    if (!rightmostSegment) return null;

    const floorY = Math.min(...rightmostSegment.floorPoints.map((p) => p.y));
    const ceilingY = Math.max(
      ...rightmostSegment.ceilingPoints.map((p) => p.y)
    );

    const padding = 20; // Padding from floor and ceiling
    return {
      top: ceilingY + padding,
      bottom: floorY - padding,
    };
  }

  collidesWithObstacles(x, y, obstacles) {
    const collectibleRadius = 10; // Assuming all collectibles have the same radius
    return obstacles.obstacles.some((obstacle) => {
      const dx = x - obstacle.x;
      const dy = y - obstacle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < collectibleRadius + obstacle.size / 2;
    });
  }
}
