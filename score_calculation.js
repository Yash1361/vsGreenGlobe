// score_calculation.js
let moneySpent = 0;
let aqi = 180;
let happiness = 20;
let score = 0;

function calculateScore() {
    const scoreElement = document.getElementById('score');
    const initialMoneySpent = 0;
    const initialAQI = 180;
    const initialHappiness = 20;

    score = Math.max(0, Math.round((initialMoneySpent - moneySpent) * 0.1 + (initialAQI - aqi) * 2 + (happiness - initialHappiness) * 5));
    scoreElement.textContent = score;
}

document.querySelector('.calculate-score-button').addEventListener('click', calculateScore);
