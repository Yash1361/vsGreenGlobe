const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'map3.png'; // Update the path to your image

mapImage.onload = () => {
    // Set the canvas dimensions to match the image dimensions
    canvas.width = mapImage.width;
    canvas.height = mapImage.height;

    drawBackground();
    drawMapWithGradientOverlay();
};

function drawBackground() {
    // Draw black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawMapWithGradientOverlay() {
    // Draw the map image first
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    // Create the original gradient overlay
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 50, canvas.width / 2, canvas.height / 2, 300);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)'); // Dark red
    gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.4)'); // Medium red
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0.1)'); // Light red

    // Apply the original gradient overlay only within the map area
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add additional circles above and below the original gradient
    drawPollutionCloud(canvas.width / 1.7, canvas.height / 4, 170, 0.5);
    drawPollutionCloud(canvas.width / 2, canvas.height * 2 / 2.5, 150, 0.76);

    // Reset the composite operation
    ctx.globalCompositeOperation = 'source-over';
}

function drawPollutionCloud(x, y, radius, opacity) {
    const gradient = ctx.createRadialGradient(x, y, radius / 2, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 0, 0, ${opacity})`);
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

let budget = 10000;
let aqi = 180;
let happiness = 20;
let score = 0;

function calculateScore() {
    const scoreElement = document.getElementById('score');
    const initialBudget = 10000;
    const initialAQI = 180;
    const initialHappiness = 20;

    score = Math.max(0, Math.round((initialBudget - budget) * 0.1 + (initialAQI - aqi) * 2 + (happiness - initialHappiness) * 5));
    scoreElement.textContent = score;
}

document.querySelector('.calculate-score-button').addEventListener('click', calculateScore);

const implementPolicyButton = document.getElementById('implement-policy-button');
const policyInput = document.getElementById('policy-input');
const submitPolicyButton = document.getElementById('submit-policy-button');
const clearPolicyButton = document.getElementById('clear-policy-button');
const policyResult = document.getElementById('policy-result');
const viewPoliciesButton = document.getElementById('view-policies-button');
const policiesList = document.getElementById('policies-list');

implementPolicyButton.addEventListener('click', () => {
    if (policyInput.style.display === 'flex') {
        policyInput.style.display = 'none';
    } else {
        policyInput.style.display = 'flex';
    }
});

submitPolicyButton.addEventListener('click', async () => {
    const policyName = document.getElementById('policy-name').value;
    const policyDescription = document.getElementById('policy-description').value;

    if (policyName && policyDescription) {
        const response = await fetch('http://localhost:3000/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ policyName, policyDescription })
        });

        const result = await response.json();
        policyResult.textContent = result.text;

        const policyItem = document.createElement('div');
        policyItem.className = 'policy-item';
        policyItem.textContent = `${policyName}: ${policyDescription}`;
        policiesList.appendChild(policyItem);
        
        let currentCount = policiesList.children.length;
        viewPoliciesButton.textContent = `Added Policies (${currentCount}/5)`;
        policyInput.style.display = 'none';

        if (currentCount >= 5) {
            implementPolicyButton.disabled = true;
            submitPolicyButton.disabled = true;
        }
    }
});

clearPolicyButton.addEventListener('click', () => {
    document.getElementById('policy-name').value = '';
    document.getElementById('policy-description').value = '';
});

viewPoliciesButton.addEventListener('click', () => {
    if (policiesList.children.length === 0) {
        alert("No policies have been added.");
    } else {
        policiesList.style.display = policiesList.style.display === 'none' ? 'flex' : 'none';
    }
});
