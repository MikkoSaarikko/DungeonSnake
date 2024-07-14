class Snake {
  constructor() {
    this.x = GAME_WIDTH / 4;
    this.y = GAME_HEIGHT / 2;
    this.radius = 10;
    this.velocity = 0;
    this.baseGravity = 0;
    this.gravity = this.baseGravity;
    this.maxGravity = 0.04;
    this.minGravity = -0.04;
    this.gravityChangeRate = 0.02;
    this.isAlive = true;
    this.tail = [];
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
    this.initializeTail();
  }

  initializeTail() {
    for (let x = this.x; x >= 0; x -= 1) {
      this.tail.push({ x, y: this.y });
    }
  }

  update(dungeon, isReducingGravity, collectibleCollected) {
    if (!this.isAlive) return;

    // Update gravity
    if (this.reverseGravityActive) {
      if (isReducingGravity) {
        this.gravity = Math.min(
          this.maxGravity,
          this.gravity + this.gravityChangeRate
        );
      } else {
        this.gravity = Math.max(
          this.minGravity,
          this.gravity - this.gravityChangeRate
        );
      }
    } else {
      if (isReducingGravity) {
        this.gravity = Math.max(
          this.minGravity,
          this.gravity - this.gravityChangeRate
        );
      } else {
        this.gravity = Math.min(
          this.maxGravity,
          this.gravity + this.gravityChangeRate
        );
      }
    }

    // Apply gravity
    this.velocity += this.gravity;

    // Limit maximum velocity
    const maxVelocity = 6;
    this.velocity = Math.max(
      -maxVelocity,
      Math.min(maxVelocity, this.velocity)
    );

    this.y += this.velocity;

    // Update target angle based on velocity
    this.targetAngle = Math.atan2(this.velocity, dungeon.speed);

    // Smoothly turn towards target angle
    const angleDiff = this.targetAngle - this.angle;
    this.angle += angleDiff * this.turnSpeed;

    // Update tail
    this.tail.unshift({ x: this.x, y: this.y });

    // Move tail with dungeon and trim excess
    this.tail = this.tail
      .map((segment) => ({
        x: segment.x - dungeon.speed,
        y: segment.y,
      }))
      .filter((segment) => segment.x >= -this.radius);

    // Ensure tail reaches left edge
    while (this.tail[this.tail.length - 1].x > -this.radius) {
      const lastSegment = this.tail[this.tail.length - 1];
      this.tail.push({ x: lastSegment.x - 1, y: lastSegment.y });
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
    this.hueOffset = (this.hueOffset + this.hueSpeed) % 360;
    this.headHue = this.hueOffset;

    this.updatePointsEffect();
    this.updateTimeSlowEffect();
    this.updateReverseGravityEffect();
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

  updateReverseGravityEffect() {
    if (this.reverseGravityActive) {
      this.reverseGravityDuration--;
      if (this.reverseGravityDuration <= 0) {
        this.reverseGravityActive = false;
        this.reverseGravityEffect = null;
      }
    }

    if (this.reverseGravityEffect) {
      this.reverseGravityEffectDuration--;
      if (this.reverseGravityEffectDuration <= 0) {
        this.reverseGravityEffect = null;
      }
    }
  }

  updatePointsEffect() {
    if (this.pointsEffect) {
      this.pointsEffectDuration--;
      if (this.pointsEffectDuration <= 0) {
        this.pointsEffect = null;
      }
    }
  }

  updateTimeSlowEffect() {
    if (this.timeSlowEffect) {
      console.log(
        "Updating time slow effect:",
        this.timeSlowEffect,
        this.timeSlowEffectDuration
      );
      this.timeSlowEffectDuration--;
      if (this.timeSlowEffectDuration <= 0) {
        this.timeSlowEffect = null;
        console.log("Time slow effect ended");
      }
    }
  }

  draw(ctx) {
    const headLength = this.radius * 4;
    const headWidth = this.radius * 2;
    const headOffset = this.radius;

    // Draw tail
    ctx.lineWidth = this.radius * 2;
    ctx.lineCap = "round";

    ctx.beginPath();
    let started = false;
    for (let i = this.tail.length - 1; i >= 0; i--) {
      const segment = this.tail[i];
      if (segment.x <= GAME_WIDTH) {
        if (!started) {
          ctx.moveTo(segment.x, segment.y);
          started = true;
        } else {
          ctx.lineTo(segment.x, segment.y);
        }
      }
    }

    // Create gradient for tail
    const tailGradient = ctx.createLinearGradient(
      this.tail[0].x,
      this.tail[0].y,
      this.tail[this.tail.length - 1].x,
      this.tail[this.tail.length - 1].y
    );
    tailGradient.addColorStop(0, `hsl(${this.headHue}, 100%, 50%)`);
    tailGradient.addColorStop(
      1,
      `hsl(${(this.headHue + 180) % 360}, 100%, 50%)`
    );

    ctx.strokeStyle = tailGradient;
    ctx.stroke();

    // Draw head
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
      console.log("Drawing time slow effect:", this.timeSlowEffect);
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

  lineCircleCollision(p1, p2, circleCenter, radius) {
    const lineVector = { x: p2.x - p1.x, y: p2.y - p1.y };
    const circleToLineStart = {
      x: circleCenter.x - p1.x,
      y: circleCenter.y - p1.y,
    };

    const lineLength = Math.sqrt(lineVector.x ** 2 + lineVector.y ** 2);
    const unitLineVector = {
      x: lineVector.x / lineLength,
      y: lineVector.y / lineLength,
    };

    const dotProduct =
      circleToLineStart.x * unitLineVector.x +
      circleToLineStart.y * unitLineVector.y;
    const closestPoint = {
      x:
        p1.x + unitLineVector.x * Math.max(0, Math.min(dotProduct, lineLength)),
      y:
        p1.y + unitLineVector.y * Math.max(0, Math.min(dotProduct, lineLength)),
    };

    const distance = Math.sqrt(
      (circleCenter.x - closestPoint.x) ** 2 +
        (circleCenter.y - closestPoint.y) ** 2
    );

    // Add a small buffer to make it even more forgiving
    return distance < radius + 2;
  }
}
