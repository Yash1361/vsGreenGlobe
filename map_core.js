// map_core.js
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'map3.png'; // Update the path to your image

let pollutionClouds = [
    { x: 520, y: 280, radius: 170, opacity: 0.68 },
    { x: 410, y: 650, radius: 170, opacity: 0.86 },
    { x: 260, y: 430, radius: 130, opacity: 0.56 },
    { x: 520, y: 470, radius: 90, opacity: 0.56 }
];

mapImage.onload = () => {
    // Set the canvas dimensions to match the image dimensions
    canvas.width = mapImage.width;
    canvas.height = mapImage.height;

    drawBackground();
    drawMapWithGradientOverlay();
    animatePollutionClouds(); // Start animation after loading the image
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
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0.01, canvas.width / 2, canvas.height / 2, 0.02);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)'); // Dark red
    gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.4)'); // Medium red
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0.1)'); // Light red

    // Apply the original gradient overlay only within the map area
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pollution clouds
    pollutionClouds.forEach(cloud => drawPollutionCloud(cloud));
    
    // Reset the composite operation
    ctx.globalCompositeOperation = 'source-over';
}

function drawPollutionCloud({ x, y, radius, opacity }) {
    const gradient = ctx.createRadialGradient(x, y, radius / 2, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 0, 0, ${opacity})`);
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function animatePollutionClouds() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawMapWithGradientOverlay();
    
    pollutionClouds.forEach((cloud, index) => {
        let targetRadius = cloud.radius;
        let targetOpacity = cloud.opacity;
        
        if ((index === 0) || (index === 1) || (index === 2)) { // Biggest and darkest cloud
            const reductionFactor = Math.max((aqi - 40) / (180 - 40), 0); // Scale from 0 to 1
            targetRadius = 170 * reductionFactor;
            targetOpacity = 0.86 * reductionFactor;
        } else { // Smaller clouds can disappear earlier
            const reductionFactor = Math.max((aqi - 40) / (180 - 40), 0);
            targetRadius = cloud.radius * reductionFactor;
            targetOpacity = cloud.opacity * reductionFactor;
        }

        cloud.radius += (targetRadius - cloud.radius) * 0.1;
        cloud.opacity += (targetOpacity - cloud.opacity) * 0.1;
    });

    requestAnimationFrame(animatePollutionClouds);
}
