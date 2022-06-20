import express, { Express, Request, Response } from "express";

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

// verifying jwt token
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
          return res.status(401).send({ message: err.message });
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
    const reviewCollection = client.db("Products").collection("review");

    // // verify owner
    const verifyOwner = async (req: Request, res: Response, next: any) => {
      const authEmail = req.decoded.email;
      const findOwnerInDB = await userCollection.findOne({
        email: authEmail && authEmail,
      });

      if (findOwnerInDB.role === "owner") {
        next();
      } else {
        res.status(403).send({ message: "Unauthorized" });
      }
    };

    // get product by some condition in manage product page api
    app.get('/api/products', async(req:Request, res:Response) => {
      const item : any = req.query.items;
      const page : any = req.query.page;
      const cursor = productsCollection.find({});

      let result;

      if (item || page) {
        result = await cursor.skip(parseInt(item) * parseInt(page)).limit(5).toArray();
      } else {
        result = await cursor.toArray();
      }

      res.send(result);
    })


    // product count
    app.get('/api/product-count', async(req:Request, res:Response) => {
      const count = await productsCollection.estimatedDocumentCount();
      res.send({count});
    })

    // update data
    app.put(
      "/update-profile-data/:email",
      async (req: Request, res: Response) => {
        const email = req.params.email;
        const data = req.body;
        const result = await userCollection.updateOne(
          { email: email },
          { $set: req.body },
          { upsert: true }
        );
        res.status(200).send(result);
      }
    );

    // fetch myProfile data in my profile page
    app.get("/my-profile/:email", async (req: Request, res: Response) => {
      const email = req.params.email;
      res.status(200).send(await userCollection.findOne({ email: email }));
    });

    // make admin request
    app.put(
      "/make-admin/:userId",
      verifyJWT,
      verifyOwner,
      async (req: Request, res: Response) => {
        const userId: string = req.params.userId;
        res.send(
          await userCollection.updateOne(
            { _id: ObjectId(userId) },
            { $set: { role: "admin" } },
            { upsert: true }
          )
        );
      }
    );

    // get all user in allUser Page
    app.get("/all-users", async (req: Request, res: Response) => {
      res.send(await userCollection.find({ role: { $ne: "owner" } }).toArray());
    });

    // get owner, admin and user from database
    app.get("/fetch-auth/:email", async (req: Request, res: Response) => {
      const email = req.params.email;
      const token = req.headers.authorization?.split(" ")[1];

      if (token) {
        const result = await userCollection.findOne({ email: email });

        if (result && result.role === "owner") {
          res.status(200).send({ role: "owner" });
        }

        if (result && result.role === "admin") {
          res.status(200).send({ role: "admin" });
        }
      } else {
        return res.status(403).send({ message: "Header Missing" });
      }
    });

    // add user to the database
    app.put("/user/:email", async (req: Request, res: Response) => {
      const email = req.params.email;
      const findUser = await userCollection.findOne({ email: email });

      let updateDocuments: any;

      updateDocuments =
        findUser && findUser?.role !== ""
          ? { $set: { email } }
          : { $set: { email, role: "user" } };

      const result = await userCollection.updateOne(
        { email: email },
        updateDocuments,
        { upsert: true }
      );
      const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
        algorithm: "HS256",
        expiresIn: "2h",
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

    // fetch product by category
    app.get(
      "/product-category/:category",
      async (req: Request, res: Response) => {
        const productCategory = req.params.category;
        const findP = await productsCollection
          .find({
            category: productCategory,
          })
          .toArray();
        res.send(findP);
      }
    );

    // upsert review in product
    app.put("/add-rating/:email", async (req: Request, res: Response) => {
      const email = req.params.email;
      const body = req.body;
      let newRating;

      const findRating = await reviewCollection.findOne({
        user_email: email,
      });
      if (findRating) {
        const productArr: any[] = findRating?.rating ? findRating?.rating : [];
        if (productArr.length > 0) {
          for (let i = 0; i < productArr.length; i++) {
            let elem = productArr[i].rating_id;
            if (elem === body?.rating_id) {
              res.send({ message: "Product Has Already In Your Cart" });
              return;
            } else {
              newRating = [...productArr, body];
            }
          }
        } else {
          newRating = [body];
        }
      } else {
        newRating = [body];
      }

      const products = await productsCollection.findOne({
        _id: ObjectId(body?.product_id),
      });

      const point = parseInt(body?.rating_point);

      let newRatingPoint = products?.rating;

      let rat1: any = parseInt(newRatingPoint[4]?.count) || 0;
      let rat2: any = parseInt(newRatingPoint[3]?.count) || 0;
      let rat3: any = parseInt(newRatingPoint[2]?.count) || 0;
      let rat4: any = parseInt(newRatingPoint[1]?.count) || 0;
      let rat5: any = parseInt(newRatingPoint[0]?.count) || 0;

      if (point === 5) {
        rat5 += 1;
      } else if (point === 4) {
        rat4 += 1;
      } else if (point === 3) {
        rat3 += 1;
      } else if (point === 2) {
        rat2 += 1;
      } else {
        rat1 += 1;
      }

      let ratingArr: any[] = [
        { weight: 5, count: rat5 },
        { weight: 4, count: rat4 },
        { weight: 3, count: rat3 },
        { weight: 2, count: rat2 },
        { weight: 1, count: rat1 },
      ];

      await productsCollection.updateOne(
        { _id: ObjectId(body?.product_id) },
        { $set: { rating: ratingArr } },
        { upsert: true }
      );

      const result = await reviewCollection.updateOne(
        { user_email: email },
        { $set: { rating: newRating } },
        { upsert: true }
      );
      res.send(result);
    });

    // my review
    app.get("/my-review/:email", async (req: Request, res: Response) => {
      const email = req.params.email;
      const result = await reviewCollection
        .aggregate([{ $unwind: "$rating" }, { $match: { user_email: email } }])
        .toArray();
      res.send(result);
    });

    // product review fetch
    app.get(
      "/product-review/:productId",
      async (req: Request, res: Response) => {
        const pId = req.params.productId;
        const result = await reviewCollection
          .aggregate([
            { $unwind: "$rating" },
            { $match: { "rating.product_id": pId } },
          ])
          .toArray();
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

      if (body?.product.length <= 0) {
        res.send({
          message: "Order Cancelled. You Have To Select Atleast One Product",
        });
      } else if (body?.address === null) {
        res.send({ message: "We Can Not Find Any Address In Your Order List" });
      } else if (body?.address?.select_address === false) {
        res.send({ message: "Address Not Selected" });
      } else {
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
      }
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

        let time: string = new Date().toLocaleString();
        let upDoc: any;

        if (status === "placed") {
          upDoc = {
            $set: {
              "orders.$.status": status,
              "orders.$.time_placed": time,
            },
          };
        } else if (status === "shipped") {
          upDoc = {
            $set: {
              "orders.$.status": status,
              "orders.$.time_shipped": time,
            },
          };
        }

        const rs = await orderCollection.updateOne(
          { user_email: email, "orders.orderId": orderId },
          upDoc,
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
    app.get("/manage-orders/", async (req: Request, res: Response) => {
      const result = await orderCollection
        .aggregate([{ $unwind: "$orders" }])
        .toArray();

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
