const { MongoClient } = require('mongodb');
const url = 'mongodb://localhost:27017';
const dbName = 'leaderboardDB';

async function connect() {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        console.log("Connected to MongoDB!");
        const db = client.db(dbName);
        // Perform database operations here
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

connect();
