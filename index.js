const express = require("express");
const app = express();
const cors = require("cors");
const bcryptjs = require("bcryptjs");
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const jsonwebtoken = require("jsonwebtoken");

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

let URL =
  "mongodb+srv://admin:admin123@cluster0.cpybg.mongodb.net/?retryWrites=true&w=majority";
let users = [];

function authenticate(req, res, next) {
  if (req.headers.authorization) {
    let decoded = jsonwebtoken.verify(req.headers.authorization, "asdfghjkl");

    if (decoded) {
      next();
    } else {
      res.status(401).json({ message: "Not Allowed" });
    }
  } else {
    res.status(401).json({ message: "Not Allowed" });
  }
}

app.get("/users", authenticate, async function (req, res) {
  try {
    //connet The DB
    let connection = await mongoClient.connect(URL);

    //select the DB
    let db = connection.db("bt31wd");

    //Select the Collection & Do Operation
    let students = await db.collection("students").find().toArray();

    //Close the Connection
    await connection.close();

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Something Went Wrong" });
  }
});

app.post("/create-user", authenticate, async function (req, res) {
  try {
    // step 1: Connect the Database
    let connection = new mongoClient(URL);
    await connection.connect();

    // step 2 : Select the DB
    let db = connection.db("bt31wd");

    //step 3 & 4 : Select the collection
    // Do operation
    await db.collection("students").insertOne(req.body);

    //step 5: Close Connection
    await connection.close();

    res.json({ message: "User Created in DB" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong now" });
  }
});

app.get("/user/:id", authenticate, async function (req, res) {
  try {
    //connet The DB
    let connection = await mongoClient.connect(URL);

    //select the DB
    let db = connection.db("bt31wd");

    //Select the Collection & Do Operation
    let students = await db
      .collection("students")
      .findOne({ _id: mongodb.ObjectId(req.params.id) });

    //Close the Connection
    await connection.close();

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Something Went Wrong" });
  }
});

app.put("/edit/:id", authenticate, async function (req, res) {
  try {
    //connet The DB
    let connection = await mongoClient.connect(URL);

    //select the DB
    let db = connection.db("bt31wd");

    //Select the Collection & Do Operation
    await db
      .collection("students")
      .findOneAndUpdate(
        { _id: mongodb.ObjectId(req.params.id) },
        { $set: req.body }
      );

    //Close the Connection
    await connection.close();

    res.json({ message: "User Updated" });
  } catch (error) {
    res.status(500).json({ message: "Something Went Wrong" });
  }
});

app.delete("/delete/:id", authenticate, async function (req, res) {
  try {
    //connet The DB
    let connection = await mongoClient.connect(URL);

    //select the DB
    let db = connection.db("bt31wd");

    //Select the Collection & Do Operation
    await db
      .collection("students")
      .findOneAndDelete({ _id: mongodb.ObjectId(req.params.id) });

    //Close the Connection
    await connection.close();

    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Something Went Wrong" });
  }
});

app.post("/register", async function (req, res) {
  try {
    // Connect the DB
    let connection = await mongoClient.connect(URL);

    //select the DB
    let db = connection.db("bt31wd");

    //select the collection and Do operation
    // &&&&
    // Encrypt the password
    let salt = await bcryptjs.genSalt(10);
    let hash = await bcryptjs.hash(req.body.password, salt);
    console.log(hash);

    req.body.password = hash;

    await db.collection("users").insertOne(req.body);

    //Close the Connection
    connection.close();

    res.json({ message: "User Registered" });
  } catch (error) {
    res.status(500).json({ message: "Somthing went wrong" });
  }
});

app.post("/login", async function (req, res) {
  try {
    // Connect the DB
    let connection = await mongoClient.connect(URL);

    //select the DB
    let db = connection.db("bt31wd");

    //select the collection and Do operation
    let user = await db.collection("users").findOne({ email: req.body.email });

    if (user) {
      let compare = await bcryptjs.compare(req.body.password, user.password);

      if (compare) {
        //Generate Token
        let token = jsonwebtoken.sign({ id: user._id }, "asdfghjkl", {
          expiresIn: "1m",
        });
        res.json({ token });
      } else {
        res.status(401).json({ message: "Incorrect Password" });
      }
      //Close the Connection
      await connection.close();
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Somthing went wrong" });
  }
});

app.listen(3000);
