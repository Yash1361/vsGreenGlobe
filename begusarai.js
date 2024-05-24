document.addEventListener('DOMContentLoaded', () => {
    const windmillSlider = document.getElementById('windmills');
    const solarSlider = document.getElementById('solar-panels');
    const factorySlider = document.getElementById('factories');
    const policySlider = document.getElementById('policies');
    const budgetDisplay = document.getElementById('budget');

    let budget = 10000;

    const updateBudget = (amount) => {
        const totalSpent = windmillSlider.valueAsNumber + solarSlider.valueAsNumber + factorySlider.valueAsNumber + policySlider.valueAsNumber;
        budgetDisplay.textContent = `$${(budget - totalSpent).toFixed(2)}`;
    };

    windmillSlider.addEventListener('input', updateBudget);
    solarSlider.addEventListener('input', updateBudget);
    factorySlider.addEventListener('input', updateBudget);
    policySlider.addEventListener('input', updateBudget);
});
