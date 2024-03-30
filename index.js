const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require("mongodb");
// const cookieParser = require('cookie-parser')
// middleware
app.use(cors());
app.use(express.json());
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)

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


        // data collection  
        const carsCollection = client.db('carsDB').collection('cars');
        const usersCollection = client.db('carsDB').collection('users');
        const bookingsCollection = client.db('carsDB').collection('bookings');
        const paymentsCollection = client.db('carsDB').collection('payment');

        //data created
        app.post('/cars', async (req, res) => {
            const newCar = req.body;
            console.log(newCar)
            const result = await carsCollection.insertOne(newCar);
            res.send(result)
        })
        //data read 
        app.get('/cars', async (req, res) => {
            const filter = req.query;
            console.log(filter);
            const query = {}
            const page = parseInt(req?.query?.page);
            const size = parseInt(req?.query?.size)

            const options = {
                sort: {
                    price: filter?.sort === 'asc' ? 1 : -1
                }
            }

            const result = await carsCollection
                .find(query, options)
                .skip(page * size)
                .limit(size)
                .toArray()
            res.send(result);
        })
        app.get('/cars-count', async (req, res) => {
            const result = await carsCollection.find().toArray()
            res.send(result);
        })


        //data delete 
        app.delete('/cars/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await carsCollection.deleteOne(query);
            res.send(result)

        })

        // get all cars 

        app.get('/cars/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await carsCollection.findOne(query);
            res.send(result)

        })

        //add cars 
        app.post("/add-cars", async (req, res) => {
            const carData = req.body;
            // console.log(data);
            const result = await carsCollection.insertOne(carData)
            res.send(result)

        })
        //payment bookings 
        app.post("/payment-bookings", async (req, res) => {
            const paymentData = req.body;
            console.log(paymentData);
            const result = await paymentsCollection.insertOne(paymentData)
            res.send(result);
        })

        //users register here
        app.post('/users', async (req, res) => {
            const user = req.body;
            //inserted email if user does not exists ;
            const query = { email: user.email };
            const existsUser = await usersCollection.findOne(query);
            if (existsUser) {
                return res.send({ message: "user already exist", insertedId: null })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        // get cars basis on brands

        //http://localhost:5000/cars?brand=categoryValue
        //http://localhost:5000/cars?sortFeild=price&priceOrder=asc



        //bookings 
        app.post('/bookings', async (req, res) => {
            try {
                const bookings = req.body;
                const query = { email: bookings.email };
                console.log(query);
                const existsBookings = await bookingsCollection.findOne(query);
                if (existsBookings) {
                    return res.send({ message: "booking already exist", insertedId: null })
                }
                console.log(bookings);
                console.log(bookings);
                const result = await bookingsCollection.insertOne(bookings);
                res.send(result)
            }
            catch {
                error => console.log(error)
            }

        })
        //get all bookings 
        app.get('/bookings', async (req, res) => {
            const result = await bookingsCollection.find().toArray()
            res.send(result)
        })

        // get bookings by email 
        app.get('/bookings/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        })
        //cancel or delete a booking 
        app.delete('/booking/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) }
                const result = await bookingsCollection.deleteOne(query);
                res.send(result);

            } catch (error) {
                console.log(error);
            }
        })

        app.post('/feedback', async (req, res) => {
            try {
                const feedback = req.body;
                console.log(feedback);
                const result = await feedbackCollection.insertOne(feedback);
                res.send(result)
            }
            catch {
                error => console.log(error)
            }

        })
        // payment intend
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body
            const amount = parseInt(price * 100)
            if (!price || amount < 1) return
            const { client_secret } = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card'],
            })
            res.send({ clientSecret: client_secret })
        })




        //update data
        app.patch('/update-car/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedCar = req.body;
            const cars = {
                $set: {
                    title: updatedCar.title,
                    description: updatedCar.description,
                    brand: updatedCar.brand,
                    price: updatedCar.price,
                    image: updatedCar.image,
                    image1: updatedCar.image1,
                    image2: updatedCar.image2,
                    image3: updatedCar.image3,
                    engine_type: updatedCar.engine_type,
                    mileage: updatedCar.mileage,
                    category: updatedCar.category,

                }
            }
            const result = await carsCollection.updateOne(filter, cars, options)
            res.send(result);
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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
