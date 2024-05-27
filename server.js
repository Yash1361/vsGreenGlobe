// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

const app = express();
const PORT = 3000;
const API_KEY = 'AIzaSyDCxq-CSoFyziFcEVskDXib91sIsVMQU3g'; // Replace with your actual API key

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.use(cors());
app.use(bodyParser.json());

app.post('/generate', async (req, res) => {
    const { policyName, policyDescription } = req.body;
    const prompt = `Policy Name: ${policyName}\nPolicy Description: ${policyDescription}\n\n I want you to give me a very small story in bullet points that describe a turn of events after the policy was implemented. for example: if the policy is to shut down factories, the events can be 20 factories shut down, 125 jobs were lost, many protests took place. in the end always give a text in this format:- Money spent: $x, aqi: +-y%, happiness: +- z%`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        res.json({ text });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

