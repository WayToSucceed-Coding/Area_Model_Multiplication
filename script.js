// Global Game State Object
let gameState = {
    currentLevel: 1,
    currentProblem: null,
    score: 0,
    actualAnswer:0,
    totalProblems: 0,
    breakdown1: [],
    breakdown2: [],
    gridValues: {},
    totalValue: null,
    numberPool: [],
};

// Touch support variables
let selectedNumber = null;

// DOM Elements
const lottieContainer = document.getElementById('lottieOverlay');
const correctAnimationContainer = document.getElementById('correctContainer');
const incorrectAnimationContainer = document.getElementById('incorrectContainer');
const checkBtn = document.querySelector('.control-btn');
const scoreBoard = document.getElementById("scoreBoard");
const totalDropZone = document.getElementById("totalDropZone");
// Lottie Animations Initialization
const correctAnimation = lottie.loadAnimation({
    container: correctAnimationContainer,
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "assets/correct.json",
});

const incorrectAnimation = lottie.loadAnimation({
    container: incorrectAnimationContainer,
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "assets/incorrect.json",
});

// Generate a multiplication problem based on current level
function generateProblem() {
    let num1, num2;

    switch (gameState.currentLevel) {
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
    gameState.actualAnswer=num1*num2;
    return { num1, num2, answer: num1 * num2 };
}

// Break down a number into its place value components (e.g., 123 -> [100, 20, 3])
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

// Generate number pool with correct values and distractors
function generateNumberPool() {
    const { num1, num2 } = gameState.currentProblem;
    gameState.breakdown1 = breakdownNumber(num1);
    gameState.breakdown2 = breakdownNumber(num2);

    const correctAnswers = [...gameState.breakdown1, ...gameState.breakdown2];
    let totalSum = 0;

    for (let i = 0; i < gameState.breakdown2.length; i++) {
        for (let j = 0; j < gameState.breakdown1.length; j++) {
            const product = gameState.breakdown1[j] * gameState.breakdown2[i];
            correctAnswers.push(product);
            totalSum += product;
        }
    }

    correctAnswers.push(totalSum);

    const distractors = [];
    while (distractors.length < 8) {
        const distractor = Math.floor(Math.random() * 1000) + 10;
        if (!correctAnswers.includes(distractor) && !distractors.includes(distractor)) {
            distractors.push(distractor);
        }
    }

    gameState.numberPool = [...correctAnswers, ...distractors].sort(() => Math.random() - 0.5);
}


// Replace all touch event handlers with these simplified versions
function handleTouchStart(e) {
    e.preventDefault();
    selectedNumber = e.target;
    selectedNumber.style.opacity = "0.7";
}

function handleTouchEnd(e) {
    if (!selectedNumber) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    
    selectedNumber.style.opacity = "1";
    
    if (dropTarget) {
        // Handle grid cell drops
        if ((dropTarget.classList.contains("drop-zone") || 
             dropTarget.classList.contains("filled")) && 
            !selectedNumber.classList.contains("used")) {
            
            const value = parseInt(selectedNumber.textContent);
            
            // For total drop zone
            if (dropTarget.id === "totalDropZone") {
                dropTarget.textContent = value;
                gameState.totalValue = value;
            } 
            // For regular grid cells
            else {
                dropTarget.textContent = value;
                dropTarget.classList.remove("empty");
                dropTarget.classList.remove("wrong", "correct");
                
                const row = dropTarget.dataset.row;
                const col = dropTarget.dataset.col;
                
                // Only store value if it's a numeric grid cell (not header)
                if (row !== "header" && col !== "header") {
                    gameState.gridValues[`${row}_${col}`] = value;
                }
            }
        }
    }
    
    selectedNumber = null;
}

// Update the number pool creation to use these simpler handlers
function createNumberPool() {
    const poolContainer = document.getElementById("numberPool");
    poolContainer.innerHTML = "";

    gameState.numberPool.forEach((number, index) => {
        const numberElement = document.createElement("div");
        numberElement.className = "draggable-number";
        numberElement.textContent = number;
        numberElement.draggable = true;
        numberElement.id = `number_${index}`;

        // Keep mouse drag events for desktop
        numberElement.addEventListener("dragstart", handleDragStart);
        numberElement.addEventListener("dragend", handleDragEnd);

        // Simplified touch handlers
        numberElement.addEventListener("touchstart", handleTouchStart, { passive: false });
        numberElement.addEventListener("touchend", handleTouchEnd);
        
        poolContainer.appendChild(numberElement);
    });
}

// Create area model grid with drop zones
function createAreaGrid() {
    let html = '<div class="area-grid">';
    html += '<div class="grid-row">';
    html += '<div class="grid-cell header">×</div>';

    gameState.breakdown1.forEach((part, col) => {
        html += `<div class="grid-cell drop-zone empty header" id="col_header_${col}" data-row="header" data-col="${col}" data-expected="${part}">?</div>`;
    });
    html += "</div>";

    gameState.breakdown2.forEach((part2, row) => {
        html += '<div class="grid-row">';
        html += `<div class="grid-cell drop-zone empty header" id="row_header_${row}" data-row="${row}" data-col="header" data-expected="${part2}">?</div>`;

        gameState.breakdown1.forEach((part1, col) => {
            const expectedProduct = part1 * part2;
            html += `<div class="grid-cell drop-zone empty" id="grid_${row}_${col}" data-row="${row}" data-col="${col}" data-expected="${expectedProduct}">?</div>`;
        });

        html += "</div>";
    });

    html += "</div>";
    document.getElementById("areaGrid").innerHTML = html;

    // Attach drag/drop listeners
    document.querySelectorAll(".drop-zone").forEach((cell) => {
        cell.addEventListener("dragover", handleDragOver);
        cell.addEventListener("drop", handleDrop);
        cell.addEventListener("dragleave", handleDragLeave);
    });

    const totalDropZone = document.getElementById("totalDropZone");
    totalDropZone.addEventListener("dragover", handleDragOver);
    totalDropZone.addEventListener("drop", handleTotalDrop);
    totalDropZone.addEventListener("dragleave", handleDragLeave);

}

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

    if (draggedElement && !draggedElement.classList.contains("used")) {
        const value = parseInt(draggedElement.textContent);
        e.target.textContent = value;
        e.target.classList.remove("empty", "drop-zone");

        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        gameState.gridValues[`${row}_${col}`] = value;
    }
}

