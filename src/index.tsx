import express, { Express, Request, Response } from "express";
import { resolve } from "path/win32";

// Server setup
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app: Express = express();
var jwt = require("jsonwebtoken");

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

const verifyJWT = async (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(403).send({ message: "Unauthorized Access" });

  const token = authHeader.split(" ")[1];

  if (token) {
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN,
      function (err: any, decoded: any) {
        if (err) {
          return res.status(401).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
      }
    );
  }
};

async function run() {
  try {
    await client.connect();
    // product collection
    const productsCollection = client.db("Products").collection("product");
    const cartCollection = client.db("Products").collection("cart");
    const orderCollection = client.db("Products").collection("orders");

    const userCollection = client.db("Users").collection("user");

    // add user to the database
    app.put("/user/:email", async (req: Request, res: Response) => {
      const email = req.params.email;
      const result = await userCollection.updateOne(
        { email: email },
        { $set: { email } },
        { upsert: true }
      );
      const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ result, token });
    });

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
    // check in  cart and view product
    app.get(
      "/view-product/:productId/:email",
      async (req: Request, res: Response) => {
        const email = req.params.email;
        const id = req.params.productId;
        const filterP = await cartCollection
          .aggregate([
            { $unwind: "$product" },
            { $match: { user_email: email, "product._id": id } },
          ])
          .toArray();

        let result = await productsCollection.findOne({
          _id: ObjectId(id),
        });

        const exist = filterP.some((f: any) => f?.product?._id == id);

        let cardHandler: boolean;
        if (exist) {
          cardHandler = true;
        } else {
          cardHandler = false;
        }
        result["cardHandler"] = cardHandler;
        res.send(result);
      }
    );

    // fetch my added product in my cart page
    app.get(
      "/my-cart-items/:userEmail",
      async (req: Request, res: Response) => {
        const userEmail = req.params.userEmail;
        const cartRes = await cartCollection.findOne({ user_email: userEmail });
        res.send(cartRes);
      }
    );

    /* fetch one single product to purchase page when user click to buy now button 
    and this product also add to my-cart page*/
    app.get(
      "/my-cart-item/:pId/:userEmail",
      async (req: Request, res: Response) => {
        const pId = req.params.pId;
        const email = req.params.userEmail;
        const findP = await cartCollection
          .aggregate([
            { $unwind: "$product" },
            { $match: { "product._id": pId, user_email: email } },
          ])
          .toArray();
        findP.map((p: any) => res.send(p));
      }
    );

    // update quantity of product in my-cart
    app.put(
      "/up-cart-qty-ttl-price/:pId/:email",
      async (req: Request, res: Response) => {
        const pId = req.params.pId;
        const user_email = req.params.email;
        const { quantity, total_price, total_discount } = req.body;
        const fill = { user_email: user_email, "product._id": pId };
        const result = await cartCollection.updateOne(
          fill,
          {
            $set: {
              "product.$.quantity": quantity,
              "product.$.total_price": total_price,
              "product.$.total_discount": total_discount,
            },
          },
          { upsert: true }
        );
        res.send(result);
      }
    );

    // remove item form cart with item cart id and email
    app.delete(
      "/delete-cart-item/:pcId/:email",
      async (req: Request, res: Response) => {
        const pcId = req.params.pcId;
        const email = req.params.email;
        const res2 = await cartCollection.updateOne(
          { user_email: email },
          { $pull: { product: { _id: pcId } } }
        );
        res.send(res2);
      }
    );

    // inserting product into my cart api
    app.put("/my-cart/:email", async (req: Request, res: Response) => {
      let newProduct;
      const email = req.params.email;
      const body = req.body;
      const options = { upsert: true };
      const query = { user_email: email };
      const existsProduct = await cartCollection.findOne({ user_email: email });
      if (existsProduct) {
        const productArr: any[] = existsProduct?.product
          ? existsProduct?.product
          : [];
        if (productArr.length > 0) {
          for (let i = 0; i < productArr.length; i++) {
            let elem = productArr[i]._id;
            if (elem === body?._id) {
              res.send({ message: "Product Has Already In Your Cart" });
              return;
            } else {
              newProduct = [...productArr, body];
            }
          }
        } else {
          newProduct = [body];
        }
      } else {
        newProduct = [body];
      }

      const up = {
        $set: { product: newProduct },
      };

      const cartRes = await cartCollection.updateOne(query, up, options);
      res.send({
        data: cartRes,
        message: "Product Successfully Added To Your Cart",
      });
    });

    // order address add api
    app.put("/add-address/:userEmail", async (req: Request, res: Response) => {
      const userEmail = req.params.userEmail;
      const body = req.body;
      const result = await cartCollection.updateOne(
        { user_email: userEmail },
        { $set: { address: body } },
        { upsert: true }
      );
      res.send(result);
    });

    // update select_address in address to confirm for order api
    app.put(
      "/select-address/:userEmail",
      async (req: Request, res: Response) => {
        const userEmail = req.params.userEmail;
        const body = req.body;
        const result = await cartCollection.updateOne(
          { user_email: userEmail },
          { $set: { "address.select_address": body?.select_address } },
          { upsert: true }
        );
        res.send(result);
      }
    );

    // delete or remove address from cart
    app.delete(
      "/delete-address/:email",
      async (req: Request, res: Response) => {
        const email = req.params.email;
        const result = await cartCollection.updateOne(
          { user_email: email },
          { $set: { address: null } },
          { upsert: true }
        );
        res.send(result);
      }
    );

    // get order address
    app.get("/cart-address/:userEmail", async (req: Request, res: Response) => {
      const userEmail = req.params.userEmail;
      const result = await cartCollection.findOne({
        user_email: userEmail,
      });
      res.send(result);
    });

    // set order api call
    app.post("/set-order/:userEmail", async (req: Request, res: Response) => {
      const userEmail = req.params.userEmail;
      const body = req.body;

      const result = await orderCollection.updateOne(
        { user_email: userEmail },
        { $push: { orders: body } },
        { upsert: true }
      );
      const order = await orderCollection.findOne({ user_email: userEmail });

      let orderId;
      if (order) {
        let getOrder = order?.orders;
        orderId = getOrder.find((i: any) => i.orderId === body?.orderId);
      }
      res.send({ result, orderId: orderId?.orderId });
    });

    // get my order list in my-order page
    app.get("/my-order/:email", async (req: Request, res: Response) => {
      const email = req.params.email;
      res.send(await orderCollection.findOne({ user_email: email }));
    });

    // cancel orders
    app.delete(
      "/cancel-order/:email/:orderId",
      async (req: Request, res: Response) => {
        const email = req.params.email;
        const id = parseInt(req.params.orderId);

        const result = await orderCollection.updateOne(
          { user_email: email },
          { $pull: { orders: { orderId: id } } }
        );
        res.send(result);
      }
    );

    // update order status by admin
    app.put(
      "/update-order-status/:email/:id/:status",
      async (req: Request, res: Response) => {
        const email = req.params.email;
        const orderId = parseInt(req.params.id);
        const status = req.params.status;

        const rs = await orderCollection.updateOne(
          { user_email: email, "orders.orderId": orderId },
          { $set: { "orders.$.status": status } },
          { upsert: true }
        );
        res.send(rs);
      }
    );

    // get order list
    app.get("/get-orderlist/:orderId", async (req: Request, res: Response) => {
      const order_id = parseInt(req.params.orderId);
      const result = await orderCollection.findOne({ orderId: order_id });
      res.send(result);
    });

    /// find orderId
    app.get("/manage-orders/:filter", async (req: Request, res: Response) => {
      const filter = req.params.filter;
      let result: any;

      if (filter === "all") {
        result = await orderCollection
          .aggregate([{ $unwind: "$orders" }])
          .toArray();
      } else {
        result = await orderCollection
          .aggregate([
            { $unwind: "$orders" },
            { $match: { "orders.status": filter } },
          ])
          .toArray();
      }
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
