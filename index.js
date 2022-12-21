require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Mongo DB Connections
const client = new MongoClient(process.env.MONGO_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Middleware Connections
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.SECRET_KEY, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Access denied" });
    }
    req.decoded = decoded;
    next();
  });
}

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
      const token = jwt.sign(user, process.env.SECRET_KEY, {
        expiresIn: "4h",
      });
      res.send({ token });
    });

    // Limit to 3 services and sort services
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor
        .sort({ serviceAddedDate: -1 })
        .limit(3)
        .toArray();
      res.send(services);
    });

    //Get all services
    app.get("/services", async (req, res) => {
      const query = {};
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
      const service = await serviceCollection.insertOne(AddService);
      res.send(service);
    });

    //Get reviews by sort
    app.get("/reviews", async (req, res) => {
      const service_id = req.query.service_id;
      let query = {};
      if (service_id) {
        query = {
          service_id: service_id,
        };
      }
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

    // Get all reviews for a specific user
    app.get("/myreviews", verifyJWT, async (req, res) => {
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

    //Get a single review
    app.get("/myreviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const review = await reviewCollection.findOne(query);
      res.send(review);
    });

    //Update a single review
    app.patch("/myreviews/:id", async (req, res) => {
      const id = req.params.id;
      const description = req.body.description.description;
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          description: description,
        },
      };
      const result = await reviewCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    //Delete a single review
    app.delete("/myreviews/:id", async (req, res) => {
      const id = req.params.id;
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
