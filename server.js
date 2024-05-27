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
    console.log('Received POST request at /submit');
    const { title, description, score } = req.body;
    console.log('Request body:', req.body);
    if (!title || !description || !score) {
        console.log('Missing fields in request body');
        return res.status(400).send('All fields are required');
    }

    try {
        const db = await connectToDb();
        const policies = db.collection('policies');
        const allPolicies = await policies.find().sort({ score: -1 }).toArray();

        if (allPolicies.length < 10 || score > allPolicies[allPolicies.length - 1].score) {
            if (allPolicies.length >= 10) {
                await policies.deleteOne({ _id: allPolicies[allPolicies.length - 1]._id });
            }
            await policies.insertOne({ title, description, score });
            res.status(200).send('Policy submitted successfully!');
        } else {
            res.status(200).send('Policy score is not high enough to be added to the leaderboard.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting policy.');
    }
});

app.get('/leaderboard-data', async (req, res) => {
    try {
        const db = await connectToDb();
        const policies = db.collection('policies');
        const allPolicies = await policies.find().sort({ score: -1 }).toArray();
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
