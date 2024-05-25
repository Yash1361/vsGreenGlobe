// Initialize the map
var map = new maptalks.Map('map', {
    center: [15.2663, -4.4419],
    zoom: 14.1,
    minZoom: 14,
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

// Sample heat map data points
var data = [
    [15.2663, -4.4419],
    [15.2683, -4.4429],
    [15.2693, -4.4439],
    [15.2703, -4.4449],
    [15.2713, -4.4459]
];

// Create the heat map layer and add it to the map
var heatlayer = new maptalks.HeatLayer('heat', data, {
    'heatValueScale': 7,
    'forceRenderOnRotating': true,
    'forceRenderOnMoving': true,
    'forceRenderOnZooming': true,
    'radius': 15
}).addTo(map);

// Log the heat layer to the console to ensure it was added
console.log("Heat layer added:", heatlayer);
