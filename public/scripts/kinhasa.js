let username = new URLSearchParams(window.location.search).get('username');

if (!username) {
    alert('Username is missing!');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');

    const mapImage = new Image();
    mapImage.src = '/map3.png'; // Update the path to your image

    let pollutionClouds = [
        { x: 520, y: 280, radius: 170, opacity: 0.68 },
        { x: 410, y: 650, radius: 170, opacity: 0.86 },
        { x: 260, y: 430, radius: 130, opacity: 0.56 },
        { x: 520, y: 470, radius: 90, opacity: 0.56 }
    ];

    mapImage.onload = async () => {
        // Set the canvas dimensions to match the image dimensions
        canvas.width = mapImage.width;
        canvas.height = mapImage.height;

        drawBackground();
        drawMapWithGradientOverlay();
        animatePollutionClouds(); // Start animation after loading the image

        await initializeUserPolicies(); // Initialize user policies and states after map loads
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

    let moneySpent = 0;
    let aqi = 180;
    let happiness = 20;
    let score = 0;
    let rank = null;

    function calculateScore() {
        const scoreElement = document.getElementById('score');
        if (moneySpent >= 1e9) {
            score = Math.round((aqi * happiness * 1000000000) / (moneySpent));
        } else {
            score = Math.round((aqi * happiness * 1000000) / (moneySpent));
        }
        scoreElement.textContent = score;
    }

    const implementPolicyButton = document.getElementById('implement-policy-button');
    const policyInput = document.getElementById('policy-input');
    const submitPolicyButton = document.getElementById('submit-policy-button');
    const clearPolicyButton = document.getElementById('clear-policy-button');
    const policyResult = document.getElementById('policy-result');
    const loadingSpinner = document.getElementById('loading-spinner');
    const viewPoliciesButton = document.getElementById('view-policies-button');
    const policiesList = document.getElementById('policies-list');
    const leaderboardRankElement = document.getElementById('leaderboard-rank');

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

        if (policyName && policyDescription && username) {
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

            // Submit policy to leaderboard
            submitPolicyToLeaderboard(policyName, policyDescription, score, username);
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
            let moneySpentDisplay;
            if (moneySpent >= 1e9) {
                moneySpentDisplay = `$${(moneySpent / 1e9).toFixed(2)} billion`;
            } else {
                moneySpentDisplay = `$${(moneySpent / 1e6).toFixed(2)} million`;
            }
            document.querySelector('.info-container .info:nth-child(1)').innerHTML = `<span class="info-title">Money Spent:</span> ${moneySpentDisplay}`;
        }

        if (aqiMatch) {
            const aqiValue = parseFloat(aqiMatch[1].replace('%', '').trim());
            console.log("AQI Value:", aqiValue);
            if (aqiMatch[1].includes('+')) {
                console.log("+ found in aqi")
                aqi *= (1 - (aqiValue) / 100);
            } else if (aqiMatch[1].includes('-')) {
                console.log("- found in aqi")
                aqi *= (1 - (-(aqiValue) / 100));
            }
            console.log("Updated AQI:", aqi);
            document.querySelector('.info-container .info:nth-child(2)').innerHTML = `<span class="info-title">AQI:</span> ${aqi.toFixed(2)}`;

            // Animate pollution clouds based on updated AQI
            animatePollutionClouds();
        }

        if (happinessMatch) {
            const happinessValue = parseFloat(happinessMatch[1].replace('%', '').trim());
            console.log("Happiness Value:", happinessValue);
            if (happinessMatch[1].includes('+')) {
                console.log("+ found in happiness")
                happiness += happinessValue;
            } else if (happinessMatch[1].includes('-')) {
                console.log("- found in happiness")
                happiness += happinessValue;
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

        // Calculate score automatically whenever info changes
        calculateScore();
    }

    class Particle {
        constructor(ctx, x, y) {
          this.ctx = ctx;
          this.x = x;
          this.y = y;
          this.size = Math.random() * 5 + 1;
          this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
          this.velocityX = (Math.random() - 0.5) * 10;
          this.velocityY = (Math.random() - 0.5) * 10;
          this.opacity = 1;
        }
      
        update() {
          this.x += this.velocityX;
          this.y += this.velocityY;
          this.opacity -= 0.02;
        }
      
        draw() {
          this.ctx.globalAlpha = this.opacity;
          this.ctx.fillStyle = this.color;
          this.ctx.beginPath();
          this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.globalAlpha = 1;
        }
      }
      
      function showParticleBurst() {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = 0;
        canvas.style.left = 0;
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
      
        const ctx = canvas.getContext('2d');
        const particles = [];
      
        for (let i = 0; i < 600; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          particles.push(new Particle(ctx, x, y));
        }
      
        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
      
          particles.forEach((particle, index) => {
            if (particle.opacity <= 0) {
              particles.splice(index, 1);
            } else {
              particle.update();
              particle.draw();
            }
          });
      
          if (particles.length > 0) {
            requestAnimationFrame(animate);
          } else {
            document.body.removeChild(canvas);
          }
        }
      
        animate();
      }
      
      function getPlaceSuffix(place) {
        if (place % 10 === 1 && place % 100 !== 11) {
          return `${place}st`;
        } else if (place % 10 === 2 && place % 100 !== 12) {
          return `${place}nd`;
        } else if (place % 10 === 3 && place % 100 !== 13) {
          return `${place}rd`;
        } else {
          return `${place}th`;
        }
      }
      
      function showCongratsModal(place) {
        const placeWithSuffix = getPlaceSuffix(place);
        const congratsModal = document.createElement('div');
        congratsModal.className = 'congrats-modal';
        congratsModal.innerHTML = `
          <div class="congrats-modal-content">
            <h2>Congratulations!</h2>
            <p>You got ${placeWithSuffix} place on the leaderboard!</p>
            <button id="check-it-out">Check it out!!</button>
            <button id="maybe-later">Maybe Later</button>
          </div>
        `;
        document.body.appendChild(congratsModal);
      
        document.getElementById('check-it-out').addEventListener('click', () => {
          window.location.href = 'leaderboard.html';
        });
      
        document.getElementById('maybe-later').addEventListener('click', () => {
          congratsModal.remove();
        });
      }
      
      async function submitPolicyToLeaderboard(title, description, score, username) {
        const response = await fetch('http://localhost:3000/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title, description, score, username, moneySpent, aqi, happiness })
        });
      
        if (response.ok) {
          const result = await response.json();
          const place = result.place; // Assuming the server responds with the place
          if (place) {
            showParticleBurst();
            showCongratsModal(place); // Show modal immediately after burst
          }
          console.log('Policy submitted to leaderboard successfully!');
        } else {
          console.error('Error submitting policy to leaderboard.');
        }
      }

    // Function to fetch user policies and initialize their states
    async function fetchUserPolicies(username) {
        const response = await fetch('http://localhost:3000/user-policies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.error('Error fetching user policies');
            return null;
        }
    }

    async function initializeUserPolicies() {
        const userPolicies = await fetchUserPolicies(username);

        if (userPolicies) {
            moneySpent = userPolicies.moneySpent || 0;
            aqi = userPolicies.aqi || 180;
            happiness = userPolicies.happiness || 20;
            score = userPolicies.totalScore || 0;
            rank = userPolicies.rank || null;

            // Update the UI with user's states
            document.querySelector('.info-container .info:nth-child(1)').innerHTML = `<span class="info-title">Money Spent:</span> $${(moneySpent / 1e6).toFixed(2)} million`;
            document.querySelector('.info-container .info:nth-child(2)').innerHTML = `<span class="info-title">AQI:</span> ${aqi.toFixed(2)}`;
            document.getElementById('happiness-indicator').innerHTML = `<i class="${getHappinessIconClass(happiness)}"></i>`;
            document.getElementById('score').textContent = score;

            // Clear the policies list to avoid duplication
            policiesList.innerHTML = '';

            // Display the user's existing policies
            userPolicies.policies.forEach(policy => {
                const policyItem = document.createElement('div');
                policyItem.className = 'policy-item';
                policyItem.textContent = `${policy.title}: ${policy.description}`;
                policiesList.appendChild(policyItem);
            });

            let currentCount = policiesList.children.length;
            viewPoliciesButton.textContent = `Added Policies (${currentCount}/5)`;

            if (currentCount >= 5) {
                implementPolicyButton.disabled = true;
                submitPolicyButton.disabled = true;
            }

            // Update leaderboard rank
            const leaderboardRankElement = document.getElementById('leaderboard-rank');
            if (rank && rank <= 10) {
                 leaderboardRankElement.textContent = `${rank}`;
            } else {
                 leaderboardRankElement.textContent = `You are not on the leaderboard yet.`;
            }

        }
    }

    function getHappinessIconClass(happiness) {
        if (happiness <= 20) {
            return 'fas fa-angry'; // Angry face
        } else if (happiness < 40) {
            return 'fas fa-frown'; // Semi-angry face
        } else if (happiness < 60) {
            return 'fas fa-meh'; // Neutral face
        } else if (happiness < 80) {
            return 'fas fa-smile'; // Semi-happy face
        } else {
            return 'fas fa-laugh'; // Happy face
        }
    }

    // Initialize user policies and states on page load
    initializeUserPolicies();
});
