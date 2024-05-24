document.addEventListener('DOMContentLoaded', () => {
    const windmillSlider = document.getElementById('windmills');
    const solarSlider = document.getElementById('solar-panels');
    const factorySlider = document.getElementById('factories');
    const policySlider = document.getElementById('policies');
    const budgetDisplay = document.getElementById('budget');

    const windmillCount = document.getElementById('windmill-count');
    const solarCount = document.getElementById('solar-count');
    const factoryCount = document.getElementById('factory-count');
    const policyCount = document.getElementById('policy-count');

    let budget = 10000;

    const updateBudget = () => {
        const totalSpent = windmillSlider.valueAsNumber + solarSlider.valueAsNumber + factorySlider.valueAsNumber + policySlider.valueAsNumber;
        budgetDisplay.textContent = `$${(budget - totalSpent).toFixed(2)}`;
    };

    const updateCounts = () => {
        windmillCount.textContent = windmillSlider.value;
        solarCount.textContent = solarSlider.value;
        factoryCount.textContent = factorySlider.value;
        policyCount.textContent = policySlider.value;
    };

    windmillSlider.addEventListener('input', () => {
        updateBudget();
        updateCounts();
    });

    solarSlider.addEventListener('input', () => {
        updateBudget();
        updateCounts();
    });

    factorySlider.addEventListener('input', () => {
        updateBudget();
        updateCounts();
    });

    policySlider.addEventListener('input', () => {
        updateBudget();
        updateCounts();
    });

    // Initialize the map
    const map = L.map('map').setView([25.4174, 86.1292], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add red cloud overlay (simplified example)
    const redCloudOverlay = L.circle([25.4174, 86.1292], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 1000
    }).addTo(map);
});
