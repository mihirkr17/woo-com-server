import express, { Express, NextFunction, Request, Response } from "express";
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
const app: Express = express();
const environments = process.env.NODE_ENV || "development";
// middleware functions

const baseConfig: any = {
  development: {
    appUri: process.env.BACKEND_URL_LOCAL,
  },
  production: {
    appUri: process.env.BACKEND_URL,
  },
};

// Cors policy
app.use(
  cors({
    // origin: "*",
    origin: function (origin: any, callback: any) {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        return callback(null, true);
      }

      return callback(
        new Error(
          "The CORS policy for this site does not allow access from the specified origin."
        ),
        false
      );
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "role"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));

// Set up default mongoose connection

async function retryDb(uri: string) {
  const MAX_RETRY = 10;
  let retries = 0;

  while (retries < MAX_RETRY) {
    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // serverApi: ServerApiVersion.v1,
      });

      console.log("Mongodb connected successfully...");
      break;
    } catch (error: any) {
      console.log(`Hitting url: ${uri}`);
      console.log(`Connection attempt ${retries + 1} failed: ${error.message}`);
      retries++;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (retries === MAX_RETRY) {
    console.log(
      "Max retries reached. Unable to establish a connection to MongoDB."
    );
  }
}

retryDb(process.env.MONGO_URI ?? "fg");

// Routes declared here

//Sanitizing URLs
app.use((req: any, res: any, next: NextFunction) => {
  req.appUri = baseConfig[environments].appUri;
  req.url = sanitizeUrl(req.url);
  req.originalUrl = sanitizeUrl(req.originalUrl);
  req.clientOrigin = req?.get("Origin");
  next();
});

app.get("/home", (req: Request, res: Response) => {
  return res.sendFile("index");
});

app.get("/email-confirmation", (req: Request, res: Response) => {
  return res.sendFile(
    path.join(__dirname, "../public", "email-confirmation.html")
  );
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

app.get("*", (req: Request, res: Response) => {
  return res.sendFile(path.join(__dirname, "../public", "page404.html"));
});

// global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  res.status(err?.statusCode || 500).send({
    message: err?.message || "Internal Error!",
    name: err?.name,
    statusCode: err?.statusCode || 500,
    success: err?.success || false,
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
process.on("unhandledRejection", (error: any) => {
  console.log(error.name, error?.message);
  server.close(() => process.exit(1));
});
