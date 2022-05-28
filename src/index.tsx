import express, { Express, Request, Response } from "express";
import { resolve } from "path/win32";

// Server setup
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app: Express = express();

// middleware
app.use(cors());
app.use(express.json());

// port and db connection
const port = process.env.PORT || 5000;

// database information
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.8bccj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    // product collection
    const productsCollection = client.db("Products").collection("product");
    const cartCollection = client.db("Products").collection("cart");

    // finding all Products
    app.get("/products", async (req: Request, res: Response) => {
      const results = await productsCollection.find({}).toArray();
      res.send(results);
    });

    // Finding one specific particular product
    app.get("/products/:productId", async (req: Request, res: Response) => {
      const productId: string = req.params.productId;
      const q = {
        _id: ObjectId(productId),
      };
      const results = await productsCollection.findOne(q);
      res.send(results);
    });

    // Fetch single product
    app.get("/view-product/:productId", async (req: Request, res: Response) => {
      const productId = req.params.productId;
      let result = await productsCollection.findOne({
        _id: ObjectId(productId),
      });
      const findCart = await cartCollection.findOne({
        product_id: productId,
      });

      let cardHandler: boolean;

      if (findCart?.product_id) {
        cardHandler = true;
      } else {
        cardHandler = false;
      }

      result["cardHandler"] = cardHandler;

      res.send(result);
    });

    // adding product to my cart
    app.post("/my-cart/:userEmail", async (req: Request, res: Response) => {
      const user_email = req.params.userEmail;
      const { _id: product_id, title, price, category, image, quantity } = req.body;

      const newCart = { product_id, title, price, category, image, user_email, quantity };
      const cartRes = await cartCollection.insertOne(newCart);
      res.send(cartRes);
    });

    // fetch all item in my cart
    app.get("/my-cart-items/:userEmail", async (req: Request, res: Response) => {
      const userEmail = req.params.userEmail;
      const cartRes = await cartCollection.find({user_email : userEmail}).toArray();
      res.send(cartRes);
    });

    // update cart
    app.put('/update-cart/:pId', async(req:Request, res: Response) => {
      const pId = req.params.pId;
      const {quantity, total_price} = req.body;
      const fill = {_id : ObjectId(pId)};
      const result = await cartCollection.updateOne(fill, {$set : {quantity : quantity, total_price : total_price}}, {upsert : true});
      res.send(result);
    });

    // inserting user
    app.put("/user", async (req: Request, res: Response) => {
      const uid = req.query.uid;
    });
  } finally {
  }
}
run();

app.get("/", (req: Request, res: Response) => {
  res.send("Server running");
});

app.listen(port, () => {
  console.log(`Running port is ${port}`);
});
