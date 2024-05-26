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

const implementPolicyButton = document.getElementById('implement-policy-button');
const policyInput = document.getElementById('policy-input');
const submitPolicyButton = document.getElementById('submit-policy-button');
const clearPolicyButton = document.getElementById('clear-policy-button');
const policyResult = document.getElementById('policy-result');
const loadingSpinner = document.getElementById('loading-spinner');
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
        loadingSpinner.style.display = 'block';
        policyResult.style.display = 'none';

        const response = await fetch('http://localhost:3000/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ policyName, policyDescription })
        });

        const result = await response.json();
        loadingSpinner.style.display = 'none';
        policyResult.style.display = 'block';
        policyResult.innerHTML = marked.parse(result.text);

        // Extract and update money spent, AQI, and happiness
        updateInfoFromResult(marked.parse(result.text));

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

function updateInfoFromResult(text) {
    console.log("AI Generated Text:", text);

    let moneySpentMatch = text.match(/Money spent: \$(\d+(\.\d+)?\s*(million|billion))/i);
    let aqiMatch = text.match(/AQI:\s*([+-]\d+(\.\d+)?%)/i);
    let happinessMatch = text.match(/Happiness:\s*([+-]\d+(\.\d+)?%)/i);

    // If no match found, check for <strong> tags
    if (!moneySpentMatch) {
        moneySpentMatch = text.match(/<strong>Money spent:<\/strong>\s*\$(\d+(\.\d+)?\s*(million|billion))/i);
    }
    if (!aqiMatch) {
        aqiMatch = text.match(/<strong>AQI:<\/strong>\s*([+-]\d+(\.\d+)?%)/i);
    }
    if (!happinessMatch) {
        happinessMatch = text.match(/<strong>Happiness:<\/strong>\s*([+-]\d+(\.\d+)?%)/i);
    }

    console.log("Money Spent Match:", moneySpentMatch);
    console.log("AQI Match:", aqiMatch);
    console.log("Happiness Match:", happinessMatch);

    if (moneySpentMatch) {
        const moneySpentValue = parseFloat(moneySpentMatch[1].replace(/(million|billion)/i, '').trim());
        const multiplier = moneySpentMatch[3].toLowerCase() === 'million' ? 1e6 : 1e9;
        moneySpent += moneySpentValue * multiplier;
        console.log("Updated Money Spent:", moneySpent);
        document.querySelector('.info-container .info:nth-child(1)').innerHTML = `<span class="info-title">Money Spent:</span> $${(moneySpent / 1e9).toFixed(2)} billion`;
    }

    if (aqiMatch) {
        const aqiValue = parseFloat(aqiMatch[1].replace('%', '').trim());
        if (aqiMatch[1].includes('+')) {
            aqi *= (1 + aqiValue / 100);
        } else {
            aqi *= (1 - aqiValue / 100);
        }
        console.log("Updated AQI:", aqi);
        document.querySelector('.info-container .info:nth-child(2)').innerHTML = `<span class="info-title">AQI:</span> ${aqi.toFixed(2)}`;
    }

    if (happinessMatch) {
        const happinessValue = parseFloat(happinessMatch[1].replace('%', '').trim());
        if (happinessMatch[1].includes('+')) {
            happiness *= (1 + happinessValue / 100);
        } else {
            happiness *= (1 - happinessValue / 100);
        }
        console.log("Updated Happiness:", happiness);
        
        let smileyClass;
        if (happiness <= 20) {
            smileyClass = 'fas fa-angry'; // Angry face
        } else if (happiness < 40) {
            smileyClass = 'fas fa-frown'; // Semi-angry face
        } else if (happiness < 60) {
            smileyClass = 'fas fa-meh'; // Neutral face
        } else if (happiness < 80) {
            smileyClass = 'fas fa-smile'; // Semi-happy face
        } else {
            smileyClass = 'fas fa-laugh'; // Happy face
        }
        document.getElementById('happiness-indicator').innerHTML = `<i class="${smileyClass}"></i>`;
    }
}
