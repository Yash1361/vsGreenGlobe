document.addEventListener("DOMContentLoaded", function () {
    // Initialize the map
    var map = L.map('map').setView([25.417, 86.129], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Define high AQI areas for the heatmap with higher intensity for darker color
    var heatData = [
        [25.420, 86.130, 4], // [lat, lon, intensity]
        [25.415, 86.135, 5.6],
        [25.418, 86.125, 7]
    ];

    // Create a heatmap layer with adjusted options
    var heat = L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
            0.4: 'blue',
            0.65: 'lime',
            1: 'red'
        }
    }).addTo(map);

    // Define the city borders
    var cityBorders = [
        [25.423, 86.123],
        [25.427, 86.133],
        [25.417, 86.140],
        [25.407, 86.135],
        [25.413, 86.125]
    ];

    // Add a polygon to outline the city borders
    var cityPolygon = L.polygon(cityBorders, {
        color: 'yellow',
        weight: 2
    }).addTo(map);

    // Define the map bounds for the mask
    var mapBounds = [
        [-90, -180],
        [90, 180]
    ];

    // Create a mask layer
    var maskLayer = L.layerGroup();

    // Create the inverted polygon for the mask
    var outerBounds = [
        [-90, -180],
        [90, -180],
        [90, 180],
        [-90, 180]
    ];

    var maskPolygon = L.polygon([outerBounds, cityBorders], {
        color: 'black',
        fillColor: 'black',
        fillOpacity: 0.5,
        opacity: 0
    }).addTo(maskLayer);

    // Add the mask layer to the map
    maskLayer.addTo(map);

    // Budget management
    var budget = 10000;

    function updateBudget() {
        document.getElementById('budget').textContent = `$${budget}`;
    }

    function updateActionCount(id, count) {
        document.getElementById(id).textContent = count;
    }

    function handleRangeChange(event, actionCost) {
        var count = event.target.value;
        var actionId = event.target.id;
        var totalCost = count * actionCost;

        budget = 10000 - totalCost;
        updateBudget();
        updateActionCount(actionId + '-count', count);
    }

    document.getElementById('windmills').addEventListener('input', function (event) {
        handleRangeChange(event, 100);
    });

    document.getElementById('solar-panels').addEventListener('input', function (event) {
        handleRangeChange(event, 150);
    });

    document.getElementById('factories').addEventListener('input', function (event) {
        handleRangeChange(event, 200);
    });

    document.getElementById('policies').addEventListener('input', function (event) {
        handleRangeChange(event, 50);
    });

    updateBudget();
});
