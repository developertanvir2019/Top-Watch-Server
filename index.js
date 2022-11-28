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

//verify jwt now

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send("Unauthorize Access")
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ massage: 'Forbidden Access' })
        }
        req.decoded = decoded
        next();
    })
}

async function run() {
    try {
        const productCollection = client.db('assignment12').collection('products');
        const usersCollection = client.db('assignment12').collection('users');
        const bookingCollection = client.db('assignment12').collection('booking');
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
        //get all users
        app.get('/allUsers', async (req, res) => {
            const query = {};
            const cursor = usersCollection.find(query);
            const services = await cursor.toArray()
            res.send(services);
        });

        //for jwt part
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        })

        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    role: 'Admin'
                }
            }
            const result = await usersCollection.updateOne(filter, options, updateDoc)
            res.send(result)
        })


        // admin route protected
        // app.get('/users/admin/:email', async (req, res) => {
        //     const email = req.params.email
        //     const query = { email: email }
        //     const user = await usersCollection.findOne(query)
        //     res.send({ isAdmin: user?.role === 'Admin' })
        // })
        // seller route protected
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send({ isSeller: user?.role === 'seller' })
        })

        // buyer route protected
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send({ isBuyer: user?.role === 'buyer' })
        })


        //add service from clientSide

        app.post('/products', async (req, res) => {
            try {
                const result = await productCollection.insertOne(req.body);
                if (result.insertedId) {
                    res.send({
                        success: true,
                        message: `successfully added ${req.body.name}`
                    })
                }
                else {
                    res.send({
                        success: false,
                        error: `could not add the product`
                    })
                }
            } catch (err) {
                res.send({
                    success: false,
                    error: err.message,
                })
            }
        });



        app.get('/:categoryPro', async (req, res) => {
            try {
                const categorys = req.params.categoryPro;
                const query = { category: categorys };
                const cursor = productCollection.find(query);
                const products = await cursor.toArray();
                res.send(products)
            } catch (err) {
                res.send({
                    success: false,
                    error: err.message,
                })
            }
        })
        app.get('/my/Product', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products)
        });




        //all buyer

        app.get('/all/Buyers', async (req, res) => {
            const query = { role: 'buyer' };
            const cursor = usersCollection.find(query);
            const services = await cursor.toArray()
            res.send(services);
        });
        app.get('/all/seller', async (req, res) => {
            const query = { role: 'seller' };
            const cursor = usersCollection.find(query);
            const services = await cursor.toArray()
            res.send(services);
        });





        app.post('/bookings/all', async (req, res) => {
            const booking = req.body;
            const query = {
                productName: booking.productName,
                email: booking.email
            }

            const alreadyBooked = await bookingCollection.find(query).toArray()

            if (alreadyBooked.length) {
                const message = 'You have already booked this product'
                return res.send({ acknowledged: false, message })
            }
            const result = await bookingCollection.insertOne(booking)
            res.send(result)
        })


        app.get('/bookings/all', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = bookingCollection.find(query);
            const bookings = await cursor.toArray();
            res.send(bookings)
        });



        //delete product

        app.delete('/myProduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await bookingCollection.deleteOne(query)
            res.send(result)
        })



    }
    catch (err) {

    }
}

run();









app.listen(port, () => console.log('assignment 12 server running on now', port))