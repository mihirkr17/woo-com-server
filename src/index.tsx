import express, { Express, Request, Response } from "express";
const { dbh } = require("./database/db");
const { errorHandlers } = require("./errors/errors");
const cookieParser = require("cookie-parser");
const { productModel, productUpdateModel } = require("./model/product");
const { orderModel } = require("./model/order");

const {
  verifyJWT,
  verifyAuth,
  verifySeller,
  verifyUser,
} = require("./authentication/auth");

// Server setup
const { ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app: Express = express();
var jwt = require("jsonwebtoken");

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
const port = process.env.PORT || 5000;

async function run() {
  try {
    // product collection
    await dbh.connect();
    const productsCollection = dbh.db("Products").collection("product");
    const orderCollection = dbh.db("Products").collection("orders");
    const userCollection = dbh.db("Users").collection("user");
    const productPolicy = dbh.db("Products").collection("policy");

    const updateProducts = async (
      productId: string,
      quantity: number = 0
    ) => {
      const products = await productsCollection.findOne({
        _id: ObjectId(productId),
      });

      let availableProduct = products?.available;

      let restAvailable = availableProduct - quantity;

      let stock = restAvailable <= 1 ? "out" : "in";

      await productsCollection.updateOne(
        { _id: ObjectId(productId) },
        { $set: { available: restAvailable, stock } },
        { upsert: true }
      );

      await userCollection.updateMany(
        { "myCartProduct._id": productId },
        {
          $set: {
            "myCartProduct.$.available": restAvailable,
            "myCartProduct.$.stock": stock,
          },
        },
        { upsert: true }
      );
    };

    /*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    ++++++++++ Authorization api request endpoints Start ++++++++++++
    +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
    // add user to the database
    app.put("/api/sign-user", async (req: Request, res: Response) => {
      try {
        const authEmail = req.headers.authorization?.split(" ")[1];
        const { name } = req.body;

        if (!authEmail) {
          return res.status(400).send({ message: "Bad request" });
        }

        const token = jwt.sign({ email: authEmail }, process.env.ACCESS_TOKEN, {
          algorithm: "HS256",
          expiresIn: "1h",
        });

        const cookieObject: any = {
          sameSite: "none",
          secure: true,
          maxAge: 9000000, //3600000
          httpOnly: true,
        };

        if (authEmail) {
          const existsUser = await userCollection.findOne({ email: authEmail });

          if (existsUser) {
            res.cookie("token", token, cookieObject);
            return res.status(200).send({ message: "Login success" });
          } else {
            await userCollection.updateOne(
              { email: authEmail },
              { $set: { email: authEmail, displayName: name, role: "user" } },
              { upsert: true }
            );

            res.cookie("token", token, cookieObject);
            return res.status(200).send({ message: "Login success" });
          }
        }
      } catch (error: any) {
        res.status(500).send({ message: error.message });
      }
    });

    // fetch user information from database and send to client
    app.get("/api/fetch-auth-user/", async (req: Request, res: Response) => {
      try {
        const authEmail = req.headers.authorization?.split(" ")[1];

        if (authEmail) {
          await userCollection.updateOne(
            { email: authEmail },
            { $pull: { myCartProduct: { stock: "out" } } }
          );

          const result = await userCollection.findOne({ email: authEmail });
          return res.status(200).send({ result });
        } else {
          return res.status(400).send({ message: "Bad request" });
        }
      } catch (error: any) {
        res.status(500).send({ message: error.message });
      }
    });

    app.get("/api/sign-out", async (req: Request, res: Response) => {
      res.clearCookie("token");
      res.status(200).send({ message: "Sign out successfully" });
    });

    app.put(
      "/api/switch-role/:role",
      verifyJWT,
      async (req: Request, res: Response) => {
        const userEmail = req.decoded.email;
        const userID = req.headers.authorization?.split(" ")[1];
        const userRole: string = req.params.role;
        let roleModel: any;

        if (!userID) {
          return res
            .status(400)
            .send({ message: "Bad request! headers is missing" });
        }

        if (userRole === "user") {
          roleModel = { role: "user" };
        }

        if (userRole === "seller") {
          roleModel = { role: "seller" };
        }

        if (userID) {
          const result = await userCollection.updateOne(
            { _id: ObjectId(userID), email: userEmail },
            { $set: roleModel },
            { upsert: true }
          );

          if (result) return res.status(200).send(result);
        }
      }
    );
    /*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    ++++++++++ Authorization api request endpoints End ++++++++++++
    +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

    /// privacy policy fetch
    app.get("/api/privacy-policy", async (req: Request, res: Response) => {
      res.status(200).send(await productPolicy.findOne({}));
    });

    /// update policy
    app.put(
      "/api/update-policy/:policyId",
      verifyJWT,
      async (req: Request, res: Response) => {
        const policyId: string = req.params.policyId;
        const body = req.body;
        const result = await productPolicy.updateOne(
          { _id: ObjectId(policyId) },
          { $set: body },
          { upsert: true }
        );

        if (result) {
          return res
            .status(200)
            .send({ message: "Policy updated successfully" });
        } else {
          return res.status(400).send({ message: "Update failed" });
        }
      }
    );

    // search product api
    app.get("/api/search-products/:q", async (req: Request, res: Response) => {
      const q = req.params.q;
      const searchQuery = (sTxt: string) => {
        let findProduct: any = {
          $or: [
            { title: { $regex: sTxt, $options: "i" } },
            { seller: { $regex: sTxt, $options: "i" } },
            { brand: { $regex: sTxt, $options: "i" } },
            { "genre.category": { $regex: sTxt, $options: "i" } },
          ],
        };
        return findProduct;
      };

      const result = await productsCollection.find(searchQuery(q)).toArray();
      res.status(200).send(result);
    });

    // fetch products by recommended
    app.get(
      "/api/products/recommended",
      async (req: Request, res: Response) => {
        res
          .status(200)
          .send(
            await productsCollection
              .find({ status: "active", save_as: "fulfilled" })
              .sort({ rating_average: -1 })
              .limit(6)
              .toArray()
          );
      }
    );

    // get products by some condition in manage product page api
    app.get("/api/manage-product", async (req: Request, res: Response) => {
      let item: any;
      let page: any;
      let seller_name: any = req.query.seller;
      item = req.query.items;
      page = req.query.page;
      let searchText: any = req.query.search;
      let filters: any = req.query.category;
      let cursor: any;
      let result: any;

      const searchQuery = (sTxt: string, seller_name: string = "") => {
        item = "";
        page = "";
        let findProduct: any = {
          $or: [
            { title: { $regex: sTxt, $options: "i" } },
            { seller: { $regex: sTxt, $options: "i" } },
          ],
        };
        if (seller_name) {
          findProduct["seller"] = seller_name;
        }
        return findProduct;
      };

      const filterQuery = (category: string, seller_name: string = "") => {
        item = "";
        page = "";
        let findProduct: any = {
          "genre.category": category,
        };
        if (seller_name) {
          findProduct["seller"] = seller_name;
        }
        return findProduct;
      };

      page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;

      try {
        cursor =
          searchText && searchText.length > 0
            ? productsCollection.find(
                searchQuery(searchText, seller_name || "")
              )
            : filters && filters !== "all"
            ? productsCollection.find(filterQuery(filters, seller_name || ""))
            : productsCollection.find(
                (seller_name && { seller: seller_name }) || {}
              );

        if (item || page) {
          result = await cursor
            .skip(page * parseInt(item))
            .limit(parseInt(item))
            .toArray();
        } else {
          result = await cursor.toArray();
        }

        res.status(200).send(result);
      } catch (error: any) {
        res.status(500).send({ message: error?.message });
      }
    });

    // product count
    app.get("/api/product-count", async (req: Request, res: Response) => {
      const seller = req.query.seller;
      let result = await productsCollection.countDocuments(
        seller && { seller: seller }
      );
      res.status(200).send({ count: result });
    });

    // Delete product from manage product page
    app.delete(
      "/api/delete-product/:productId",
      verifyJWT,
      async (req: Request, res: Response) => {
        const productId: string = req.params.productId;
        try {
          const result = await productsCollection.deleteOne({
            _id: ObjectId(productId),
          });

          if (result) {
            await userCollection.updateMany(
              { "myCartProduct._id": productId },
              { $pull: { myCartProduct: { _id: productId } } }
            );
            return res
              .status(200)
              .send({ message: "Product deleted successfully." });
          } else {
            return res.status(503).send({ message: "Service unavailable" });
          }
        } catch (error: any) {
          res.status(500).send({ message: error?.message });
        }
      }
    );

    // update product information
    app.put(
      "/api/update-product/:productId",
      verifyJWT,
      async (req: Request, res: Response) => {
        const productId = req.params.productId;
        const body = req.body;
        const model = productUpdateModel(body);

        const exists =
          (await userCollection
            .find({ "myCartProduct._id": productId })
            .toArray()) || [];

        if (exists && exists.length > 0) {
          await userCollection.updateMany(
            { "myCartProduct._id": productId },
            {
              $pull: { myCartProduct: { _id: productId } },
            }
          );
        }

        const result = await productsCollection.updateOne(
          { _id: ObjectId(productId) },
          { $set: model },
          { upsert: true }
        );

        res
          .status(200)
          .send(result && { message: "Product updated successfully" });
      }
    );

    // update stock
    app.put(
      "/api/update-stock/",
      verifyJWT,
      verifySeller,
      async (req: Request, res: Response) => {
        try {
          const productId = req.headers.authorization;
          const body = req.body;

          let stock = body?.available <= 1 ? "out" : "in";

          if (productId && body) {
            const result = await productsCollection.updateOne(
              { _id: ObjectId(productId) },
              { $set: { available: body?.available, stock } },
              { upsert: true }
            );

            res.status(200).send(result);
          }
        } catch (error: any) {
          res.status(500).send({ message: error?.message });
        }
      }
    );

    // update data
    app.put(
      "/api/update-profile-data/:email",
      verifyJWT,
      async (req: Request, res: Response) => {
        const email: string = req.decoded.email;
        const result = await userCollection.updateOne(
          { email: email },
          { $set: req.body },
          { upsert: true }
        );
        res.status(200).send(result);
      }
    );

    // make admin request
    app.put(
      "/make-admin/:userId",
      verifyJWT,
      verifyAuth,
      async (req: Request, res: Response) => {
        const userId: string = req.params.userId;
        res
          .status(200)
          .send(
            await userCollection.updateOne(
              { _id: ObjectId(userId) },
              { $set: { role: "admin" } },
              { upsert: true }
            )
          );
      }
    );

    // demote to user request
    app.put(
      "/api/demote-to-user/:userId",
      verifyJWT,
      verifyAuth,
      async (req: Request, res: Response) => {
        const userId: string = req.params.userId;
        res
          .status(200)
          .send(
            await userCollection.updateOne(
              { _id: ObjectId(userId) },
              { $set: { role: "user" } },
              { upsert: true }
            )
          );
      }
    );

    // get all user in allUser Page
    app.get("/api/manage-user", async (req: Request, res: Response) => {
      const uType = req.query.uTyp;
      res
        .status(200)
        .send(await userCollection.find({ role: uType }).toArray());
    });

    // make seller request
    app.put(
      "/api/make-seller-request/:userEmail",
      async (req: Request, res: Response) => {
        const userEmail = req.params.userEmail;
        let body = req.body;
        let existSellerName;

        if (body?.seller) {
          existSellerName = await userCollection.findOne({
            seller: body?.seller,
          });
        }

        if (existSellerName) {
          return res
            .status(200)
            .send({ message: "Seller name exists ! try to another" });
        } else {
          const result = await userCollection.updateOne(
            { email: userEmail },
            {
              $set: body,
            },
            { upsert: true }
          );
          res.status(200).send({ result, message: "success" });
        }
      }
    );

    //    api/check-seller-request
    app.get(
      "/api/check-seller-request",
      async (req: Request, res: Response) => {
        res
          .status(200)
          .send(
            await userCollection.find({ seller_request: "pending" }).toArray()
          );
      }
    );

    // api/make-seller-request
    app.put(
      "/api/permit-seller-request/:userId",
      verifyJWT,
      verifyAuth,
      async (req: Request, res: Response) => {
        const userId: string = req.params.userId;

        const result = await userCollection.updateOne(
          { _id: ObjectId(userId) },
          {
            $set: { role: "seller", seller_request: "ok", isSeller: true },
          },
          { upsert: true }
        );
        result?.acknowledged
          ? res.status(200).send({ message: "Request Success" })
          : res.status(400).send({ message: "Bad Request" });
      }
    );

    // inserting product into database
    app.post(
      "/api/add-product",
      verifyJWT,
      async (req: Request, res: Response) => {
        const body = req.body;
        try {
          const model = productModel(body);
          await productsCollection.insertOne(model);
          res.status(200).send({ message: "Product added successfully" });
        } catch (error: any) {
          res.status(500).send({ message: error.message });
        }
      }
    );

    // finding all Products
    app.get("/all-products/:limits", async (req: Request, res: Response) => {
      const totalLimits = parseInt(req.params.limits);
      const results = await productsCollection
        .find({ status: "active", save_as: "fulfilled" })
        .sort({ _id: -1 })
        .limit(totalLimits)
        .toArray();
      res.status(200).send(results);
    });

    // Fetch single product
    // check in  cart and view product
    app.get(
      "/api/fetch-single-product/:product_slug/:email",
      async (req: Request, res: Response) => {
        const email = req.params.email;
        const product_slug = req.params.product_slug;
        let inCart: boolean;
        let inWishlist: boolean;

        let result = await productsCollection.findOne({
          slug: product_slug,
          status: "active",
          save_as: "fulfilled",
        });

        if (result) {
          const policy = await productPolicy.findOne({});

          const existProductInCart = await userCollection.findOne(
            { email: email, "myCartProduct.slug": product_slug },
            { "myCartProduct.$": 1 }
          );

          const existProductInWishlist = await userCollection.findOne(
            { email: email, "wishlist.slug": product_slug },
            { "wishlist.$": 1 }
          );
          if (existProductInWishlist) {
            inWishlist = true;
          } else {
            inWishlist = false;
          }
          await productsCollection.createIndex({ slug: 1 });

          if (existProductInCart) {
            inCart = true;
          } else {
            inCart = false;
          }
          result["inCart"] = inCart;
          result["policy"] = policy;
          result["inWishlist"] = inWishlist;
          res.status(200).send(result);
        } else {
          return res.status(404).send({ message: "Not Found" });
        }
      }
    );

    // fetch single product by id and seller
    app.get(
      "/api/fetch-single-product-by-pid",
      async (req: Request, res: Response) => {
        const productId = req.query.pid;
        const seller = req.query.seller;

        try {
          return res.status(200).send(
            await productsCollection.findOne({
              _id: ObjectId(productId),
              seller: seller,
            })
          );
        } catch (error) {
          return res.status(500).send({ message: error });
        }
      }
    );

    // fetch product by category
    app.get("/api/product-by-category", async (req: Request, res: Response) => {
      let findQuery: any;
      const productCategory = req.query.category;
      const productSubCategory = req.query.sb_category;
      const productPostCategory = req.query.pt_category;
      const filters = req.query.filters;
      let sorting;

      if (filters) {
        if (filters === "lowest") {
          sorting = { price_fixed: 1 };
        } else if (filters === "highest") {
          sorting = { price_fixed: -1 };
        } else {
          sorting = {};
        }
      }

      if (productCategory) {
        findQuery = {
          "genre.category": productCategory,
          status: "active",
          save_as: "fulfilled",
        };
      }

      if (productCategory && productSubCategory) {
        findQuery = {
          "genre.category": productCategory,
          "genre.sub_category": productSubCategory,
          status: "active",
          save_as: "fulfilled",
        };
      }

      if (productCategory && productSubCategory && productPostCategory) {
        findQuery = {
          "genre.category": productCategory,
          "genre.sub_category": productSubCategory,
          "genre.post_category": productPostCategory,
          status: "active",
          save_as: "fulfilled",
        };
      }

      const tt = await productsCollection
        .find(findQuery, { price_fixed: { $exists: 1 } })
        .sort(sorting)
        .toArray();
      res.status(200).send(tt);
    });

    // Add rating and review in products
    app.put(
      "/api/add-product-rating/:productId",
      verifyJWT,
      async (req: Request, res: Response) => {
        const productId = req.params.productId;
        const email = req.decoded.email;
        const body = req.body;
        const orderId = parseInt(body?.orderId);

        await orderCollection.updateOne(
          { user_email: email },
          {
            $set: {
              "orders.$[i].isRating": true,
            },
          },
          { upsert: true, arrayFilters: [{ "i.orderId": orderId }] }
        );

        const products = await productsCollection.findOne({
          _id: ObjectId(productId),
          status: "active",
          save_as: "fulfilled",
        });

        const point = parseInt(body?.rating_point);

        let ratingPoints =
          products?.rating && products?.rating.length > 0
            ? products?.rating
            : [
                { weight: 5, count: 0 },
                { weight: 4, count: 0 },
                { weight: 3, count: 0 },
                { weight: 2, count: 0 },
                { weight: 1, count: 0 },
              ];

        let counter: number = 0;
        let newRatingArray: any[] = [];

        for (let i = 0; i < ratingPoints.length; i++) {
          let count = ratingPoints[i].count;
          let weight = ratingPoints[i].weight;
          if (point === weight) {
            counter = count;
            count += 1;
          }
          newRatingArray.push({ weight, count: count });
        }

        let weightVal: number = 0;
        let countValue: number = 0;

        newRatingArray &&
          newRatingArray.length > 0 &&
          newRatingArray.forEach((rat: any) => {
            const multiWeight = parseInt(rat?.weight) * parseInt(rat?.count);
            weightVal += multiWeight;
            countValue += rat?.count;
          });
        const ava = weightVal / countValue;
        const average = parseFloat(ava.toFixed(1));

        let filters: any;
        let options: any;

        if (products?.rating && products?.rating.length > 0) {
          filters = {
            $set: {
              "rating.$[i].count": counter + 1,
              rating_average: average,
            },
            $push: { reviews: body },
          };
          options = { upsert: true, arrayFilters: [{ "i.weight": point }] };
        } else {
          filters = {
            $set: {
              rating: newRatingArray,
              rating_average: average,
            },
            $push: { reviews: body },
          };
          options = { upsert: true };
        }

        const result = await productsCollection.updateOne(
          { _id: ObjectId(productId) },
          filters,
          options
        );

        if (result) {
          return res.status(200).send({ message: "Thanks for your review !" });
        }
      }
    );

    // update quantity of product in my-cart
    app.put(
      "/api/update-product-quantity/:cartTypes",
      verifyJWT,
      async (req: Request, res: Response) => {
        const userEmail: string = req.decoded.email;
        const cart_types: string = req.params.cartTypes;
        const productId = req.headers.authorization;
        const { quantity } = req.body;
        let updateDocuments: any;
        let filters: any;

        if (!productId) {
          return res
            .status(400)
            .send({ message: "Bad request! headers missing" });
        }

        const availableProduct = await productsCollection.findOne({
          _id: ObjectId(productId),
          available: { $gte: 1 },
          stock: "in",
          status: "active",
          save_as: "fulfilled",
        });

        if (quantity >= availableProduct?.available - 1) {
          return res.status(200).send({
            message: "Your selected quantity out of range in available product",
          });
        }

        const cart = await userCollection.findOne({
          email: userEmail,
        });

        if (availableProduct) {
          if (cart_types === "buy") {
            updateDocuments = {
              $set: {
                "buy_product.quantity": quantity,
                "buy_product.totalAmount":
                  parseFloat(cart?.buy_product?.price) * quantity,
              },
            };

            filters = {
              email: userEmail,
            };
          }

          if (cart_types === "toCart") {
            const cartProduct = cart?.myCartProduct || [];
            let amount;

            for (let i = 0; i < cartProduct.length; i++) {
              let items = cartProduct[i];
              if (items?._id === productId) {
                amount = items?.price * quantity;
              }
            }

            updateDocuments = {
              $set: {
                "myCartProduct.$.quantity": quantity,
                "myCartProduct.$.totalAmount": amount,
              },
            };

            filters = {
              email: userEmail,
              "myCartProduct._id": productId,
            };
          }

          const result = await userCollection.updateOne(
            filters,
            updateDocuments,
            { upsert: true }
          );
          return res.status(200).send(result);
        } else {
          await userCollection.updateOne(
            { email: userEmail },
            { $pull: { myCartProduct: { _id: productId } } }
          );
          return res.status(200).send({
            message:
              "This product is out of stock now and removed from your cart",
          });
        }
      }
    );

    // remove item form cart with item cart id and email
    app.delete(
      "/delete-cart-item/:cartTypes",
      verifyJWT,
      async (req: Request, res: Response) => {
        const productId = req.headers.authorization;
        const userEmail = req.decoded.email;
        const cart_types = req.params.cartTypes;
        let updateDocuments;

        if (!productId) {
          return res
            .status(400)
            .send({ message: "Bad request! headers missing" });
        }

        if (cart_types === "buy") {
          updateDocuments = await userCollection.updateOne(
            { email: userEmail },
            { $unset: { buy_product: "" } }
          );
        } else {
          updateDocuments = await userCollection.updateOne(
            { email: userEmail },
            { $pull: { myCartProduct: { _id: productId } } }
          );
        }

        res
          .status(200)
          .send({ updateDocuments, message: `removed successfully from cart` });
      }
    );

    // add to wishlist
    app.put(
      "/api/add-to-wishlist/:email",
      verifyJWT,
      async (req: Request, res: Response) => {
        const userEmail = req.params.email;
        const verifiedEmail = req.decoded.email;
        const body = req.body;

        if (userEmail !== verifiedEmail) {
          return res.status(403).send({ message: "Forbidden" });
        }
        const existsProduct = await userCollection.findOne(
          {
            email: userEmail,
            "wishlist._id": body?._id,
          },
          {
            "wishlist.$": 1,
          }
        );
        if (existsProduct) {
          return res
            .status(200)
            .send({ message: "Product Has Already In Your Wishlist" });
        } else {
          const up = {
            $push: { wishlist: body },
          };

          const wishlistRes = await userCollection.updateOne(
            { email: userEmail },
            up,
            { upsert: true }
          );
          res.status(200).send({
            data: wishlistRes,
            message: "Product Added To Your wishlist",
          });
        }
      }
    );

    // remove from wishlist
    app.delete(
      "/api/remove-to-wishlist/:productId",
      verifyJWT,
      async (req: Request, res: Response) => {
        const productId = req.params.productId;
        const userEmail = req.decoded.email;
        const result = await userCollection.updateOne(
          { email: userEmail },
          { $pull: { wishlist: { _id: productId } } }
        );

        if (result) {
          return res
            .status(200)
            .send({ message: "Product removed from your wishlist" });
        } else {
          return res.status(501).send({ message: "Service unavailable" });
        }
      }
    );

    // inserting product into my cart api
    app.put(
      "/api/add-to-cart",
      verifyJWT,
      async (req: Request, res: Response) => {
        const email: string = req.decoded.email;
        const body = req.body;

        const availableProduct = await productsCollection.findOne({
          _id: ObjectId(body?._id),
          status: "active",
          save_as: "fulfilled",
        });

        if (
          availableProduct?.stock === "in" &&
          availableProduct?.available > 0
        ) {
          const existsProduct = await userCollection.findOne(
            { email: email, "myCartProduct._id": body?._id },
            { "myCartProduct.$": 1 }
          );

          if (existsProduct) {
            return res
              .status(200)
              .send({ message: "Product Has Already In Your Cart" });
          } else {
            body["addedAt"] = new Date(Date.now());

            const cartRes = await userCollection.updateOne(
              { email: email },
              {
                $push: { myCartProduct: body },
              },
              { upsert: true }
            );
            res.status(200).send({
              data: cartRes,
              message: "Product Successfully Added To Your Cart",
            });
          }
        }
      }
    );

    // buy single product
    app.put(
      "/api/add-buy-product",
      verifyJWT,
      async (req: Request, res: Response) => {
        try {
          const userEmail = req.decoded.email;
          const body = req.body;
          const cartRes = await userCollection.updateOne(
            { email: userEmail },
            { $set: { buy_product: body } },
            { upsert: true }
          );
          res.status(200).send(cartRes);
        } catch (error: any) {
          res.status(500).send({ message: error?.message });
        }
      }
    );

    // inserting address in cart
    app.post(
      "/api/add-cart-address",
      verifyJWT,
      async (req: Request, res: Response) => {
        const userEmail = req.decoded.email;
        const body = req.body;
        const result = await userCollection.updateOne(
          { email: userEmail },
          { $push: { address: body } },
          { upsert: true }
        );
        res.send(result);
      }
    );

    // order address add api
    app.put(
      "/api/update-cart-address",
      verifyJWT,
      async (req: Request, res: Response) => {
        const userEmail = req.decoded.email;
        const body = req.body;

        const result = await userCollection.updateOne(
          { email: userEmail },
          {
            $set: {
              "address.$[i]": body,
            },
          },
          { arrayFilters: [{ "i.addressId": body?.addressId }] }
        );
        res.send(result);
      }
    );

    // update select_address in address to confirm for order api
    app.put(
      "/api/select-address",
      verifyJWT,
      async (req: Request, res: Response) => {
        const userEmail = req.decoded.email;
        const { addressId, select_address } = req.body;

        const addr = await userCollection.findOne({ email: userEmail });
        if (addr) {
          const addressArr = addr?.address;

          if (addressArr && addressArr.length > 0) {
            await userCollection.updateOne(
              { email: userEmail },
              {
                $set: {
                  "address.$[j].select_address": false,
                },
              },
              {
                arrayFilters: [{ "j.addressId": { $ne: addressId } }],
                multi: true,
              }
            );
          }
        }

        let result = await userCollection.updateOne(
          { email: userEmail },
          {
            $set: {
              "address.$[i].select_address": select_address,
            },
          },
          { arrayFilters: [{ "i.addressId": addressId }] }
        );

        res.status(200).send(result);
      }
    );

    // delete or remove address from cart
    app.delete(
      "/api/delete-cart-address/:addressId",
      async (req: Request, res: Response) => {
        const email = req.decoded.email;
        const addressId = parseInt(req.params.addressId);
        const result = await userCollection.updateOne(
          { email: email },
          { $pull: { address: { addressId } } }
        );
        if (result) return res.send(result);
      }
    );

    /*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
      This is order section api operation
    +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    +++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
    // set order api call
    app.post(
      "/api/set-order",
      verifyJWT,
      verifyUser,
      async (req: Request, res: Response) => {
        try {
          const userEmail: string = req.headers.authorization || "";
          const verifiedEmail: string = req.decoded.email;
          const body: any = req.body;

          const products = await productsCollection.findOne({
            _id: ObjectId(body?.productId),
          });

          if (userEmail !== verifiedEmail)
            return res.status(401).send({ message: "Unauthorized access" });

          if (body) {
            if (products && products?.available > body?.quantity) {

              await updateProducts(body?.productId, body?.quantity);

              let model = orderModel(body);

              const result = await orderCollection.updateOne(
                { user_email: userEmail },
                { $push: { orders: model } },
                { upsert: true }
              );
              res.status(200).send(result && { message: "Order success" });
            } else {
              return res.status(400).send({
                message:
                  "Order not taken because this product not available rights now!",
              });
            }
          } else {
            return res.status(400).send({ message: "Bad request!" });
          }
        } catch (error: any) {
          res.status(500).send({ message: error?.message });
        }
      }
    );

    // get my order list in my-order page
    app.get("/my-order/:email", async (req: Request, res: Response) => {
      const email = req.params.email;
      res.send(await orderCollection.findOne({ user_email: email }));
    });

    // cancel orders from admin
    app.delete(
      "/api/remove-order/:email/:orderId/",
      verifyJWT,
      async (req: Request, res: Response) => {
        const orderUserEmail = req.params.email;
        const id = parseInt(req.params.orderId);

        try {
          const result = await orderCollection.updateOne(
            { user_email: orderUserEmail },
            { $pull: { orders: { orderId: id } } }
          );

          res
            .status(200)
            .send({ result, message: "Order Removed successfully" });
        } catch (error: any) {
          res.status(500).send({ message: error?.message });
        }
      }
    );

    // cancel my orders
    app.put(
      "/api/cancel-my-order/:userEmail/:orderId",
      verifyJWT,
      async (req: Request, res: Response) => {
        const userEmail = req.params.userEmail;
        const orderId = parseInt(req.params.orderId);
        const { status, cancel_reason, time_canceled } = req.body;
        const result = await orderCollection.updateOne(
          { user_email: userEmail },
          {
            $set: {
              "orders.$[i].status": status,
              "orders.$[i].cancel_reason": cancel_reason,
              "orders.$[i].time_canceled": time_canceled,
            },
          },
          { arrayFilters: [{ "i.orderId": orderId }] }
        );
        res.send({ result, message: "Order canceled successfully" });
      }
    );

    // update order status by admin or product owner
    app.put(
      "/update-order-status/:status/:id",
      verifyJWT,
      verifySeller,
      async (req: Request, res: Response) => {
        const orderId = parseInt(req.params.id);
        const status = req.params.status;
        const userEmail = req.headers.authorization;
        const { ownerCommission, totalEarn, productId, quantity, seller } =
          req.body;
        let time: string = new Date().toLocaleString();
        let upDoc: any;

        if (status === "placed") {
          upDoc = {
            $set: {
              "orders.$[i].status": status,
              "orders.$[i].time_placed": time,
            },
          };
        } else if (status === "shipped") {
          upDoc = {
            $set: {
              "orders.$[i].status": status,
              "orders.$[i].time_shipped": time,
            },
          };

          if (ownerCommission && totalEarn) {
            const ownerCol = await userCollection.findOne({ role: "owner" });
            const sellerColumn = await userCollection.findOne({
              seller: seller,
            });

            if (ownerCol) {
              let total_earn = ownerCol?.total_earn || 0;
              let totalEr = parseFloat(ownerCommission);
              total_earn = parseFloat(total_earn) + totalEr;
              await userCollection.updateOne(
                { role: "owner" },
                { $set: { total_earn } },
                { upsert: true }
              );
            }

            if (sellerColumn) {
              let total_earn = sellerColumn?.total_earn || 0;
              let totalEr = parseFloat(totalEarn);
              total_earn = parseFloat(total_earn) + totalEr;
              let success_sell = sellerColumn?.success_sell || 0;
              success_sell = success_sell + parseInt(quantity);

              await userCollection.updateOne(
                { seller },
                { $set: { total_earn, success_sell } },
                { upsert: true }
              );
            }
          }

          if (productId) {
            let product = await productsCollection.findOne({
              _id: ObjectId(productId),
              status: "active",
              save_as: "fulfilled",
            });
            let available = parseInt(product?.available) - parseInt(quantity);
            let top_sell =
              (parseInt(product?.top_sell) || 0) + parseInt(quantity);

            let stock: string;
            if (available >= 1) {
              stock = "in";
            } else {
              stock = "out";
            }

            await productsCollection.updateOne(
              { _id: ObjectId(productId) },
              { $set: { available, stock, top_sell } },
              { upsert: true }
            );

            const cartProduct =
              (await userCollection
                .find({ "myCartProduct._id": productId })
                .toArray()) || [];

            if (cartProduct.length > 0) {
              await userCollection.updateMany(
                { "myCartProduct._id": productId },
                {
                  $set: {
                    "myCartProduct.$.stock": stock,
                    "myCartProduct.$.available": available,
                  },
                },
                { upsert: true }
              );
            }
          }
        }

        const result = await orderCollection.updateOne(
          { user_email: userEmail },
          upDoc,
          { arrayFilters: [{ "i.orderId": orderId }] }
        );
        res.send(result);
      }
    );

    // dispatch order from seller
    app.put(
      "/api/dispatch-order-request/:orderId/:userEmail",
      verifyJWT,
      verifySeller,
      async (req: Request, res: Response) => {
        const orderId: number = parseInt(req.params.orderId);
        const userEmail: string = req.params.userEmail;
        res.status(200).send(
          (await orderCollection.updateOne(
            { user_email: userEmail },
            {
              $set: {
                "orders.$[i].status": "dispatch",
              },
            },
            { arrayFilters: [{ "i.orderId": orderId }] }
          )) && { message: "Successfully order dispatched" }
        );
      }
    );

    /// find orderId
    app.get("/manage-orders", async (req: Request, res: Response) => {
      const seller = req.query.seller;
      let result: any;

      if (seller) {
        result = await orderCollection
          .aggregate([
            { $unwind: "$orders" },
            {
              $match: {
                $and: [{ "orders.seller": seller }],
              },
            },
          ])
          .toArray();
      }

      res.status(200).send(result);
    });

    // fetch top selling product in my dashboard
    app.get(
      "/api/fetch-top-selling-product",
      async (req: Request, res: Response) => {
        const seller: any = req.query.seller;
        let filterQuery: any = {
          status: "active",
          save_as: "fulfilled",
        };
        if (seller) {
          filterQuery["seller"] = seller;
        }

        const result = await productsCollection
          .find(filterQuery)
          .sort({ top_sell: -1 })
          .limit(6)
          .toArray();
        res.status(200).send(result);
      }
    );
  } finally {
  }
}
run();

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("Woo-Com Server is running");
});

app.listen(port, () => {
  console.log(`Running port is ${port}`);
});
