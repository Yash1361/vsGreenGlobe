document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');

    if (!username) {
        console.error('Username not found in URL parameters.');
        // Handle the case where username is not available, 
        // e.g., redirect to an error page or display a message
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
        document.getElementById('username').textContent = data.username || 'N/A';
        document.getElementById('rank').textContent = data.rank || 'N/A';
        document.getElementById('totalScore').textContent = data.totalScore || '0';
        document.getElementById('moneySpent').textContent = (data.moneySpent || 0).toLocaleString('en-US'); 

        const policiesList = document.getElementById('policiesList');
        if (data.policies && Array.isArray(data.policies)) {
            data.policies.forEach(policy => {
                const li = document.createElement('li');
                li.textContent = `${policy.title}: ${policy.description} (Score: ${policy.score})`;
                policiesList.appendChild(li);
            });
        } else {
            console.warn("Warning: 'data.policies' is not an array. Check backend response.");
        }
  
        // --- Populate Voted Policies List ---
        const votesList = document.getElementById('votesList');
        const myUsername = urlParams.get('username'); // Get the currently logged-in user's username

        if (data.policies && Array.isArray(data.policies)) {
            data.policies.forEach(policy => {
                // Check if the logged-in user has upvoted this policy
                if (policy.votes && policy.votes[myUsername] === 1) { 
                    const li = document.createElement('li');
                    li.textContent = `${policy.title}`;
                    votesList.appendChild(li);
                }
            });

            // Handle the case where the user hasn't upvoted any policies
            if (votesList.children.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No policies upvoted yet.';
                votesList.appendChild(li);
            }

        } else {
            console.warn("Warning: 'data.policies' is not an array. Check backend response.");
        }
        console.log(data.votes);

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
});