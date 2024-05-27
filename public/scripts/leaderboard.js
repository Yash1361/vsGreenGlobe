document.addEventListener('DOMContentLoaded', async () => {
    const leaderboardTable = document.getElementById('leaderboard').getElementsByTagName('tbody')[0];

    try {
        const response = await fetch('http://localhost:3000/leaderboard-data');
        const data = await response.json();

        data.forEach((user, index) => {
            const row = leaderboardTable.insertRow();
            const cell1 = row.insertCell(0);
            const cell2 = row.insertCell(1);
            const cell3 = row.insertCell(2);
            const cell4 = row.insertCell(3);

            cell1.textContent = index + 1;
            cell2.textContent = user.username;
            cell4.textContent = user.totalScore;

            const policies = user.policies.map((policy, policyIndex) => {
                return `
                    <div class="policy-item">
                        <span>${policyIndex + 1}) ${policy.title}: ${policy.description}</span>
                        <div class="voting">
                            <i class="fas fa-arrow-up upvote" data-username="${user.username}" data-title="${policy.title}"></i>
                            <span class="vote-count">${policy.voteCount || 0}</span>
                            <i class="fas fa-arrow-down downvote" data-username="${user.username}" data-title="${policy.title}"></i>
                        </div>
                    </div>
                    <br>
                `;
            }).join('');
            cell3.innerHTML = policies;
        });

        document.querySelectorAll('.upvote').forEach(button => {
            button.addEventListener('click', async (event) => {
                const username = event.target.getAttribute('data-username');
                const title = event.target.getAttribute('data-title');
                const voteCountElement = event.target.nextElementSibling;

                const response = await fetch('http://localhost:3000/vote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, title, vote: 1 })
                });

                if (response.ok) {
                    const result = await response.json();
                    voteCountElement.textContent = result.voteCount;
                }
            });
        });

        document.querySelectorAll('.downvote').forEach(button => {
            button.addEventListener('click', async (event) => {
                const username = event.target.getAttribute('data-username');
                const title = event.target.getAttribute('data-title');
                const voteCountElement = event.target.previousElementSibling;

                const response = await fetch('http://localhost:3000/vote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, title, vote: -1 })
                });

                if (response.ok) {
                    const result = await response.json();
                    voteCountElement.textContent = result.voteCount;
                }
            });
        });

    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
    }
});
