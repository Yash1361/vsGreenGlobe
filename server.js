const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3000;
const API_KEY = 'AIzaSyDCxq-CSoFyziFcEVskDXib91sIsVMQU3g'; // Replace with your actual API key
const url = 'mongodb://localhost:27017';
const dbName = 'leaderboardDB';

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

async function connectToDb() {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log("Connected to MongoDB!");
    return client.db(dbName);
}

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

app.post('/submit', async (req, res) => {
    const { title, description, score, username } = req.body;
    if (!title || !description || !score || !username) {
        return res.status(400).send('All fields are required');
    }

    try {
        const db = await connectToDb();
        const policies = db.collection('policies');
        
        // Find existing user policies
        let userPolicies = await policies.findOne({ username });

        if (userPolicies) {
            // Append new policy to user's policies
            userPolicies.policies.push({ title, description, score });
            userPolicies.totalScore = userPolicies.policies.reduce((acc, policy) => acc + policy.score, 0);
            await policies.updateOne({ username }, { $set: userPolicies });
        } else {
            // Insert new user policies
            const newUserPolicies = {
                username,
                policies: [{ title, description, score }],
                totalScore: score
            };
            await policies.insertOne(newUserPolicies);
        }

        // Ensure only top 10 entries remain
        const allPolicies = await policies.find().sort({ totalScore: -1 }).toArray();
        let place = null;
        for (let i = 0; i < allPolicies.length; i++) {
            if (allPolicies[i].username === username) {
                place = i + 1;
                break;
            }
        }

        if (allPolicies.length > 10) {
            const lastUser = allPolicies[10];
            await policies.deleteOne({ _id: lastUser._id });
        }

        res.status(200).json({ place });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting policy.');
    }
});


app.get('/leaderboard-data', async (req, res) => {
    try {
        const db = await connectToDb();
        const policies = db.collection('policies');
        const allPolicies = await policies.find().sort({ totalScore: -1 }).toArray();
        res.json(allPolicies);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching leaderboard data.');
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Kinhasa.html'));
});

app.get('/leaderboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
