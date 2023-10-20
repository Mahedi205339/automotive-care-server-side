const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require("mongodb");
// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0r9jhzc.mongodb.net/?retryWrites=true&w=majority`;


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


        // data collection  
        const carsCollection = client.db('carsDB').collection('cars');

        //data created
        app.post('/cars', async (req, res) => {
            const newCar = req.body;
            console.log(newCar)
            const result = await carsCollection.insertOne(newCar);
            res.send(result)
        })
        //data read 
        app.get('/cars', async (req, res) => {
            const cursor = carsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        //data delete 
        app.delete('/cars/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await carsCollection.deleteOne(query);
            res.send(result)

        })

        app.get('/cars/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await carsCollection.findOne(query);
            res.send(result)

        })
        //update data
        app.put('/cars/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedCar = req.body;
            const cars = {
                $set: {
                    name: updatedCar.name,
                    brand: updatedCar.brand,
                    type: updatedCar.type,
                    price: updatedCar.price,
                    details: updatedCar.details,
                    photo: updatedCar.photo

                }
            }
            const result = await carsCollection.updateOne(filter,cars ,options)
            res.send(result);
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


app.get('/', (req, res) => {
    res.send('Automotive server is running')
})

app.listen(port, () => {
    console.log(`Automotive server is running on port ${port}`)
})
