const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const collectionsDB = client.db('carDoctorDB');
        const services = collectionsDB.collection('services');
        const checkoutDB = collectionsDB.collection('checkout');

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

        app.get('/details', async(req, res) => {
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