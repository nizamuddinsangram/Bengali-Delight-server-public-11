const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 8000;
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

require("dotenv").config();

//middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vshvqji.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
//middleware
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }
    req.user = decoded;
    next();
  });
};
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const foodsCollection = client.db("Bengali-DelightsDB").collection("foods");
    const purchaseCollection = client
      .db("Bengali-DelightsDB")
      .collection("purchase");

    //------------different collections----------
    //find 6 data user number of purchases / This is our Top foods section

    app.get("/foods", async (req, res) => {
      const result = await foodsCollection
        .find({})
        .sort({ numberOfPurchases: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });
    app.get("/allFoods", async (req, res) => {
      const result = await foodsCollection.find().toArray();
      res.send(result);
    });
    app.get("/allFoods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });
    // purchase data post api
    app.post("/purchases", async (req, res) => {
      const order = req.body;
      const result = await purchaseCollection.insertOne(order);
      res.send(result);
    });

    //---------jwt token for authentication and authorization--------
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "30h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });
    //token removed from cookie
    app.post("/logout", (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });
    app.get("/test", verifyToken, async (req, res) => {
      const data = req.user;
      // console.log("tested data ", data);
      res.send({ name: "nizam" });
    });
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
  res.send("welcome to assignment eleven server");
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
