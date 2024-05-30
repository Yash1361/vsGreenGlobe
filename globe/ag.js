// Get the username from the URL parameters
const username = new URLSearchParams(window.location.search).get('username');

// Update the game and dashboard links with the username parameter
document.getElementById('game-link').href = `kinhasa.html?username=${username}`;
document.getElementById('tutorial-link').href = `tutorial.html?username=${username}`;
document.getElementById('dashboard-link').href = `user.html?username=${username}`;

document.querySelector('.navbar a.game').addEventListener('mouseenter', function() {
    confetti({
        particleCount: 50, // Reduce particle count
        spread: 40,       // Reduce spread
        startVelocity: 25, // Slower confetti
        gravity: 0.3,      // Slower descent
        colors: ['#00ADB5', '#EEEEEE', '#222831'], // Use your color scheme
        origin: { y: 0.6 }
    });
});
