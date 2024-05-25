// Initialize the map
var map = new maptalks.Map('map', {
    center: [15.2663, -4.4419], // Coordinates for Kinshasa
    zoom: 14.1,
    minZoom: 14, // Minimum zoom level
    centerCross: true,
    dragRotate: false, //disable drag rotation
    baseLayer: new maptalks.TileLayer('base', {
        urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors'
    }),
    layers: [new maptalks.VectorLayer('v')]
});

// Set map extent
var extent = map.getExtent();
map.setMaxExtent(extent);

// Set zoom level
map.setZoom(map.getZoom() - 2, { animation: false });

// Add a polygon to visualize the extent
map.getLayer('v').addGeometry(
    new maptalks.Polygon(extent.toArray(), {
        symbol: { 'polygonOpacity': 0, 'lineWidth': 5 }
    })
);

// Allow zooming in but not zooming out
map.setMinZoom(14);

// Simulated heat map data points for bad AQI
var data = [
    [15.2663, -4.4419, 10],
    [15.2683, -4.4429, 9],
    [15.2753, -4.4499, 4],
    [15.2763, -4.4509, 8],
    [15.2773, -4.4519, 9],
    [15.2783, -4.4529, 10],
    [15.2833, -4.4579, 9],
    [15.2843, -4.4589, 6],
    [15.2853, -4.4599, 7],
    [15.2863, -4.4609, 5],
    [15.2600, -4.4400, 8],
    [15.2650, -4.4410, 7],
    [15.2640, -4.4420, 9],
    [15.2610, -4.4450, 8],
    [15.2600, -4.4460, 7],
    [15.2590, -4.4470, 9],
    [15.2580, -4.4480, 6],
    [15.2570, -4.4490, 5],
    [15.2530, -4.4530, 6],
    [15.2520, -4.4540, 5],
    [15.2510, -4.4550, 8],
    [15.2500, -4.4560, 7]
];

// Create the heat map layer and add it to the map
var heatlayer = new maptalks.HeatLayer('heat', data, {
    'heatValueScale': 7,
    'forceRenderOnRotating': true,
    'forceRenderOnMoving': true,
    'forceRenderOnZooming': true,
    'radius': 25,
    'max': 10,
    'blur': 20,
    'gradient': {
        0.0: 'blue',
        0.5: 'lime',
        1.0: 'red'
    }
}).addTo(map);

// Log the heat layer to the console to ensure it was added
console.log("Heat layer added:", heatlayer);

// Add a recenter button
document.querySelector('.button-container').innerHTML += '<button class="recenter-button">Recenter Map</button>';

// Recenter map function
document.querySelector('.recenter-button').addEventListener('click', function() {
    map.setCenter([15.2663, -4.4419]);
    map.setZoom(14.1);
});

// Initial values
let budget = 10000;
let aqi = 180;
let happiness = 20;
let score = 0;

// Previous values of sliders
let prevValues = {
    wind: 0,
    solar: 0,
    factory: 0
};

// Function to update budget and AQI
function updateInfo(type, newValue) {
    const budgetElement = document.querySelector('.info-container .info:nth-child(1)');
    const aqiElement = document.querySelector('.info-container .info:nth-child(2)');
    const happinessElement = document.getElementById('happiness-indicator');

    const budgetDecrease = { wind: 100, solar: 150, factory: 200 };
    const aqiDecrease = { wind: 1, solar: 2, factory: 3 };
    const happinessChange = { wind: 1, solar: 1, factory: -2 };

    // Calculate the difference
    const diff = newValue - prevValues[type];

    // Update budget and AQI based on the difference
    budget -= budgetDecrease[type] * diff;
    aqi -= aqiDecrease[type] * diff;
    happiness += happinessChange[type] * diff;

    // Cap happiness between 0 and 100
    happiness = Math.max(0, Math.min(100, happiness));

    // Update the previous value
    prevValues[type] = newValue;

    // Update the UI
    budgetElement.innerHTML = `<span class="info-title">Budget:</span> $${budget}`;
    aqiElement.innerHTML = `<span class="info-title">AQI:</span> ${aqi}`;

    // Update happiness indicator
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
    happinessElement.innerHTML = `<i class="${smileyClass}"></i>`;
}

// Function to calculate score
function calculateScore() {
    const scoreElement = document.getElementById('score');
    const initialBudget = 10000;
    const initialAQI = 180;
    const initialHappiness = 20;

    score = Math.max(0, Math.round((initialBudget - budget) * 0.1 + (initialAQI - aqi) * 2 + (happiness - initialHappiness) * 5));
    scoreElement.textContent = score;
}

// Slider event listeners
document.getElementById('wind-slider').addEventListener('input', function() {
    const value = parseInt(this.value, 10);
    document.getElementById('wind-value').textContent = `(${value})`;
    updateInfo('wind', value);
});

document.getElementById('solar-slider').addEventListener('input', function() {
    const value = parseInt(this.value, 10);
    document.getElementById('solar-value').textContent = `(${value})`;
    updateInfo('solar', value);
});

document.getElementById('factory-slider').addEventListener('input', function() {
    const value = parseInt(this.value, 10);
    document.getElementById('factory-value').textContent = `(${value})`;
    updateInfo('factory', value);
});

// Calculate score button event listener
document.querySelector('.calculate-score-button').addEventListener('click', calculateScore);
