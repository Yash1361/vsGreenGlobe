const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const API_KEY = 'AIzaSyDCxq-CSoFyziFcEVskDXib91sIsVMQU3g'; // Replace with your actual API key
const url = 'mongodb://localhost:27017';
const dbName = 'leaderboardDB';
const SECRET_KEY = 'your_secret_key'; // Replace with a strong secret key

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.use(cors()); // Allow all origins
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/globe', express.static(path.join(__dirname, 'globe'))); // Serve files from the globe directory

async function connectToDb() {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log("Connected to MongoDB!");
    return client.db(dbName);
}

app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).send('All fields are required');
    }

    if (username.length < 6) {
        return res.status(400).send('Username must be at least 6 characters long');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Invalid email address');
    }

    try {
        const db = await connectToDb();
        const users = db.collection('users');

        const existingUser = await users.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).send('Username or email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { username, email, password: hashedPassword };
        await users.insertOne(newUser);

        const token = jwt.sign({ username, email }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ token, username });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error signing up');
    }
});

app.post('/signin', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('All fields are required');
    }

    try {
        const db = await connectToDb();
        const users = db.collection('users');

        const user = await users.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).send('Invalid credentials');
        }

        const token = jwt.sign({ username, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ token, username });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error signing in');
    }
});

app.post('/verify-token', (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).send('Token is required');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        res.status(200).json(decoded);
    } catch (err) {
        res.status(401).send('Invalid token');
    }
});

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

app.post('/vote', async (req, res) => {
    const { username, title, vote, voter } = req.body;
    if (!username || !title || !Number.isInteger(vote) || !voter) {
        return res.status(400).send('Invalid request');
    }

    try {
        const db = await connectToDb();
        const policies = db.collection('policies');

        const userPolicies = await policies.findOne({ username });
        if (userPolicies) {
            const policy = userPolicies.policies.find(p => p.title === title);
            if (policy) {
                if (!policy.voteCount) {
                    policy.voteCount = 0;
                }
                if (!policy.votes) {
                    policy.votes = {};
                }

                let previousVote = policy.votes[voter] || 0;
                if (previousVote === vote) {
                    policy.voteCount -= vote;
                    delete policy.votes[voter];
                } else {
                    policy.voteCount += vote - previousVote;
                    policy.votes[voter] = vote;
                }

                if (policy.voteCount <= -10) {
                    userPolicies.policies = userPolicies.policies.filter(p => p.title !== title);
                } else {
                    await policies.updateOne({ username, 'policies.title': title }, { $set: { 'policies.$.voteCount': policy.voteCount, 'policies.$.votes': policy.votes } });
                }

                userPolicies.totalScore = userPolicies.policies.reduce((acc, p) => acc + p.score, 0);
                await policies.updateOne({ username }, { $set: userPolicies });

                return res.status(200).json({ voteCount: policy.voteCount, voterVote: policy.votes[voter] || 0 });
            }
        }

        res.status(404).send('Policy not found');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating vote count');
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
        
        let userPolicies = await policies.findOne({ username });

        if (userPolicies) {
            userPolicies.policies.push({ title, description, score });
            userPolicies.totalScore = userPolicies.policies.reduce((acc, policy) => acc + policy.score, 0);
            await policies.updateOne({ username }, { $set: userPolicies });
        } else {
            const newUserPolicies = {
                username,
                policies: [{ title, description, score }],
                totalScore: score
            };
            await policies.insertOne(newUserPolicies);
        }

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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'globe', 'index.html'));
});

app.get('/map', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Kinhasa.html'));
});

app.get('/leaderboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
