"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var mongoose = require("mongoose");
require("dotenv").config();
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
const app = (0, express_1.default)();
// middleware
app.use(cors({
    origin: true,
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
}));
app.use(cookieParser());
app.use(express_1.default.json());
// Set up default mongoose connection
const mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.8bccj.mongodb.net/ecommerce-db?retryWrites=true&w=majority`;
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // serverApi: ServerApiVersion.v1,
}).then(() => console.log("connection successful"))
    .catch((err) => console.log(err));
app.get("/", (req, res) => {
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
process.on("unhandledRejection", (error) => {
    console.log(error.name, error === null || error === void 0 ? void 0 : error.message);
    server.close(() => process.exit(1));
});
