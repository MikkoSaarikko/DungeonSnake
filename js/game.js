const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let GAME_WIDTH, GAME_HEIGHT;

const OBSTACLE_SPAWN_INTERVAL = 120; // Frames between obstacle spawns

let snake, dungeon, obstacles, collectibles;
let gameOver = false;
let score = 0;
let highScore = 0;
let isReducingGravity = false;
let timeSlowActive = false;
let timeSlowDuration = 0;
let nearMissTimer = 0;
const NEAR_MISS_GRACE_PERIOD = 10;
const TIME_SLOW_FACTOR = 0.5;
const TIME_SLOW_DURATION_INCREASE = 300;
const BASE_SPEED = 120; 

const FRAME_RATE = 60;
const FRAME_TIME = 1000 / FRAME_RATE;
let lastFrameTime = 0;

let frameCount = 0;
let lastFpsTime = 0;
let fps = 0;

function setCanvasSize() {
    GAME_WIDTH = Math.floor(window.innerWidth);
    GAME_HEIGHT = Math.floor(window.innerHeight);
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    canvas.style.position = "absolute";
    canvas.style.left = "50%";
    canvas.style.top = "50%";
    canvas.style.transform = "translate(-50%, -50%)";
}

setCanvasSize();

window.addEventListener("resize", () => {
    setCanvasSize();
    if (snake) {
        snake.x = Math.min(snake.x, GAME_WIDTH / 4);
        snake.y = Math.min(snake.y, GAME_HEIGHT / 2);
    }
});

function saveHighScore(score) {
    localStorage.setItem("snakeCaveHighScore", score);
    console.log("Saving high score:", score);
}

function loadHighScore() {
    const savedScore = localStorage.getItem("snakeCaveHighScore");
    console.log("Loaded high score from storage:", savedScore);
    return savedScore ? parseInt(savedScore) : 0;
}

function init() {
    snake = new Snake();
    dungeon = new Dungeon();
    obstacles = new Obstacles(dungeon);
    collectibles = new Collectibles();
    gameOver = false;
    score = 0;
    highScore = loadHighScore();
    isReducingGravity = false;
    timeSlowActive = false;
    timeSlowDuration = 0;
}

function update(deltaTime) {
    if (gameOver) return;

    const timeSlowFactor = timeSlowActive ? TIME_SLOW_FACTOR : 1;
    const fixedDeltaTime = (1 / FRAME_RATE) * timeSlowFactor;

    dungeon.update(fixedDeltaTime * BASE_SPEED);
    obstacles.update(fixedDeltaTime);
    collectibles.update(dungeon, fixedDeltaTime * BASE_SPEED, obstacles);

    const collectedItems = collectibles.checkCollisions(snake);
    let collectibleCollected = false;
    collectedItems.forEach((item) => {
        if (item.type === "coin") {
            const speedMultiplier = Math.max(1, dungeon.speed / 2);
            const scaledValue = Math.floor(item.value * speedMultiplier);
            score += scaledValue;
            snake.pointsEffect = scaledValue;
            snake.pointsEffectDuration = snake.pointsEffectMaxDuration;
        } else if (item.type === "timeSlow") {
            timeSlowActive = true;
            timeSlowDuration += TIME_SLOW_DURATION_INCREASE;
            snake.timeSlowEffect = "+5s";
            snake.timeSlowEffectDuration = snake.timeSlowEffectMaxDuration;
        } else if (item.type === "reverseGravity") {
            snake.reverseGravityActive = true;
            snake.reverseGravityDuration = 300;
            snake.reverseGravityEffect = "Reverse Gravity!";
            snake.reverseGravityEffectDuration = snake.reverseGravityEffectMaxDuration;
        }
        const index = collectibles.items.indexOf(item);
        collectibles.items.splice(index, 1);
        collectibleCollected = true;
    });

    snake.update(dungeon, isReducingGravity, collectibleCollected, fixedDeltaTime);

    score += dungeon.speed * fixedDeltaTime * BASE_SPEED;

    if (timeSlowActive) {
        timeSlowDuration -= 1;
        if (timeSlowDuration <= 0) {
            timeSlowActive = false;
        }
    }

    if (nearMissTimer > 0) {
        nearMissTimer--;
    } else if (snake.checkDungeonCollision(dungeon)) {
        if (Math.random() < 0.2) {
            nearMissTimer = NEAR_MISS_GRACE_PERIOD;
        } else {
            gameOver = true;
        }
    }

    if (obstacles.checkCollision(snake)) {
        gameOver = true;
    }

    if (!snake.isAlive || gameOver) {
        gameOver = true;
        if (score > highScore) {
            highScore = Math.floor(score);
            saveHighScore(highScore);
        }
    }
}

