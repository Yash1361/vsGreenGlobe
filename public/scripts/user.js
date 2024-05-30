document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');

    if (!username) {
        console.error('Username not found in URL parameters.');
        return;
    }

    fetch(`/user-policies`, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); 
    })
    .then(data => {
        const userCard = document.querySelector('.info-card.primary');

        // Update user information
        document.getElementById('username').textContent = data.username || 'N/A';
        document.getElementById('rank').textContent = data.rank || 'N/A';
        document.getElementById('totalScore').textContent = data.totalScore || '0';
        document.getElementById('moneySpent').textContent = (data.moneySpent || 0).toLocaleString('en-US');

        // Add badge based on rank
        const rank = data.rank;
        let badge = document.createElement('i');
        badge.classList.add('badge', 'fas', 'fa-medal'); // Ensure all relevant classes are added
        
        if (rank === 1) {
            badge.classList.add('gold');
        } else if (rank === 2) {
            badge.classList.add('silver');
        } else if (rank === 3) {
            badge.classList.add('bronze');
        }

        if (rank >= 1 && rank <= 3) {
            userCard.appendChild(badge);
        }

        // Populate policies list with animations
        const policiesList = document.getElementById('policiesList');
        if (data.policies && Array.isArray(data.policies)) {
            data.policies.forEach(policy => {
                const li = document.createElement('li');
                li.textContent = `${policy.title}: ${policy.description} (Score: ${policy.score})`;
                policiesList.appendChild(li);
                animateNewRow(li); // Animate new row
            });
        } else {
            console.warn("Warning: 'data.policies' is not an array. Check backend response.");
        }
  
        // Populate voted policies list with animations
        const votesList = document.getElementById('votesList');
        const myUsername = urlParams.get('username'); // Get the currently logged-in user's username

        if (data.policies && Array.isArray(data.policies)) {
            data.policies.forEach(policy => {
                // Check if the logged-in user has upvoted this policy
                if (policy.votes && policy.votes[myUsername] === 1) { 
                    const li = document.createElement('li');
                    li.textContent = `${policy.title}`;
                    votesList.appendChild(li);
                    animateNewRow(li); // Animate new row
                }
            });

            // Handle the case where the user hasn't upvoted any policies
            if (votesList.children.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No policies upvoted yet.';
                votesList.appendChild(li);
                animateNewRow(li); // Animate new row
            }

        } else {
            console.warn("Warning: 'data.policies' is not an array. Check backend response.");
        }

        // --- AQI Chart ---
        const ctxAQI = document.getElementById('aqiChart').getContext('2d'); // Create a separate canvas for AQI
        new Chart(ctxAQI, {
            type: 'bar', 
            data: {
                labels: ['AQI'],
                datasets: [{
                    label: 'AQI (out of 180)', 
                    data: [data.aqi || 0], 
                    backgroundColor: ['rgba(54, 162, 235, 0.8)'],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 180, // Or 100 for the Happiness chart
                    title: {
                      display: true,
                      text: 'AQI'  // Or 'Happiness' for the Happiness chart
                    }
                  }
                },
                responsive: true,     // Make the chart responsive to container size changes
                maintainAspectRatio: false  // Allow the chart's aspect ratio to adjust 
              }
        });

        // --- Happiness Chart ---
        const ctxHappiness = document.getElementById('happinessChart').getContext('2d'); // Create a separate canvas for Happiness
        new Chart(ctxHappiness, {
            type: 'bar', 
            data: {
                labels: ['Happiness'],
                datasets: [{
                    label: 'Happiness (out of 100)',
                    data: [data.happiness || 0],
                    backgroundColor: ['rgba(255, 99, 132, 0.8)'],
                    borderWidth: 1
                }]
            },
            options: { 
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100, 
                        title: { 
                            display: true,
                            text: 'Happiness'
                        }
                    }
                },
                responsive: true,     // Make the chart responsive to container size changes
                maintainAspectRatio: false
            }
        }); 

    })
    .catch(error => {
        console.error('Error fetching or processing user data:', error);
    });
    
    // --- GSAP Animations ---
    // Animate User Card on Load
    gsap.from('.info-card.primary', { 
        y: -50, 
        opacity: 0, 
        duration: 1, 
        ease: 'back.out(1.7)' 
    });

    // Animate Charts on Load (Staggered)
    gsap.from('.chart-container canvas', {
        scale: 0.8, 
        opacity: 0, 
        duration: 1.2, 
        stagger: 0.2, // Delay between each chart animation
        ease: 'elastic.out(1, 0.75)' 
    });

    // Function to create a staggered animation for new rows
    function animateNewRow(row) {
        gsap.fromTo(
            row,
            { opacity: 0, y: 100 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "back.out(1.7)",
                scrollTrigger: {
                    trigger: row,
                    start: "top 100%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }
});
