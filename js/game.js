const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let GAME_WIDTH, GAME_HEIGHT;

const OBSTACLE_SPAWN_INTERVAL = 120; // Frames between obstacle spawns

function setCanvasSize() {
    GAME_WIDTH = Math.floor(window.innerWidth * 0.95);
    GAME_HEIGHT = Math.floor(window.innerHeight * 0.95);
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Center the canvas
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
}

// Call setCanvasSize initially
setCanvasSize();

// Add event listener for window resize
window.addEventListener('resize', () => {
    setCanvasSize();
    if (snake) {
        // Adjust snake position if needed
        snake.x = Math.min(snake.x, GAME_WIDTH / 4);
        snake.y = Math.min(snake.y, GAME_HEIGHT / 2);
    }
});

let snake, dungeon, obstacles, collectibles;
let gameOver = false;
let score = 0;
let highScore = 0;
let isReducingGravity = false;
let timeSlowActive = false;
let timeSlowDuration = 0;
let nearMissTimer = 0;
const NEAR_MISS_GRACE_PERIOD = 10; // Adjust as needed
const TIME_SLOW_FACTOR = 0.5;
const TIME_SLOW_DURATION_INCREASE = 300;

function init() {
    setCanvasSize(); // Ensure canvas size is set correctly
    snake = new Snake();
    dungeon = new Dungeon();
    obstacles = new Obstacles(dungeon);
    collectibles = new Collectibles();
    gameOver = false;
    score = 0;
    isReducingGravity = false;
    timeSlowActive = false;
    timeSlowDuration = 0;
}

function update() {
    if (gameOver) return;

    const deltaTime = timeSlowActive ? TIME_SLOW_FACTOR : 1;

    dungeon.update(deltaTime);
    obstacles.update(dungeon.speed, deltaTime);
    collectibles.update(dungeon, deltaTime, obstacles);

    // Check for collectible collisions
    const collectedItems = collectibles.checkCollisions(snake);
    let collectibleCollected = false;
    collectedItems.forEach(item => {
        if (item.type === 'coin') {
            // Scale coin value with snake's speed
            const speedMultiplier = Math.max(1, dungeon.speed / 2);
            const scaledValue = Math.floor(item.value * speedMultiplier);
            score += scaledValue;
            // Show points effect
            snake.pointsEffect = scaledValue;
            snake.pointsEffectDuration = snake.pointsEffectMaxDuration;
        } else if (item.type === 'timeSlow') {
            timeSlowActive = true;
            timeSlowDuration += TIME_SLOW_DURATION_INCREASE;
        }
        const index = collectibles.items.indexOf(item);
        collectibles.items.splice(index, 1);
        collectibleCollected = true;
    });

    snake.update(dungeon, isReducingGravity, collectibleCollected);
    snake.updatePointsEffect();

    // Increase score based on distance traveled
    score += dungeon.speed * deltaTime;

    // Handle time slow duration
    if (timeSlowActive) {
        timeSlowDuration -= 1;
        if (timeSlowDuration <= 0) {
            timeSlowActive = false;
        }
    }

    // Check for dungeon collisions with grace period
    if (nearMissTimer > 0) {
        nearMissTimer--;
    } else if (snake.checkDungeonCollision(dungeon)) {
        if (Math.random() < 0.2) { // 20% chance of triggering near-miss
            nearMissTimer = NEAR_MISS_GRACE_PERIOD;
        } else {
            gameOver = true;
        }
    }

    // Check for obstacle collisions
    if (obstacles.checkCollision(snake)) {
        gameOver = true;
    }

    if (!snake.isAlive) {
        gameOver = true;
        if (score > highScore) {
            highScore = Math.floor(score);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    dungeon.draw(ctx);
    obstacles.draw(ctx);
    collectibles.draw(ctx);
    snake.draw(ctx);

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 30);
    ctx.fillText(`High Score: ${highScore}`, 10, 60);

    // Draw time slow indicator
    if (timeSlowActive) {
        ctx.fillStyle = 'rgba(173, 216, 230, 0.3)'; // Light blue with opacity
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = 'navy';
        ctx.font = '24px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Time Slow: ${Math.ceil(timeSlowDuration / 60)}s`, GAME_WIDTH - 10, 30);
    }

    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${Math.floor(score)}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
        ctx.fillText('Press Space or Click to Restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
    if (e.code === 'Space') {
        if (gameOver) {
            init();
        } else {
            isReducingGravity = true;
        }
    }
}

function handleKeyUp(e) {
    if (e.code === 'Space') {
        isReducingGravity = false;
    }
}

function handleMouseDown(e) {
    e.preventDefault();
    if (gameOver) {
        init();
    } else {
        isReducingGravity = true;
    }
}

function handleMouseUp(e) {
    e.preventDefault();
    isReducingGravity = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    if (gameOver) {
        init();
    } else {
        isReducingGravity = true;
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    isReducingGravity = false;
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchend', handleTouchEnd);

init();
gameLoop();