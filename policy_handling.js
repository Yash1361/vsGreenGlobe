// policy_handling.js
const implementPolicyButton = document.getElementById('implement-policy-button');
const policyInput = document.getElementById('policy-input');
const submitPolicyButton = document.getElementById('submit-policy-button');
const clearPolicyButton = document.getElementById('clear-policy-button');
const policyResult = document.getElementById('policy-result');
const loadingSpinner = document.getElementById('loading-spinner');
const viewPoliciesButton = document.getElementById('view-policies-button');
const policiesList = document.getElementById('policies-list');

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

    if (policyName && policyDescription) {
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
