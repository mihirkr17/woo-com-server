import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
var jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

module.exports.fetchAuthUser = async (
  req: Request,
  res: Response,
  next: any
) => {
  try {
    const db = await dbConnection();
    const authEmail: string = req.headers.authorization || "";
    
    if (!authEmail || typeof authEmail === "undefined") {
      return res
        .status(400)
        .send({ success: false, error: "Authorization header is missing!" });
    }

    await db
      .collection("users")
      .updateOne(
        { email: authEmail },
        { $pull: { myCartProduct: { stock: "out" } } }
      );

    await db.collection("users").createIndex({ email: 1 });

    const result = await db.collection("users").findOne({ email: authEmail });

    return result
      ? res.status(200).send({ success: true, statusCode: 200, data: result })
      : res
          .status(500)
          .send({ success: false, error: "Something went wrong!" });
  } catch (error: any) {
    // res.status(500).send({ error: error.message });
    next(error);
  }
};

module.exports.signUser = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const authEmail = req.headers.authorization?.split(" ")[1];
    const { name, photoURL } = req.body;

    if (!authEmail || typeof authEmail === "undefined") {
      return res
        .status(400)
        .send({ success: false, error: "Authorization header is missing!" });
    }

    const cookieObject: any = {
      // sameSite: "none",
      // secure: true,
      maxAge: 9000000, //3600000
      httpOnly: true,
    };

    if (authEmail) {
      const token = jwt.sign({ email: authEmail }, process.env.ACCESS_TOKEN, {
        algorithm: "HS256",
        expiresIn: "1h",
      });

      const setToken = () => {
        return res.cookie("token", token, cookieObject)
          ? res.status(200).send({ message: "Login success", statusCode: 200 })
          : res.status(400).send({ error: "Bad request" });
      };

      const existsUser = await db
        .collection("users")
        .findOne({ email: authEmail });

      if (existsUser) {
        return setToken();
      }

      const newUser = await db.collection("users").updateOne(
        { email: authEmail },
        {
          $set: {
            email: authEmail,
            displayName: name,
            photoURL,
            role: "user",
          },
        },
        { upsert: true }
      );

      if (newUser) return setToken();
    }
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};

module.exports.signOutUser = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");
    res.status(200).send({ message: "Sign out successfully" });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.switchRole = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

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

    if (userID && userEmail) {
      const result = await db
        .collection("users")
        .updateOne(
          { _id: ObjectId(userID), email: userEmail },
          { $set: roleModel },
          { upsert: true }
        );

      if (result) return res.status(200).send(result);
    }
  } catch (error: any) {
    res.status(500).send({ error: error?.message });
  }
};

module.exports.updateProfileData = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();
    const email: string = req.decoded.email;
    const result = await db
      .collection("users")
      .updateOne({ email: email }, { $set: req.body }, { upsert: true });
    res.status(200).send(result);
  } catch (error: any) {
    res.status(500).send({ error: error?.message });
  }
};

module.exports.makeAdmin = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userId: string = req.params.userId;

    if (!ObjectId.isValid(userId)) {
      return res
        .status(400)
        .send({ success: false, error: "User ID not valid" });
    }

    const result = await db
      .collection("users")
      .updateOne(
        { _id: ObjectId(userId) },
        { $set: { role: "admin" } },
        { upsert: true }
      );

    return result
      ? res.status(200).send({ success: true, message: "Permission granted" })
      : res.status(500).send({ success: false, error: "Failed" });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.demoteToUser = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userId: string = req.params.userId;
    res
      .status(200)
      .send(
        await db
          .collection("users")
          .updateOne(
            { _id: ObjectId(userId) },
            { $set: { role: "user" } },
            { upsert: true }
          )
      );
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.manageUsers = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const uType = req.query.uTyp;
    res
      .status(200)
      .send(await db.collection("users").find({ role: uType }).toArray());
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.makeSellerRequest = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userEmail = req.params.userEmail;
    let body = req.body;
    let existSellerName;

    if (body?.seller) {
      existSellerName = await db.collection("users").findOne({
        seller: body?.seller,
      });
    }

    if (existSellerName) {
      return res
        .status(200)
        .send({ message: "Seller name exists ! try to another" });
    } else {
      const result = await db.collection("users").updateOne(
        { email: userEmail },
        {
          $set: body,
        },
        { upsert: true }
      );
      res.status(200).send({ result, message: "success" });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.permitSellerRequest = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userId: string = req.params.userId;

    const result = await db.collection("users").updateOne(
      { _id: ObjectId(userId) },
      {
        $set: { role: "seller", seller_request: "ok", isSeller: true },
      },
      { upsert: true }
    );
    result?.acknowledged
      ? res.status(200).send({ message: "Request Success" })
      : res.status(400).send({ message: "Bad Request" });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.checkSellerRequest = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    res
      .status(200)
      .send(
        await db
          .collection("users")
          .find({ seller_request: "pending" })
          .toArray()
      );
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};