function draw(currentTime) {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    dungeon.draw(ctx);
    obstacles.draw(ctx);
    collectibles.draw(ctx);
    snake.draw(ctx);

    // Draw score
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 30);
    ctx.fillText(`High Score: ${Math.floor(highScore)}`, 10, 60);

    // Draw time slow indicator
    if (timeSlowActive) {
        ctx.fillStyle = "rgba(173, 216, 230, 0.3)"; // Light blue with opacity
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = "navy";
        ctx.font = "24px Arial";
        ctx.textAlign = "right";
        ctx.fillText(
            `Time Slow: ${Math.ceil(timeSlowDuration / 60)}s`,
            GAME_WIDTH - 10,
            30
        );
    }

    // Draw reverse gravity indicator
    if (snake.reverseGravityActive) {
        ctx.fillStyle = "rgba(128, 0, 128, 0.3)"; // Light purple with opacity
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = "purple";
        ctx.font = "24px Arial";
        ctx.textAlign = "right";
        ctx.fillText(
            `Reverse Gravity: ${Math.ceil(snake.reverseGravityDuration / 60)}s`,
            GAME_WIDTH - 10,
            60
        );
    }

    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = "white";
        ctx.font = "48px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);

        ctx.font = "24px Arial";
        ctx.fillText(
            `Final Score: ${Math.floor(score)}`,
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 10
        );

        const newHighScore = score > highScore;

        if (newHighScore) {
            ctx.fillStyle = "gold";
            ctx.font = "bold 36px Arial";
            ctx.fillText(
                "New High Score!",
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 + 60
            );

            const pulseFactor = Math.sin(Date.now() / 200) * 0.1 + 1;
            ctx.font = `bold ${36 * pulseFactor}px Arial`;
            ctx.fillText(
                `${Math.floor(score)}`,
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 + 110
            );
        } else {
            ctx.fillStyle = "white";
            ctx.font = "24px Arial";
            ctx.fillText(
                `High Score: ${Math.floor(highScore)}`,
                GAME_WIDTH / 2,
                GAME_HEIGHT / 2 + 60
            );
        }

        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.fillText(
            "Press Space or Click to Restart",
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 150
        );
    }

    // Draw FPS counter
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`FPS: ${fps}`, 10, GAME_HEIGHT - 10);
}

function updateFPSCounter(currentTime) {
    frameCount++;
    if (currentTime > lastFpsTime + 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFpsTime = currentTime;
    }
}

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    // Calculate time since last frame
    const deltaTime = currentTime - lastFrameTime;

    // If enough time has passed, update and draw
    if (deltaTime >= FRAME_TIME) {
        // Update game state
        update(FRAME_TIME / 1000); // Convert to seconds for update

        // Draw the game
        draw(currentTime);

        // Update last frame time, rounding down to the nearest FRAME_TIME
        lastFrameTime = currentTime - (deltaTime % FRAME_TIME);

        // Update FPS counter
        updateFPSCounter(currentTime);
    }
}

function handleKeyDown(e) {
    if (e.code === "Space") {
        if (gameOver) {
            init();
        } else {
            isReducingGravity = true;
        }
    }
}

function handleKeyUp(e) {
    if (e.code === "Space") {
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

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("touchstart", handleTouchStart);
canvas.addEventListener("touchend", handleTouchEnd);

init();
lastFrameTime = performance.now();
requestAnimationFrame(gameLoop);