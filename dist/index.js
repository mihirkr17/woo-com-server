"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var mongoose = require("mongoose");
const cors = require("cors");
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
const paymentRoutes = require("./routes/payment.route");
const returnErrors = require("./errors/errors");
const supplierRoutes = require("./routes/supplier.route");
const purchaseRoutes = require("./routes/purchase.route");
const adminRoutes = require("./routes/admin.route");
const PORT = process.env.PORT || 5000;
const sanitizeUrl = require("@braintree/sanitize-url").sanitizeUrl;
const allowedOrigins = ['http://localhost:3000', 'https://wookart.vercel.app', 'https://red-encouraging-shark.cyclic.app', 'http://localhost:9000'];
// const mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.8bccj.mongodb.net/ecommerce-db?retryWrites=true&w=majority`;
const path = require("path");
// Server setup
const app = (0, express_1.default)();
const environments = process.env.NODE_ENV || 'development';
// middleware functions
const baseConfig = {
    development: {
        appUri: process.env.BACKEND_URL_LOCAL
    },
    production: {
        appUri: process.env.BACKEND_URL,
    },
};
// Cors policy
app.use(cors({
    // origin: "*",
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            return callback(null, true);
        }
        return callback(new Error('The CORS policy for this site does not allow access from the specified origin.'), false);
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(cookieParser());
app.use(express_1.default.json());
app.use(express_1.default.static(path.join(__dirname, "../public")));
// Set up default mongoose connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // serverApi: ServerApiVersion.v1,
}).then(() => console.log("Mongodb connected successfully..."))
    .catch((err) => console.log(err));
// Routes declared here
//Sanitizing URLs
app.use((req, res, next) => {
    req.appUri = baseConfig[environments].appUri;
    req.url = sanitizeUrl(req.url);
    req.originalUrl = sanitizeUrl(req.originalUrl);
    next();
});
app.get("/", (req, res) => {
    return res.sendFile('index');
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/supplier", supplierRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/policy", policyRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/purchase", purchaseRoutes);
app.use("/api/v1/admin", adminRoutes);
app.get("*", (req, res) => {
    return res.sendFile(path.join(__dirname, "../public", "index.html"));
});
app.use(returnErrors);
// Start server
const server = app.listen(PORT, () => {
    console.log(`Running port is ${PORT}`);
});
// close the server if unhandleable error has come to the server
process.on("unhandledRejection", (error) => {
    console.log(error.name, error === null || error === void 0 ? void 0 : error.message);
    server.close(() => process.exit(1));
});
