"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var mongoose = require("mongoose");
const ngrok = require("@ngrok/ngrok");
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
const supplierRoutes = require("./routes/supplier.route");
const purchaseRoutes = require("./routes/purchase.route");
const adminRoutes = require("./routes/admin.route");
const customerAuthRoutes = require("./routes/customer.auth.route");
const PORT = process.env.PORT || 5000;
const sanitizeUrl = require("@braintree/sanitize-url").sanitizeUrl;
const allowedOrigins = [
    "http://localhost:3000",
    "https://wookart.vercel.app",
    "https://red-encouraging-shark.cyclic.app",
    "http://localhost:9000",
];
// const mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.8bccj.mongodb.net/ecommerce-db?retryWrites=true&w=majority`;
const path = require("path");
// Server setup
const app = (0, express_1.default)();
const environments = process.env.NODE_ENV || "development";
// middleware functions
const baseConfig = {
    development: {
        appUri: process.env.BACKEND_URL_LOCAL,
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
        return callback(new Error("The CORS policy for this site does not allow access from the specified origin."), false);
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "role"],
    credentials: true,
}));
app.use(cookieParser());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use(express_1.default.static(path.join(__dirname, "../public")));
// Set up default mongoose connection
function retryDb(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        const MAX_RETRY = 10;
        let retries = 0;
        while (retries < MAX_RETRY) {
            try {
                yield mongoose.connect(uri, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    // serverApi: ServerApiVersion.v1,
                });
                console.log("Mongodb connected successfully...");
                break;
            }
            catch (error) {
                console.log(`Hitting url: ${uri}`);
                console.log(`Connection attempt ${retries + 1} failed: ${error.message}`);
                retries++;
                yield new Promise((resolve) => setTimeout(resolve, 2000));
            }
        }
        if (retries === MAX_RETRY) {
            console.log("Max retries reached. Unable to establish a connection to MongoDB.");
        }
    });
}
retryDb((_a = process.env.MONGO_URI) !== null && _a !== void 0 ? _a : "fg");
// Routes declared here
//Sanitizing URLs
app.use((req, res, next) => {
    req.appUri = baseConfig[environments].appUri;
    req.url = sanitizeUrl(req.url);
    req.originalUrl = sanitizeUrl(req.originalUrl);
    req.clientOrigin = req === null || req === void 0 ? void 0 : req.get("Origin");
    next();
});
app.get("/home", (req, res) => {
    return res.sendFile("index");
});
app.get("/email-confirmation", (req, res) => {
    return res.sendFile(path.join(__dirname, "../public", "email-confirmation.html"));
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/customer/auth", customerAuthRoutes);
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
    return res.sendFile(path.join(__dirname, "../public", "page404.html"));
});
// global error handler
app.use((err, req, res, next) => {
    res.status((err === null || err === void 0 ? void 0 : err.statusCode) || 500).send({
        message: (err === null || err === void 0 ? void 0 : err.message) || "Internal Error!",
        name: err === null || err === void 0 ? void 0 : err.name,
        statusCode: (err === null || err === void 0 ? void 0 : err.statusCode) || 500,
        success: (err === null || err === void 0 ? void 0 : err.success) || false,
    });
});
// Start server
const server = app.listen(PORT, () => {
    console.log(`Local Server is running with port ${PORT}`);
});
// (async () => {
//   let retries = 0;
//   const MAX_RETRY = 3;
//   while (retries < MAX_RETRY) {
//     try {
//       const listener = await ngrok.forward({
//         addr: PORT,
//         authtoken_from_env: true,
//       });
//       console.log(`Ingress established at: ${listener.url()}`);
//       break;
//     } catch (error: any) {
//       console.error("Error connecting ngrok:", error?.message);
//       retries++;
//       await new Promise((resolve) => setTimeout(resolve, 3000));
//     }
//   }
//   if (retries === MAX_RETRY) {
//     console.log("Max retries exceed!");
//     // server.close();
//   }
// })();
// close the server if unhandleable error has come to the server
process.on("unhandledRejection", (error) => {
    console.log(error.name, error === null || error === void 0 ? void 0 : error.message);
    server.close(() => process.exit(1));
});
