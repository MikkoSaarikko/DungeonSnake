class Snake {
  constructor() {
    this.x = GAME_WIDTH * 0.25; // Fixed at 25% of the screen width
    this.y = GAME_HEIGHT / 2;
    this.radius = 10;
    this.velocity = 0;
    this.baseGravity = 0;
    this.gravity = this.baseGravity;
    this.maxGravity = 0.04;
    this.minGravity = -0.04;
    this.gravityChangeRate = 0.02;
    this.isAlive = true;
    this.hueOffset = 0;
    this.hueSpeed = 0.1; // Speed of color change
    this.headHue = 0;
    this.angle = 0;
    this.targetAngle = 0;
    this.turnSpeed = 0.1; // Adjust this to change how quickly the snake turns
    this.pointsEffect = null;
    this.pointsEffectDuration = 0;
    this.pointsEffectMaxDuration = 60; // 1 second at 60 fps
    this.timeSlowEffect = null;
    this.timeSlowEffectDuration = 0;
    this.timeSlowEffectMaxDuration = 60; // 1 second at 60 fps
    this.reverseGravityActive = false;
    this.reverseGravityDuration = 0;
    this.reverseGravityEffect = null;
    this.reverseGravityEffectDuration = 0;
    this.reverseGravityEffectMaxDuration = 60; // 1 second at 60 fps
    this.tailSegments = [];
    this.tailLength = 75; // Increased tail length
    this.tailSpacing = 5; // Decreased spacing between segments
    for (let i = 0; i < this.tailLength; i++) {
      this.tailSegments.push({ x: this.x - i * this.tailSpacing, y: this.y });
    }
  }

  update(dungeon, isReducingGravity, collectibleCollected, deltaTime) {
    if (!this.isAlive) return;

    // Update gravity
    if (this.reverseGravityActive) {
      if (isReducingGravity) {
        this.gravity = Math.min(
          this.maxGravity,
          this.gravity + this.gravityChangeRate * deltaTime * BASE_SPEED
        );
      } else {
        this.gravity = Math.max(
          this.minGravity,
          this.gravity - this.gravityChangeRate * deltaTime * BASE_SPEED
        );
      }
    } else {
      if (isReducingGravity) {
        this.gravity = Math.max(
          this.minGravity,
          this.gravity - this.gravityChangeRate * deltaTime * BASE_SPEED
        );
      } else {
        this.gravity = Math.min(
          this.maxGravity,
          this.gravity + this.gravityChangeRate * deltaTime * BASE_SPEED
        );
      }
    }

    // Apply gravity
    this.velocity += this.gravity * deltaTime * BASE_SPEED;

    // Limit maximum velocity
    const maxVelocity = 6;
    this.velocity = Math.max(
      -maxVelocity,
      Math.min(maxVelocity, this.velocity)
    );

    // Update Y position only
    this.y += this.velocity * deltaTime * BASE_SPEED;

    // Update target angle based on velocity
    this.targetAngle = Math.atan2(this.velocity, dungeon.speed);

    // Smoothly turn towards target angle
    const angleDiff = this.targetAngle - this.angle;
    this.angle += angleDiff * this.turnSpeed * deltaTime * BASE_SPEED;

    // Update tail
    let prevX = this.x;
    let prevY = this.y;
    for (let segment of this.tailSegments) {
      const tempX = segment.x;
      const tempY = segment.y;
      segment.x = prevX;
      segment.y = prevY;
      prevX = tempX;
      prevY = tempY;
    }

    // Move tail segments with the dungeon
    for (let segment of this.tailSegments) {
      segment.x -= dungeon.speed * deltaTime * BASE_SPEED;
    }

    // Remove tail segments that are too far behind
    const minTailX = this.x - GAME_WIDTH * 0.25; // Increased tail visibility
    this.tailSegments = this.tailSegments.filter(
      (segment) => segment.x > minTailX
    );

    // Add new tail segments if needed
    while (this.tailSegments.length < this.tailLength) {
      const lastSegment = this.tailSegments[this.tailSegments.length - 1];
      this.tailSegments.push({
        x: lastSegment.x - this.tailSpacing,
        y: lastSegment.y,
      });
    }

    // Prevent the snake from going off-screen vertically
    if (this.y + this.radius > GAME_HEIGHT) {
      this.y = GAME_HEIGHT - this.radius;
      this.velocity = 0;
      this.gravity = this.baseGravity;
    }

    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.velocity = 0;
      this.gravity = this.baseGravity;
    }

    // Update hue offset for color change
    this.hueOffset =
      (this.hueOffset + this.hueSpeed * deltaTime * BASE_SPEED) % 360;
    this.headHue = this.hueOffset;

    this.updatePointsEffect(deltaTime);
    this.updateTimeSlowEffect(deltaTime);
    this.updateReverseGravityEffect(deltaTime);
  }

  updateReverseGravityEffect(deltaTime) {
    if (this.reverseGravityActive) {
      this.reverseGravityDuration -= deltaTime * BASE_SPEED;
      if (this.reverseGravityDuration <= 0) {
        this.reverseGravityActive = false;
        this.reverseGravityEffect = null;
      }
    }

    if (this.reverseGravityEffect) {
      this.reverseGravityEffectDuration -= deltaTime * BASE_SPEED;
      if (this.reverseGravityEffectDuration <= 0) {
        this.reverseGravityEffect = null;
      }
    }
  }

  updatePointsEffect(deltaTime) {
    if (this.pointsEffect) {
      this.pointsEffectDuration -= deltaTime * BASE_SPEED;
      if (this.pointsEffectDuration <= 0) {
        this.pointsEffect = null;
      }
    }
  }

  updateTimeSlowEffect(deltaTime) {
    if (this.timeSlowEffect) {
      this.timeSlowEffectDuration -= deltaTime * BASE_SPEED;
      if (this.timeSlowEffectDuration <= 0) {
        this.timeSlowEffect = null;
      }
    }
  }

  draw(ctx) {
    // Draw tail
    ctx.lineWidth = this.radius * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);

    // Use quadratic curves to smooth out the tail
    for (let i = 0; i < this.tailSegments.length - 1; i += 2) {
      const segment = this.tailSegments[i];
      const nextSegment = this.tailSegments[i + 1] || segment;
      const midX = (segment.x + nextSegment.x) / 2;
      const midY = (segment.y + nextSegment.y) / 2;
      ctx.quadraticCurveTo(segment.x, segment.y, midX, midY);
    }

    // Create gradient for tail
    const tailGradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.tailSegments[this.tailSegments.length - 1].x,
      this.tailSegments[this.tailSegments.length - 1].y
    );
    tailGradient.addColorStop(0, `hsl(${this.headHue}, 100%, 50%)`);
    tailGradient.addColorStop(
      1,
      `hsla(${(this.headHue + 180) % 360}, 100%, 50%, 0.1)`
    );

    ctx.strokeStyle = tailGradient;
    ctx.stroke();

    // Draw head
    const headLength = this.radius * 4;
    const headWidth = this.radius * 2;
    const headOffset = this.radius;

    const headCenter = {
      x: this.x + headOffset * Math.cos(this.angle),
      y: this.y + headOffset * Math.sin(this.angle),
    };

    ctx.save();
    ctx.translate(headCenter.x, headCenter.y);
    ctx.rotate(this.angle);

    // Draw custom shape
    ctx.beginPath();
    ctx.moveTo(headLength / 2, 0); // Tip of the head
    ctx.arcTo(
      headLength / 4,
      headWidth / 2,
      -headLength / 2,
      headWidth / 2,
      headWidth / 2
    );
    ctx.arcTo(
      -headLength / 2,
      headWidth / 2,
      -headLength / 2,
      -headWidth / 2,
      headWidth / 4
    );
    ctx.arcTo(
      -headLength / 2,
      -headWidth / 2,
      headLength / 4,
      -headWidth / 2,
      headWidth / 2
    );
    ctx.arcTo(headLength / 4, -headWidth / 2, headLength / 2, 0, headWidth / 2);

    ctx.closePath();

    // Fill head with solid color
    ctx.fillStyle = `hsl(${this.headHue}, 100%, 50%)`;
    ctx.fill();

    // Draw eye
    const eyeOffsetX = headLength / 6;
    const eyeOffsetY = -headWidth / 4;
    const eyeRadius = headWidth / 6;

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(eyeOffsetX, eyeOffsetY, eyeRadius / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draw points effect
    if (this.pointsEffect) {
      ctx.save();
      ctx.fillStyle = "yellow";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const alpha = this.pointsEffectDuration / this.pointsEffectMaxDuration;
      ctx.globalAlpha = alpha;
      ctx.fillText(
        `+${this.pointsEffect}`,
        this.x,
        this.y - 30 - (1 - alpha) * 20
      );
      ctx.restore();
    }

    // Draw time slow effect
    if (this.timeSlowEffect) {
      ctx.save();
      ctx.fillStyle = "lightblue";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const alpha =
        this.timeSlowEffectDuration / this.timeSlowEffectMaxDuration;
      ctx.globalAlpha = alpha;
      ctx.fillText(this.timeSlowEffect, this.x, this.y - 60 - (1 - alpha) * 20);
      ctx.restore();
    }

    // Draw reverse gravity effect
    if (this.reverseGravityEffect) {
      ctx.save();
      ctx.fillStyle = "purple";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const alpha =
        this.reverseGravityEffectDuration /
        this.reverseGravityEffectMaxDuration;
      ctx.globalAlpha = alpha;
      ctx.fillText(
        this.reverseGravityEffect,
        this.x,
        this.y - 90 - (1 - alpha) * 20
      );
      ctx.restore();
    }
  }

  checkCollision(x, y) {
    // Check collision with the snake's body
    const headCenter = {
      x: this.x + this.radius * Math.cos(this.angle),
      y: this.y + this.radius * Math.sin(this.angle),
    };
    const distance = Math.sqrt(
      (headCenter.x - x) ** 2 + (headCenter.y - y) ** 2
    );

    // Reduced collision radius to favor the player
    const collisionRadius = this.radius * 1.5; // Reduced from 2 to 1.5
    return distance < collisionRadius;
  }

  checkDungeonCollision(dungeon) {
    const segments = dungeon.segments;
    const headCenter = {
      x: this.x + this.radius * Math.cos(this.angle),
      y: this.y + this.radius * Math.sin(this.angle),
    };

    // Check if the snake's head is inside the dungeon walls
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const nextSegment = segments[i + 1];

      // Create polygons for floor and ceiling
      const floorPolygon = [
        ...segment.floorPoints,
        ...nextSegment.floorPoints.slice().reverse(),
        { x: segment.floorPoints[0].x, y: GAME_HEIGHT },
        {
          x: nextSegment.floorPoints[nextSegment.floorPoints.length - 1].x,
          y: GAME_HEIGHT,
        },
      ];

      const ceilingPolygon = [
        ...segment.ceilingPoints,
        ...nextSegment.ceilingPoints.slice().reverse(),
        { x: segment.ceilingPoints[0].x, y: 0 },
        {
          x: nextSegment.ceilingPoints[nextSegment.ceilingPoints.length - 1].x,
          y: 0,
        },
      ];

      if (
        this.pointInPolygon(headCenter, floorPolygon) ||
        this.pointInPolygon(headCenter, ceilingPolygon)
      ) {
        return true; // Collision detected
      }
    }

    return false;
  }

  pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
