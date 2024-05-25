// Initialize the map
var map = new maptalks.Map('map', {
    center: [15.2663, -4.4419], // Coordinates for Kinshasa
    zoom: 14.1,
    minZoom: 14, // Minimum zoom level
    centerCross: true,
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
document.querySelector('.button-container').innerHTML += '<button class="icon-button" id="recenter-button"><i class="fas fa-crosshairs"></i></button>';

// Recenter map function
document.getElementById('recenter-button').addEventListener('click', function() {
    map.setCenter([15.2663, -4.4419]);
    map.setZoom(14.2);
});
