document.addEventListener('DOMContentLoaded', function() {
    fetch('/leaderboard-data')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('#leaderboard tbody');
            tbody.innerHTML = '';
            data.forEach((entry, index) => {
                const row = document.createElement('tr');
                const policiesList = entry.policies.map((policy, i) => `${i + 1}. ${policy.title}: ${policy.description}`).join('<br><br>');

                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${entry.username}</td>
                    <td>${policiesList}</td>
                    <td>${entry.totalScore}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching leaderboard data:', error));
});
