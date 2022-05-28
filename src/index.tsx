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
    const orderCollection = client.db("Products").collection("orders");
    const singleCartCollection = client.db("Products").collection("singleCart");

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
      const {
        _id: product_id,
        title,
        price,
        category,
        image,
        quantity,
        total_price,
      } = req.body;

      const newCart = {
        product_id,
        title,
        price,
        category,
        image,
        user_email,
        quantity,
        total_price,
      };
      const cartRes = await cartCollection.insertOne(newCart);
      res.send(cartRes);
    });

    // fetch all item in my cart
    app.get(
      "/my-cart-items/:userEmail",
      async (req: Request, res: Response) => {
        const userEmail = req.params.userEmail;
        const cartRes = await cartCollection
          .find({ user_email: userEmail })
          .toArray();
        res.send(cartRes);
      }
    );

    // update cart
    app.put("/update-cart/:pId", async (req: Request, res: Response) => {
      const pId = req.params.pId;
      const { quantity, total_price } = req.body;
      const fill = { _id: ObjectId(pId) };
      const result = await cartCollection.updateOne(
        fill,
        { $set: { quantity: quantity, total_price: total_price } },
        { upsert: true }
      );
      res.send(result);
    });

    // remove item form cart with item cart id
    app.delete(
      "/delete-cart-item/:pcId",
      async (req: Request, res: Response) => {
        const pcId = req.params.pcId;
        const res1 = await singleCartCollection.deleteOne({
          _id: ObjectId(pcId),
        });
        const res2 = await cartCollection.deleteOne({ _id: ObjectId(pcId) });
        res.send(res1 || res2);
      }
    );

    // order address add api
    app.put(
      "/order-address/:userEmail",
      async (req: Request, res: Response) => {
        const userEmail = req.params.userEmail;
        const body = req.body;
        const option = { upsert: true };
        const query = { user_email: userEmail };
        const updateDoc = {
          $set: body,
        };

        const result = await orderCollection.updateOne(
          query,
          updateDoc,
          option
        );
        res.send(result);
      }
    );

    // get order address
    app.get(
      "/order-address/:userEmail",
      async (req: Request, res: Response) => {
        const userEmail = req.params.userEmail;
        const result = await orderCollection.findOne({
          user_email: userEmail,
        });
        res.send(result);
      }
    );

    // single cart product
    app.put(
      "/single-cart-product/:pId",
      async (req: Request, res: Response) => {
        const productId = req.params.pId;
        const {
          _id: product_id,
          title,
          price,
          category,
          image,
          quantity,
          total_price,
          user_email,
        } = req.body;

        const newCart = {
          product_id,
          title,
          price,
          category,
          image,
          user_email,
          quantity,
          total_price,
        };
        const option = { upsert: true };
        const query = { _id: ObjectId(productId) };
        const upDoc = {
          $set: newCart,
        };
        const cartRes = await singleCartCollection.updateOne(
          query,
          upDoc,
          option
        );
        res.send(cartRes);
      }
    );

    // fetch one item in my single cart product
    app.get(
      "/single-cart-product/:pId",
      async (req: Request, res: Response) => {
        const pId = req.params.pId;
        const cartRes = await singleCartCollection.findOne({ product_id: pId });
        res.send(cartRes);
      }
    );

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
