import express, { Express, Request, Response } from "express";
var mongoose = require("mongoose");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authentication.route");
const userRoutes = require("./routes/users.route");
const productRoutes = require("./routes/product.route");
const cartRoutes = require("./routes/cart.route");
const orderRoutes = require("./routes/order.route");
const reviewRoutes = require("./routes/review.route");
const policyRoutes = require("./routes/policy.route");
const wishlistRoutes = require("./routes/wishlist.route");
const dashboardRoutes = require("./routes/dashboard.route");
const paymentRoutes = require("./routes/payment.route");
const returnErrors = require("./errors/errors");
const storeRoutes = require("./routes/store.route");
const port = process.env.PORT || 9000;


// Server setup
const cors = require("cors");
const app: Express = express();

// middleware
const allowedOrigins = ['http://localhost:3000', 'https://wookart.vercel.app'];

app.use(
  cors({
    origin: function (origin: any, callback: any) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {

        return callback(new Error('The CORS policy for this site does not allow access from the specified origin.'), false);
      }

      return callback(null, true);
    },
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Set up default mongoose connection
const mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.8bccj.mongodb.net/ecommerce-db?retryWrites=true&w=majority`;

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // serverApi: ServerApiVersion.v1,
}).then(() => console.log("Connection Successful..."))
  .catch((err: any) => console.log(err));

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("WooKart Server is running perfectly...");
});

// all the routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/store", storeRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/policy", policyRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use(returnErrors);

const server = app.listen(port, () => {
  console.log(`Running port is ${port}`);
});

// close the server if unhandleable error has come to the server
process.on("unhandledRejection", (error: any) => {
  console.log(error.name, error?.message);
  server.close(() => process.exit(1));
});
