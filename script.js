
let gameState = {
    currentMachine: 1,
    currentProblem: null,
    productsCount: 0,
    totalProblems: 0,
    breakdown1: [],
    breakdown2: [],
    gridValues: {},
    totalValue: null,
    numberPool: [],
};

//Loading Animation
var correctAnimation = lottie.loadAnimation({
    container: document.getElementById("correctContainer"),
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "assets/correct.json",
});

var incorrectAnimation = lottie.loadAnimation({
    container: document.getElementById("incorrectContainer"),
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "assets/incorrect.json",
});

let lottieInstance = null;
const lottieContainer = document.getElementById("lottieContainer");

// function showLottieAnimation(type) {
//     console.log('Hello: ' + type)
//     const animation = lottieInstances[type];
//     if (!animation) return;

//     const overlay = document.getElementById("lottieOverlay");
//     const container = document.getElementById("lottieContainer");

//     // Clear and append SVG
//     container.innerHTML = "";
//     container.appendChild(animation.renderer.svgElement);

//     // Show overlay
//     overlay.style.display = "block";

//     // Reset and play animation
//     animation.goToAndStop(0, true);
//     animation.play();

//     // Hide overlay after animation
//     setTimeout(() => {
//         overlay.style.display = "none";
//     }, 3000);
// }



function selectMachine(level) {
    gameState.currentMachine = level;
    document.getElementById("factoryLevel").textContent = level;

    document
        .querySelectorAll(".machine-btn")
        .forEach((btn) => btn.classList.remove("active"));
    document
        .querySelectorAll(".machine-btn")
    [level - 1].classList.add("active");

    newProblem();
}

function generateProblem() {
    let num1, num2;

    switch (gameState.currentMachine) {
        case 1:
            num1 = Math.floor(Math.random() * 90) + 10;
            num2 = Math.floor(Math.random() * 9) + 1;
            break;
        case 2:
            num1 = Math.floor(Math.random() * 90) + 10;
            num2 = Math.floor(Math.random() * 90) + 10;
            break;
        case 3:
            num1 = Math.floor(Math.random() * 900) + 100;
            num2 = Math.floor(Math.random() * 90) + 10;
            break;
    }

    return { num1, num2, answer: num1 * num2 };
}

function breakdownNumber(num) {
    const digits = num.toString().split("").map(Number);
    const breakdown = [];

    for (let i = 0; i < digits.length; i++) {
        const placeValue = Math.pow(10, digits.length - 1 - i);
        if (digits[i] !== 0) {
            breakdown.push(digits[i] * placeValue);
        }
    }

    return breakdown;
}

function generateNumberPool() {
    const num1 = gameState.currentProblem.num1;
    const num2 = gameState.currentProblem.num2;

    gameState.breakdown1 = breakdownNumber(num1);
    gameState.breakdown2 = breakdownNumber(num2);

    const correctAnswers = [];
    let totalSum = 0;

    // Add the place values (headers) to the correctAnswers pool
    correctAnswers.push(...gameState.breakdown1);
    correctAnswers.push(...gameState.breakdown2);

    // Generate all correct products
    for (let i = 0; i < gameState.breakdown2.length; i++) {
        for (let j = 0; j < gameState.breakdown1.length; j++) {
            const product = gameState.breakdown1[j] * gameState.breakdown2[i];
            correctAnswers.push(product);
            totalSum += product;
        }
    }

    // Add the final answer
    correctAnswers.push(totalSum);

    // Generate some distractors
    const distractors = [];
    for (let i = 0; i < 8; i++) {
        let distractor;
        do {
            distractor = Math.floor(Math.random() * 1000) + 10;
        } while (
            correctAnswers.includes(distractor) ||
            distractors.includes(distractor)
        );
        distractors.push(distractor);
    }

    // Combine and shuffle
    gameState.numberPool = [...correctAnswers, ...distractors].sort(
        () => Math.random() - 0.5
    );
}


