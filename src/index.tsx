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
    const addressCollection = client
      .db("Products")
      .collection("deliveryAddress");

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
        product: { $elemMatch: { _id: productId } },
      });

      let cardHandler: boolean;

      if (findCart?._id === productId) {
        cardHandler = true;
      } else {
        cardHandler = false;
      }

      result["cardHandler"] = cardHandler;

      res.send(result);
    });

    // fetch my added product in my cart page
    app.get(
      "/my-cart-items/:userEmail",
      async (req: Request, res: Response) => {
        const userEmail = req.params.userEmail;
        const cartRes = await cartCollection.findOne({ user_email: userEmail });
        res.send(cartRes);
      }
    );

    /* fetch one single product to purchase page when user click to buy now button and this product also add to my-cart page*/
    app.get(
      "/my-cart-item/:pId/:userEmail",
      async (req: Request, res: Response) => {
        const pId = req.params.pId;
        const userEmail = req.params.userEmail;
        const cartRes = await cartCollection.findOne({
          product: { $elemMatch: { _id: pId } },
        });

        if (cartRes?._id === pId) {
          res.send(cartRes);
        }
      }
    );

    // update product quantity and total price in cart
    // app.put(
    //   "/up-cart-qty-ttl-price/:pId",
    //   async (req: Request, res: Response) => {
    //     const pId = req.params.pId;
    //     const { quantity, total_price } = req.body;

    //     const fill = { _id: ObjectId(pId) };
    //     const result = await cartCollection.updateOne(
    //       fill,
    //       { $set: { quantity: quantity, total_price: total_price } },
    //       { upsert: true }
    //     );
    //     res.send(result);
    //   }
    // );

    app.put(
      "/up-cart-qty-ttl-price/:pId/:email",
      async (req: Request, res: Response) => {
        const pId = req.params.pId;
        const user_email = req.params.email;
        const { quantity, total_price } = req.body;
        const fill = { user_email: user_email, "product._id": pId };
        const result = await cartCollection.updateOne(
          fill,
          {
            $set: {
              "product.$.quantity": quantity,
              "product.$.total_price": total_price,
            },
          },
          { upsert: true }
        );
        res.send(result);
      }
    );

    // remove item form cart with item cart id
    app.delete(
      "/delete-cart-item/:pcId/:email",
      async (req: Request, res: Response) => {
        const pcId = req.params.pcId;
        const email = req.params.email;
        const res2 = await cartCollection.updateOne(
          {
            user_email: email,
          },
          {
            $pull: {
              product: {
                _id: pcId,
              },
            },
          }
        );
        res.send(res2);
      }
    );

    app.put("/my-cart/:email", async (req: Request, res: Response) => {
      const email = req.params.email;
      const body = req.body;
      const options = { upsert: true };
      const query = { user_email: email };
      const existsProduct = await cartCollection.findOne({ user_email: email });

      let newProduct;

      if (existsProduct) {
        const productArr = existsProduct?.product;

        for (let i = 0; i < productArr.length; i++) {
          let elem = productArr[i]._id;
          if (elem === body?._id) {
            res.send({ message: "Already added" });
            return;
          } else {
            newProduct = [...productArr, body];
          }
        }
      } else {
        newProduct = [body];
      }

      const up = {
        $set: { product: newProduct },
      };

      const cartRes = await cartCollection.updateOne(query, up, options);
      res.send(cartRes);
    });

    // add product to the cart
    // app.put("/my-cart/:pId", async (req: Request, res: Response) => {
    //   const productId = req.params.pId;
    //   const {
    //     _id: product_id,
    //     title,
    //     price,
    //     category,
    //     image,
    //     quantity,
    //     total_price,
    //     user_email,
    //   } = req.body;

    //   const newCart = {
    //     product_id,
    //     title,
    //     price,
    //     category,
    //     image,
    //     user_email,
    //     quantity,
    //     total_price,
    //   };
    //   const option = { upsert: true };
    //   const query = { product_id: productId };
    //   const upDoc = {
    //     $set: newCart,
    //   };
    //   const cartRes = await cartCollection.updateOne(query, upDoc, option);
    //   res.send(cartRes);
    // });

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

        const result = await addressCollection.updateOne(
          query,
          updateDoc,
          option
        );
        res.send(result);
      }
    );

    // get order address
    app.get("/cart-address/:userEmail", async (req: Request, res: Response) => {
      const userEmail = req.params.userEmail;
      const result = await addressCollection.findOne({
        user_email: userEmail,
      });
      res.send(result);
    });

    /// jdfhdfjbjdfbj
    app.post("/set-order/:userEmail", async (req: Request, res: Response) => {
      const userEmail = req.params.userEmail;
      const body = req.body;

      // const query = { user_email: userEmail };
      body["user_email"] = userEmail;
      const result = await orderCollection.insertOne(body);
      const order = await orderCollection.findOne({
        user_email: userEmail,
        orderId: body?.orderId,
      });
      res.send({ result, orderId: order?.orderId });
    });

    // get order list
    app.get("/get-orderlist/:orderId", async (req: Request, res: Response) => {
      const order_id = parseInt(req.params.orderId);
      const result = await orderCollection.findOne({ orderId: order_id });
      res.send(result);
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
