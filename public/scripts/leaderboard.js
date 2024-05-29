document.addEventListener('DOMContentLoaded', async () => {
    const leaderboardTable = document.getElementById('leaderboard').getElementsByTagName('tbody')[0];
    let currentUser = localStorage.getItem('currentUser') || prompt('Please enter your username:');
    if (!currentUser) {
        currentUser = prompt('Please enter your username:');
        localStorage.setItem('currentUser', currentUser);
    }

    // GSAP Setup
    gsap.registerPlugin(ScrollTrigger);

    // Container and header animation
    gsap.from(".container", { duration: 1, opacity: 0, y: -50, ease: "power2.out" });
    gsap.from("h1", { duration: 1.5, opacity: 0, scale: 0.5, ease: "back.out(1.7)" });

    async function fetchLeaderboardData() {
        const response = await fetch('http://localhost:3000/leaderboard-data');
        return await response.json();
    }

    async function renderLeaderboard() {
        const data = await fetchLeaderboardData();
        leaderboardTable.innerHTML = '';

        data.forEach((user, index) => {
            const row = leaderboardTable.insertRow();
            animateNewRow(row);
            const cell1 = row.insertCell(0);
            const cell2 = row.insertCell(1);
            const cell3 = row.insertCell(2);
            const cell4 = row.insertCell(3);

            cell1.textContent = index + 1;
            cell2.textContent = user.username;
            cell4.textContent = user.totalScore;

            const policies = user.policies.map((policy, policyIndex) => {
                const userVote = policy.votes && policy.votes[currentUser] || 0;
                return `
                    <div class="policy-item" data-username="${user.username}" data-title="${policy.title}">
                        <span>${policyIndex + 1}) ${policy.title}: ${policy.description}</span>
                        <div class="voting">
                            <i class="fas fa-arrow-up upvote ${userVote === 1 ? 'voted' : ''}" data-username="${user.username}" data-title="${policy.title}" data-vote="1"></i>
                            <span class="vote-count">${policy.voteCount || 0}</span>
                            <i class="fas fa-arrow-down downvote ${userVote === -1 ? 'voted' : ''}" data-username="${user.username}" data-title="${policy.title}" data-vote="-1"></i>
                        </div>
                    </div>
                    <br>
                `;
            }).join('');
            cell3.innerHTML = policies;
        });

        addEventListeners();
    }

    function addEventListeners() {
        document.querySelectorAll('.upvote, .downvote').forEach(button => {
            button.addEventListener('click', async (event) => {
                const username = event.target.getAttribute('data-username');
                const title = event.target.getAttribute('data-title');
                const vote = parseInt(event.target.getAttribute('data-vote'), 10);
                const voteCountElement = event.target.parentElement.querySelector('.vote-count');

                const response = await fetch('http://localhost:3000/vote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, title, vote, voter: currentUser })
                });

                if (response.ok) {
                    const result = await response.json();
                    voteCountElement.textContent = result.voteCount;
                    updateVoteStyles(event.target, result.voterVote);
                    if (result.voteCount <= -10) {
                        event.target.closest('.policy-item').remove();
                    }
                }
            });
        });
    }

    function updateVoteStyles(target, voterVote) {
        const upvoteButton = target.closest('.voting').querySelector('.upvote');
        const downvoteButton = target.closest('.voting').querySelector('.downvote');
        if (voterVote === 1) {
            upvoteButton.classList.add('voted');
            downvoteButton.classList.remove('voted');
        } else if (voterVote === -1) {
            upvoteButton.classList.remove('voted');
            downvoteButton.classList.add('voted');
        } else {
            upvoteButton.classList.remove('voted');
            downvoteButton.classList.remove('voted');
        }
    }

    // Function to create a staggered animation for new rows
    function animateNewRow(row) {
        gsap.fromTo(
            row,
            { opacity: 0, y: 50 },
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

    await renderLeaderboard();
});
