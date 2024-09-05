const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// corse related all problem solvw code
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5173"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

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

    // jwt token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "7d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // clear token on logout
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });

    // jwt middleware
    const verifyToken = (req, res, next) => {
      const token = req.cookies?.token;

      if (!token)
        return res.status(401).send({ message: "unauthorize access" });

      if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
          if (err) {
            console.log(err);
            return res.status(401).send({ message: "unauthorize access" });
          }
          console.log(decoded);
          req.user = decoded;
          next();
        });
      }
    };

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

    // save a job data in DB
    app.post("/job", async (req, res) => {
      const jobdata = req.body;
      const result = await jobsCollections.insertOne(jobdata);
      res.send(result);
    });

    // get all job posted by a specific user
    app.get("/jobs/:email", verifyToken, async (req, res) => {
      const tokenEmail = req.user.email;
      const email = req.params.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { "buyer.email": email };
      const result = await jobsCollections.find(query).toArray();
      res.send(result);
    });

    // delete a job data from db
    app.delete("/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollections.deleteOne(query);
      res.send(result);
    });

    // update a job in BD
    app.put("/job/:id", async (req, res) => {
      const id = req.params.id;
      const jobData = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...jobData,
        },
      };
      const result = await jobsCollections.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // get all bids for a user my email from DB
    app.get("/my-bids/:email",verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await bidsCollections.find(query).toArray();
      res.send(result);
    });

    // get all bids request from DB for job owner
    app.get("/bid-request/:email",verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "buyer.email": email };
      const result = await bidsCollections.find(query).toArray();
      res.send(result);
    });

    // update bid status
    app.patch("/bid/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: status,
      };
      const result = await bidsCollections.updateOne(query, updateDoc);
      res.send(result);
    });

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