function createNumberPool() {
    const poolContainer = document.getElementById("numberPool");
    poolContainer.innerHTML = "";

    gameState.numberPool.forEach((number, index) => {
        const numberElement = document.createElement("div");
        numberElement.className = "draggable-number";
        numberElement.textContent = number;
        numberElement.draggable = true;
        numberElement.id = `number_${index}`;

        numberElement.addEventListener("dragstart", handleDragStart);
        numberElement.addEventListener("dragend", handleDragEnd);

        poolContainer.appendChild(numberElement);
    });
}

function createAreaGrid() {
    let html = '<div class="area-grid">';

    // Top row: blank top-left + drop zones for breakdown1
    html += '<div class="grid-row">';
    html += '<div class="grid-cell header">×</div>'; // Top-left corner

    gameState.breakdown1.forEach((part, col) => {
        html += `<div class="grid-cell drop-zone empty header"
                  id="col_header_${col}"
                  data-row="header"
                  data-col="${col}"
                  data-expected="${part}">
                ?
            </div>`;
    });
    html += "</div>";

    // Data rows with left headers as drop zones
    gameState.breakdown2.forEach((part2, row) => {
        html += '<div class="grid-row">';

        html += `<div class="grid-cell drop-zone empty header"
                  id="row_header_${row}"
                  data-row="${row}"
                  data-col="header"
                  data-expected="${part2}">
              ?
            </div>`;

        gameState.breakdown1.forEach((part1, col) => {
            const expectedProduct = part1 * part2;
            html += `<div class="grid-cell drop-zone empty" 
                   id="grid_${row}_${col}" 
                   data-row="${row}" 
                   data-col="${col}"
                   data-expected="${expectedProduct}">
                    ?
                </div>`;
        });

        html += "</div>";
    });

    html += "</div>";
    document.getElementById("areaGrid").innerHTML = html;

    // Add drag/drop listeners
    document.querySelectorAll(".drop-zone").forEach((cell) => {
        cell.addEventListener("dragover", handleDragOver);
        cell.addEventListener("drop", handleDrop);
        cell.addEventListener("dragleave", handleDragLeave);
    });

    // Total drop zone
    const totalDropZone = document.getElementById("totalDropZone");
    totalDropZone.addEventListener("dragover", handleDragOver);
    totalDropZone.addEventListener("drop", handleTotalDrop);
    totalDropZone.addEventListener("dragleave", handleDragLeave);
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.target;
    e.target.style.opacity = "0.5";
}

function handleDragEnd(e) {
    e.target.style.opacity = "1";
    draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.target.classList.add("drag-over");
}

function handleDragLeave(e) {
    e.target.classList.remove("drag-over");
}

function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove("drag-over");

    if (draggedElement && !draggedElement.classList.contains("used")) {
        const value = parseInt(draggedElement.textContent);

        // Update the cell
        e.target.textContent = value;
        e.target.classList.remove("empty");
        e.target.classList.add("filled");
        e.target.classList.remove("drop-zone");

        // Store the value in game state
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        gameState.gridValues[`${row}_${col}`] = value;

        // Mark the number as used
        draggedElement.classList.add("used");
    }
}
function handleTotalDrop(e) {
    e.preventDefault();
    e.target.classList.remove("drag-over");

    if (draggedElement && !draggedElement.classList.contains("used")) {
        const value = parseInt(draggedElement.textContent);

        e.target.textContent = value;
        e.target.classList.add("filled");

        gameState.totalValue = value;

        draggedElement.classList.add("used");
    }
}

