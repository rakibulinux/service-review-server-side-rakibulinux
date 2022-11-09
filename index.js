require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const JwtAuth = require("./jwtAuth");

// Mongo DB Connections
const client = new MongoClient(process.env.MONGO_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Middleware Connections
app.use(cors());
app.use(express.json());

// Main Route
app.get("/", (req, res) => {
  res.send("API Server is Running");
});

async function run() {
  try {
    const serviceCollection = client.db("serviceReview").collection("services");
    const reviewCollection = client.db("serviceReview").collection("reviews");

    // JWT Post Method
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user.email);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Limit to 3 services
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.limit(3).toArray();
      res.send(services);
    });

    //Get all services
    app.get("/services", async (req, res) => {
      const query = {};
      const serviceAddedDate = req.query.serviceAddedDate;
      const cursor = serviceCollection.find(query);
      const services = await cursor.sort({ serviceAddedDate: -1 }).toArray();
      res.send(services);
    });
    //Get a single service
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const services = await serviceCollection.findOne(query);
      res.send(services);
    });

    //Post a New service
    app.post("/services", async (req, res) => {
      const AddService = req.body;
      console.log(AddService);
      const service = await serviceCollection.insertOne(AddService);
      res.send(service);
    });

    //Get reviews by sort
    app.get("/reviews", async (req, res) => {
      const service_id = req.query.service_id;
      const reviewDate = req.query.reviewDate;
      console.log(reviewDate, service_id);
      let query = {};
      if (service_id) {
        query = {
          service_id: service_id,
        };
      }
      console.log(query);
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.sort({ reviewDate: -1 }).toArray();
      res.send(reviews);
    });

    //Post a New review
    app.post("/reviews", async (req, res) => {
      const AddReview = req.body;
      const review = await reviewCollection.insertOne(AddReview);
      res.send(review);
    });

    // Get all my reviews
    app.get("/myreviews", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = {
          email: email,
        };
      }
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });
    app.get("/myreviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const review = await reviewCollection.findOne(query);
      res.send(review);
    });

    //Update a single review
    app.patch("/myreviews/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const description = req.body.description;
      console.log(description);
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          description: description,
        },
      };
      // console.log(updatedDoc);
      const result = await reviewCollection.updateOne(query, updatedDoc);
      console.log(
        `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
      );
      res.send(result);
    });

    //Delete a single review
    app.delete("/myreviews/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const deleteReview = await reviewCollection.deleteOne(query);
      res.send(deleteReview);
    });
  } finally {
  }
}

run().catch((err) => console.error(err));

// Connection
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("App running in port: " + PORT);
});
