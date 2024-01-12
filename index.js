const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000;
require("dotenv").config();


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xevudqv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error: true, message: 'unauthorized access'})
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if(error){
            return res.status(403).send({error: true, message: 'unauthorized access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const collectionsDB = client.db('carDoctorDB');
        const services = collectionsDB.collection('services');
        const checkoutDB = collectionsDB.collection('checkout');

        // JWT 
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
            res.send({token})
        })

        // Services
        app.get('/services', async (req, res) => {
            const cursor = await services.find().toArray();
            res.send(cursor)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = {
                projection: { title: 1, img: 1, price: 1 },
            };
            const result = await services.findOne(query, options);
            res.send(result);
        })

        app.get('/details', verifyJWT, async(req, res) => {
            const decoded = req.decoded;
            if(decoded.email !== req.query.email){
                return res.status(403).send({error: 1, message: 'forbidden access'})
            }
            let query = {};
            if(req.query?.email){
                query.email = req.query.email;
            }
            const cursor = await checkoutDB.find(query).toArray();
            res.send(cursor)
        })

        app.post('/checkout', async (req, res) => {
            const service = req.body;
            const doc = {
                customerName: service.customerName,
                email: service.email,
                img: service.img,
                date: service.date,
                price: service.price,
                serviceId: service.serviceId,
                message: service.message,
                status: service.status
            }
            const result = await checkoutDB.insertOne(doc);
            res.send(result);
        })

        app.patch('/service/:id', async(req, res) => {
            const id = req.params.id;
            const status = req.body;
            const filter = {_id: new ObjectId(id)};
            const options = {upsert: true};
            const updateDoc = {
                $set: {
                    status: status.status
                }
            }
            const result = await checkoutDB.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        app.delete('/service/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await checkoutDB.deleteOne(query);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port)