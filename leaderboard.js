const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;
const url = 'mongodb://localhost:27017';
const dbName = 'leaderboardDB';

app.use(bodyParser.json());
app.use(express.static('public'));

async function connectToDb() {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log("Connected to MongoDB!");
    return client.db(dbName);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Kinhasa.html'));
});

app.get('/leaderboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
