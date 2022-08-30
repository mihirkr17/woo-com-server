import { Request, Response } from "express";
const { dbh } = require("../../utils/db");
const { ObjectId } = require("mongodb");

module.exports.updateProductQuantity = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const productsCollection = dbh.db("Products").collection("product");
    const userCollection = dbh.db("Users").collection("user");

    const userEmail: string = req.decoded.email;
    const cart_types: string = req.params.cartTypes;
    const productId = req.headers.authorization;
    const { quantity } = req.body;
    let updateDocuments: any;
    let filters: any;

    if (!productId) {
      return res.status(400).send({ message: "Bad request! headers missing" });
    }

    const availableProduct = await productsCollection.findOne({
      _id: ObjectId(productId),
      available: { $gte: 1 },
      stock: "in",
      status: "active",
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

      const result = await userCollection.updateOne(filters, updateDocuments, {
        upsert: true,
      });
      return res.status(200).send(result);
    } else {
      await userCollection.updateOne(
        { email: userEmail },
        { $pull: { myCartProduct: { _id: productId } } }
      );
      return res.status(200).send({
        message: "This product is out of stock now and removed from your cart",
      });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.deleteCartItem = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");

    const productId = req.headers.authorization;
    const userEmail = req.decoded.email;
    const cart_types = req.params.cartTypes;
    let updateDocuments;

    if (!productId) {
      return res.status(400).send({ message: "Bad request! headers missing" });
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
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.addToCartHandler = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
    const productsCollection = dbh.db("Products").collection("product");
    const email: string = req.decoded.email;
    const body = req.body;

    const availableProduct = await productsCollection.findOne({
      _id: ObjectId(body?._id),
      status: "active",
    });

    if (availableProduct?.stock === "in" && availableProduct?.available > 0) {
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
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.addToBuyHandler = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
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
};

module.exports.addCartAddress = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
    const userEmail = req.decoded.email;
    const body = req.body;
    const result = await userCollection.updateOne(
      { email: userEmail },
      { $push: { address: body } },
      { upsert: true }
    );
    res.send(result);
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.updateCartAddress = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
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
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.selectCartAddress = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
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
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.deleteCartAddress = async (req: Request, res: Response) => {
  try {
    await dbh.connect();
    const userCollection = dbh.db("Users").collection("user");
    const email = req.decoded.email;
    const addressId = parseInt(req.params.addressId);
    const result = await userCollection.updateOne(
      { email: email },
      { $pull: { address: { addressId } } }
    );
    if (result) return res.send(result);
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};
