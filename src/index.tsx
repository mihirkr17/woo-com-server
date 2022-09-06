import express, { Express, Request, Response } from "express";
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/users.route");
const productRoutes = require("./routes/product.route");
const cartRoutes = require("./routes/cart.route");
const orderRoutes = require("./routes/order.route");
const reviewRoutes = require("./routes/review.route");
const policyRoutes = require("./routes/policy.route");
const wishlistRoutes = require("./routes/wishlist.route");
const errorHandlers = require("./errors/errors");
const port = process.env.PORT || 5000;

// Server setup
const cors = require("cors");
require("dotenv").config();
const app: Express = express();

// middleware
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("Woo-Com Server is running");
});

// all the routes
app.use("/api/user", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use(errorHandlers);

const server = app.listen(port, () => {
  console.log(`Running port is ${port}`);
});

// close the server if unhandleable error has come to the server
process.on("unhandledRejection", (error: any) => {
  console.log(error.name, error?.message);
  server.close(() => process.exit(1));
});