function handleTotalDrop(e) {
    e.preventDefault();
    e.target.classList.remove("drag-over");

    if (draggedElement && !draggedElement.classList.contains("used")) {
        const value = parseInt(draggedElement.textContent);
        e.target.textContent = value;
        gameState.totalValue = value;
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    selectedNumber = e.target;
    selectedNumber.style.opacity = "0.7";
}

function handleTouchEnd(e) {
    if (!selectedNumber) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    
   
    selectedNumber.style.opacity = "1";

    if (dropTarget) {
        // Handle grid cell drops
        if ((dropTarget.classList.contains("drop-zone") )) {
        
            const value = parseInt(selectedNumber.textContent);
            
            // For total drop zone
            if (dropTarget.id === "totalDropZone") {
                
                dropTarget.textContent = value;
                gameState.totalValue = value;
            } 
            // For regular grid cells
            else {
                dropTarget.textContent = value;
                dropTarget.classList.remove("empty");
                dropTarget.classList.remove("wrong", "correct");
                
                const row = dropTarget.dataset.row;
                const col = dropTarget.dataset.col;
                
                // Only store value if it's a numeric grid cell (not header)
                if (row !== "header" && col !== "header") {
                    gameState.gridValues[`${row}_${col}`] = value;
                }
            }
        }
    }
    
    selectedNumber = null;
}

// Validate grid and show appropriate feedback animation
function checkWork() {
    let allCorrect = true;

    const colHeaders = gameState.breakdown1.map((_, col) => parseInt(document.getElementById(`col_header_${col}`).textContent));
    const rowHeaders = gameState.breakdown2.map((_, row) => parseInt(document.getElementById(`row_header_${row}`).textContent));

    for (let i = 0; i < gameState.breakdown2.length; i++) {
        for (let j = 0; j < gameState.breakdown1.length; j++) {
            const cellId = `grid_${i}_${j}`;
            const cell = document.getElementById(cellId);
            const expected = colHeaders[j] * rowHeaders[i];
            const actual = gameState.gridValues[`${i}_${j}`];

            if (actual === expected) {
                cell.classList.add("correct");
                cell.classList.remove("wrong");
            } else if (actual !== undefined) {
                cell.classList.add("wrong");
                cell.classList.remove("correct");
                allCorrect = false;
            } else {
                allCorrect = false;
            }
        }
    }

    checkBtn.disabled = true;

    if (allCorrect && parseInt(totalDropZone.textContent) == gameState.actualAnswer) {
        totalDropZone.classList.add("filled");
        gameState.score++;
        scoreBoard.textContent = `Score: ${gameState.score}`;
        toggleLottie("correct");
    } else {
        toggleLottie("incorrect");
    }
}

// Helper to toggle Lottie animation based on result
function toggleLottie(type) {
    lottieContainer.style.display = 'block';
    correctAnimationContainer.style.display = (type === "correct") ? "block" : "none";
    incorrectAnimationContainer.style.display = (type === "incorrect") ? "block" : "none";

    const animation = (type === "correct") ? correctAnimation : incorrectAnimation;

    animation.stop();
    animation.goToAndPlay(0, true);
    animation.addEventListener('complete', function () {
        lottieContainer.style.display = 'none';
        correctAnimationContainer.style.display = "none";
        incorrectAnimationContainer.style.display = "none";
        if (type === "correct") newProblem();
        checkBtn.disabled = false;
    }, { once: true });
}

// Set up a new problem round
function newProblem() {
    gameState.currentProblem = generateProblem();
    gameState.totalProblems++;
    gameState.gridValues = {};
    gameState.totalValue = null;

    document.getElementById("num1").textContent = gameState.currentProblem.num1;
    document.getElementById("num2").textContent = gameState.currentProblem.num2;

    generateNumberPool();
    createNumberPool();
    createAreaGrid();

    
    totalDropZone.textContent = "?";
    totalDropZone.className = "total-drop-zone drop-zone";

    checkBtn.disabled = false;
}

// Initialize game
newProblem();
