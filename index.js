const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.czo9kw9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(url);

async function run() {
    try {
        const productCollection = client.db('assignment12').collection('products');
        const usersCollection = client.db('assignment12').collection('users');
        //post user 
        app.post('/users', async (req, res) => {
            try {
                const users = req.body;
                const result = await usersCollection.insertOne(users);
                res.send(result)

            } catch (err) {
                res.send({
                    success: false,
                    error: err.message,
                })
            }
        });

    }
    catch (err) {

    }
}

run();









app.listen(port, () => console.log('assignment 12 server running on now', port))