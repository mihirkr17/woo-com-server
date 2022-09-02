import { Request, Response } from "express";
const { dbh } = require("../../utils/db");
var jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

module.exports.fetchAuthUser = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
    const authEmail: string = req.headers.authorization || "";

    if (authEmail) {
      await userCollection.updateOne(
        { email: authEmail },
        { $pull: { myCartProduct: { stock: "out" } } }
      );

      const result = await userCollection.findOne({ email: authEmail });

      return result
        ? res.status(200).send({ success: true, statusCode: 200, data: result })
        : res.status(500).send({ error: "Internal Server Error!" });
    } else {
      return res.status(400).send({ error: "Bad request" });
    }
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
};

module.exports.signUser = async (req: Request, res: Response) => {
  try {
    await dbh.connect();

    const userCollection = dbh.db("Users").collection("user");
    const authEmail = req.headers.authorization?.split(" ")[1];
    const { name } = req.body;

    if (!authEmail) {
      return res.status(400).send({ message: "Bad request" });
    }

    const cookieObject: any = {
      sameSite: "none",
      secure: true,
      maxAge: 9000000, //3600000
      httpOnly: true,
    };

    if (authEmail) {
      const token = jwt.sign({ email: authEmail }, process.env.ACCESS_TOKEN, {
        algorithm: "HS256",
        expiresIn: "1h",
      });

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
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");

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
      const result = await userCollection.updateOne(
        { _id: ObjectId(userID), email: userEmail },
        { $set: roleModel },
        { upsert: true }
      );

      if (result) return res.status(200).send(result);
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.updateProfileData = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
    const email: string = req.decoded.email;
    const result = await userCollection.updateOne(
      { email: email },
      { $set: req.body },
      { upsert: true }
    );
    res.status(200).send(result);
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.makeAdmin = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
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
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.demoteToUser = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
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
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.manageUsers = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
    const uType = req.query.uTyp;
    res.status(200).send(await userCollection.find({ role: uType }).toArray());
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.makeSellerRequest = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
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
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.permitSellerRequest = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
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
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.checkSellerRequest = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
    res
      .status(200)
      .send(await userCollection.find({ seller_request: "pending" }).toArray());
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};
