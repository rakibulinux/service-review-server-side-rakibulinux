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
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    //Get a single service
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId._id(id) };
      const services = await serviceCollection.findOne(query);
      res.send(services);
    });
    app.post("/services", async (req, res) => {});
  } finally {
  }
}

run().catch((err) => console.error(err));

// Connection
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("App running in port: " + PORT);
});
