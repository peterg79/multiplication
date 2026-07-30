// ==========================================
// GAME CONFIGURATION
// ==========================================
const CONFIG = {
  minVal: 1,           // Minimum factor
  maxVal: 12,          // Maximum factor
  penaltyWeight: 4.0,  // Exponential multiplier per score drop
  alertTimeout: 15000  // Alert visibility time
};

// Game State Variables
let num1 = 0;
let num2 = 0;
let score = 0;
let currentInput = "";
let feedbackTimeout = null;

// Track net score per distinct directional pair: { "3x6": 2, "6x3": -1, ... }
let pairStats = {};

// DOM Elements
const questionEl = document.getElementById('question');
const answerDisplayEl = document.getElementById('answer-display');
const scoreEl = document.getElementById('score');
const feedbackEl = document.getElementById('feedback');
const themeToggleBtn = document.getElementById('theme-toggle');

// Remove focus & prevent iOS sticky tap state
function releaseFocus() {
  if (document.activeElement && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

// Key format for directional pairs
function getPairKey(a, b) {
  return `${a}x${b}`;
}

// Load and Save Data with LocalStorage
function initData() {
  const savedScore = localStorage.getItem('multiplication_score');
  score = savedScore !== null ? parseInt(savedScore, 10) || 0 : 0;
  updateScoreDisplay();

  const savedStats = localStorage.getItem('multiplication_pair_stats');
  if (savedStats) {
    try {
      pairStats = JSON.parse(savedStats);
    } catch (e) {
      pairStats = {};
    }
  } else {
    pairStats = {};
  }
}

function updateScoreDisplay() {
  if (scoreEl) scoreEl.textContent = score;
}

function saveData() {
  localStorage.setItem('multiplication_score', score);
  localStorage.setItem('multiplication_pair_stats', JSON.stringify(pairStats));
}

// Update net score (+1 for correct, -1 for incorrect)
function updatePairStat(a, b, isCorrect) {
  const key = getPairKey(a, b);
  const currentStat = pairStats[key] || 0;
  pairStats[key] = currentStat + (isCorrect ? 1 : -1);
  saveData();
}

// Weighted selection: Exponential focus on missed pairs
function getWeightedRandomPair(min, max) {
  const pairs = [];
  let minStat = Infinity;

  for (let i = min; i <= max; i++) {
    for (let j = min; j <= max; j++) {
      const key = getPairKey(i, j);
      const stat = pairStats[key] || 0;
      if (stat < minStat) minStat = stat;
      pairs.push({ num1: i, num2: j, stat });
    }
  }

  const weightedPairs = pairs.map(p => {
    const scoreDiff = p.stat - minStat;
    const weight = Math.pow(CONFIG.penaltyWeight, -scoreDiff);
    return { ...p, weight };
  });

  const totalWeight = weightedPairs.reduce((sum, p) => sum + p.weight, 0);
  let randomThreshold = Math.random() * totalWeight;

  for (const pair of weightedPairs) {
    if (randomThreshold < pair.weight) {
      return { num1: pair.num1, num2: pair.num2 };
    }
    randomThreshold -= pair.weight;
  }

  return { num1: min, num2: min };
}

// Render Net Scores as a 2D Matrix in Console
function logStatsToConsole() {
  const matrix = {};

  for (let i = CONFIG.minVal; i <= CONFIG.maxVal; i++) {
    const rowHeader = `${i} ×`;
    matrix[rowHeader] = {};

    for (let j = CONFIG.minVal; j <= CONFIG.maxVal; j++) {
      const key = getPairKey(i, j);
      const colHeader = `× ${j}`;
      matrix[rowHeader][colHeader] = pairStats[key] || 0;
    }
  }

  console.group(`📊 Net Score Matrix (Row × Column) - ${new Date().toLocaleTimeString()}`);
  console.table(matrix);
  console.groupEnd();
}

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-bs-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', newTheme);
  setTheme(newTheme);
  releaseFocus();
}

// Generate Next Question
function generateQuestion() {
  const selectedPair = getWeightedRandomPair(CONFIG.minVal, CONFIG.maxVal);
  num1 = selectedPair.num1;
  num2 = selectedPair.num2;
  if (questionEl) questionEl.textContent = `${num1} × ${num2} = ?`;
  clearAnswer();
}

// Dialpad Handlers
function appendDigit(digit) {
  if (currentInput.length < 5) {
    currentInput += digit;
    updateDisplay();
  }
  releaseFocus();
}

function deleteLastDigit() {
  if (currentInput.length > 0) {
    currentInput = currentInput.slice(0, -1);
    updateDisplay();
  }
  releaseFocus();
}

function clearAnswer() {
  currentInput = "";
  updateDisplay();
  releaseFocus();
}

function updateDisplay() {
  if (answerDisplayEl) {
    answerDisplayEl.innerHTML = currentInput !== "" ? currentInput : "&nbsp;";
  }
}

// Feedback Banner
function showFeedback(text, isSuccess) {
  clearTimeout(feedbackTimeout);

  if (feedbackEl) {
    feedbackEl.textContent = text;
    feedbackEl.className = `alert py-1 px-3 m-0 fw-bold small ${isSuccess ? 'alert-success' : 'alert-danger'}`;

    feedbackTimeout = setTimeout(() => {
      feedbackEl.className = 'alert py-1 px-3 m-0 fw-bold small hidden';
    }, CONFIG.alertTimeout);
  }
}

// Check Answer
function submitAnswer() {
  if (currentInput === "") return;

  const userAnswer = parseInt(currentInput, 10);
  const correctAnswer = num1 * num2;

  if (userAnswer === correctAnswer) {
    score += 1;
    updateScoreDisplay();
    updatePairStat(num1, num2, true);
    showFeedback(`🎉 Correct! ${num1} × ${num2} = ${correctAnswer}`, true);
  } else {
    updatePairStat(num1, num2, false);
    showFeedback(`❌ Incorrect! ${num1} × ${num2} = ${correctAnswer}`, false);
  }

  logStatsToConsole();
  generateQuestion();
  releaseFocus();
}

// Reset Game State
function resetProgress() {
  localStorage.clear();
  score = 0;
  pairStats = {};
  updateScoreDisplay();
  if (feedbackEl) feedbackEl.className = 'alert py-1 px-3 m-0 fw-bold small hidden';
  initTheme();
  console.clear();
  console.log("All localStorage data cleared and progress reset.");
  generateQuestion();
}

// Attach Fast Pointer Handlers for Zero-Lag Mobile Safari Taps
function bindFastTouchEvents() {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
      // Prevents ghost click triggering twice
      e.preventDefault();
      btn.click();
    }, { passive: false });
  });
}

// Keyboard Support
document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') {
    appendDigit(e.key);
  } else if (e.key === 'Backspace') {
    deleteLastDigit();
  } else if (e.key === 'Escape') {
    clearAnswer();
  } else if (e.key === 'Enter') {
    submitAnswer();
  }
});

// Initialize App
initTheme();
initData();
generateQuestion();
bindFastTouchEvents();