function checkWork() {

    let allCorrect = true;


    // Check grid values
    for (let i = 0; i < gameState.breakdown2.length; i++) {
        for (let j = 0; j < gameState.breakdown1.length; j++) {
            const cellId = `grid_${i}_${j}`;
            const cell = document.getElementById(cellId);
            const expectedValue =
                gameState.breakdown1[j] * gameState.breakdown2[i];
            const actualValue = gameState.gridValues[`${i}_${j}`];

            if (actualValue === expectedValue) {
                cell.classList.add("correct");
                cell.classList.remove("wrong");
            } else if (actualValue !== undefined) {
                cell.classList.add("wrong");
                cell.classList.remove("correct");
                allCorrect = false;

            } else {
                // Cell is empty
                allCorrect = false;
            }
        }
    }

    if (allCorrect) {
        correctContainer.style.display = 'block';
        correctAnimation.stop();
        correctAnimation.goToAndPlay(0, true);

        correctAnimation.addEventListener('complete',function(){
            correctContainer.style.display = 'none';
        })


    } else {
        incorrectContainer.style.display = 'block';
        incorrectAnimation.stop();
        incorrectAnimation.goToAndPlay(0, true);

        incorrectAnimation.addEventListener('complete',function(){
            incorrectContainer.style.display = 'none';
        })

    }
}
function showAnswer() {
    let allCorrect = true;
    // Fill grid with correct answers
    for (let i = 0; i < gameState.breakdown2.length; i++) {
        for (let j = 0; j < gameState.breakdown1.length; j++) {
            const cellId = `grid_${i}_${j}`;
            const cell = document.getElementById(cellId);
            const correctValue =
                gameState.breakdown1[j] * gameState.breakdown2[i];

            cell.textContent = correctValue;
            cell.classList.add("correct");
            cell.classList.remove("drop-zone");
            gameState.gridValues[`${i}_${j}`] = correctValue;
        }
    }

    // Fill total
    const totalDropZone = document.getElementById("totalDropZone");
    if (gameState.totalValue === gameState.currentProblem.answer) {
        totalDropZone.style.background = "#d5f4e6";
        totalDropZone.style.borderColor = "#27ae60";
    } else if (gameState.totalValue !== null) {
        totalDropZone.style.background = "#fadbd8";
        totalDropZone.style.borderColor = "#e74c3c";
        allCorrect = false;
    } else {
        // Total is empty
        allCorrect = false;
    }

    if (allCorrect) {
        //showLottieAnimation('correct');
        completeProduction();
    } else {
        //showLottieAnimation('incorrect');
    }
}



function resetGrid() {
    gameState.gridValues = {};
    gameState.totalValue = null;

    // Reset grid cells
    document.querySelectorAll(".grid-cell:not(.header)").forEach((cell) => {
        cell.textContent = "Drop Here";
        cell.className = "grid-cell drop-zone";
    });

    // Reset total
    const totalDropZone = document.getElementById("totalDropZone");
    totalDropZone.textContent = "Drop Here";
    totalDropZone.className = "total-drop-zone";

    // Reset number pool
    document.querySelectorAll(".draggable-number").forEach((number) => {
        number.classList.remove("used");
    });

    document.getElementById("feedback").textContent = "";
}

function completeProduction() {
    gameState.productsCount++;
    updateStats();

    const explosion = document.createElement("div");
    explosion.className = "success-explosion";
    explosion.textContent = "🎉";
    document.body.appendChild(explosion);

    setTimeout(() => {
        document.body.removeChild(explosion);
    }, 2000);

    const feedback = document.getElementById("feedback");
    feedback.textContent = `🏆 Product #${gameState.productsCount} completed! Great work!`;
    feedback.className = "feedback success";

    setTimeout(() => {
        newProblem();
    }, 3000);
}

function updateStats() {
    //document.getElementById("productsCount").textContent =  gameState.productsCount;
    const successRate =
        gameState.totalProblems > 0
            ? Math.round(
                (gameState.productsCount / gameState.totalProblems) * 100
            )
            : 100;
    //document.getElementById("successRate").textContent = successRate + "%";
}

function newProblem() {
    gameState.currentProblem = generateProblem();
    gameState.totalProblems++;
    gameState.gridValues = {};
    gameState.totalValue = null;

    document.getElementById("num1").textContent =
        gameState.currentProblem.num1;
    document.getElementById("num2").textContent =
        gameState.currentProblem.num2;

    generateNumberPool();
    createNumberPool();
    createAreaGrid();

    // Reset total drop zone
    const totalDropZone = document.getElementById("totalDropZone");
    totalDropZone.textContent = "Drop Here";
    totalDropZone.className = "total-drop-zone";


    updateStats();
}

// Initialize
newProblem();
