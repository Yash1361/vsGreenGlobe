// ui_update.js
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
            aqi *= (1 + (aqiValue) / 100);
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
}
