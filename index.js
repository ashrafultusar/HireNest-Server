const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5173"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hzcboi3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const jobsCollections = client.db("HireNest").collection("jobs");
    const bidsCollections = client.db("HireNest").collection("bids");
    // await client.connect();

    // get all jobs data from DB
    app.get("/jobs", async (req, res) => {
      const result = await jobsCollections.find().toArray();
      res.send(result);
    });

    // get a single data from DB
    app.get("/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollections.findOne(query);
      res.send(result);
    });

    // save a bid data in DB
    app.post("/bid", async (req, res) => {
      const bidData = req.body;
      const result = await bidsCollections.insertOne(bidData);
      res.send(result);
    });

// get bid data in DB







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("HireNest running peacefully");
});

app.listen(port, () => console.log(`server running on port ${port}`));
