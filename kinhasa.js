// Initialize the map
var map = new maptalks.Map('map', {
    center: [15.2663, -4.4419],
    zoom: 14.1,
    minZoom: 14,
    centerCross: true,
    dragRotate: false,
    baseLayer: new maptalks.TileLayer('base', {
        urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors'
    }),
    layers: [new maptalks.VectorLayer('v')]
});

var extent = map.getExtent();
map.setMaxExtent(extent);
map.setZoom(map.getZoom() - 2, { animation: false });
map.getLayer('v').addGeometry(
    new maptalks.Polygon(extent.toArray(), {
        symbol: { 'polygonOpacity': 0, 'lineWidth': 5 }
    })
);
map.setMinZoom(14);

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

document.querySelector('.button-container').innerHTML += '<button class="recenter-button">Recenter Map</button>';

document.querySelector('.recenter-button').addEventListener('click', function() {
    map.setCenter([15.2663, -4.4419]);
    map.setZoom(14.1);
});

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
        const response = await fetch('/path/to/your/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: policyName, description: policyDescription })
        });

        const result = await response.json();
        policyResult.textContent = `Policy "${policyName}" implemented: ${result.message}`;

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

viewPoliciesButton.addEventListener('click', () => {
    if (policiesList.children.length === 0) {
        alert("No policies have been added.");
    } else {
        policiesList.style.display = policiesList.style.display === 'none' ? 'flex' : 'none';
    }
});
