import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");

const checkProductAvailability = async (db: any, productId: string) => {
  return await db.collection("products").findOne({
    _id: ObjectId(productId),
    available: { $gte: 1 },
    stock: "in",
    status: "active",
  });
};

const responseSender = (
  res: any,
  success: boolean,
  message: string,
  data: any = null
) => {
  return success
    ? res.status(200).send({ success: true, statusCode: 200, message, data })
    : res.status(400).send({
        success: false,
        statusCode: 400,
        error: message,
      });
};

const saveToDBHandler = async (filter: any, documents: any) => {
  const db = await dbConnection();
  return await db.collection("users").updateOne(filter, documents, {
    upsert: true,
  });
};

// update product quantity controller
module.exports.updateProductQuantity = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userEmail: string = req.decoded.email;
    const cart_types: string = req.params.cartTypes;
    const productId = req.headers.authorization;
    const { quantity } = req.body;

    // undefined variables
    let updateDocuments: any;
    let filters: any;

    if (!productId || typeof productId === "undefined" || productId === null) {
      return responseSender(res, false, "Bad request! headers missing");
    }

    const availableProduct = await checkProductAvailability(db, productId);

    if (
      !availableProduct ||
      typeof availableProduct === "undefined" ||
      availableProduct === null
    ) {
      return responseSender(res, false, "Product not available");
    }

    if (quantity >= availableProduct?.available - 1) {
      return responseSender(
        res,
        false,
        "Your selected quantity out of range in available product"
      );
    }

    const cart = await db.collection("users").findOne({
      email: userEmail,
    });

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

    const result = await saveToDBHandler(filters, updateDocuments);

    if (result?.modifiedCount) {
      return responseSender(res, true, "Quantity updated.");
    } else {
      return responseSender(res, false, "Failed to update this quantity!");
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.deleteCartItem = async (req: Request, res: Response) => {
  try {
    const productId = req.headers.authorization;
    const userEmail = req.decoded.email;
    const cart_types = req.params.cartTypes;
    let updateDocuments;

    if (!ObjectId.isValid(productId) || !productId) {
      return responseSender(res, false, "Bad request! headers missing");
    }

    if (cart_types === "buy") {
      updateDocuments = await saveToDBHandler(
        { email: userEmail },
        { $unset: { buy_product: "" } }
      );
    }

    if (cart_types === "toCart") {
      updateDocuments = await saveToDBHandler(
        { email: userEmail },
        { $pull: { myCartProduct: { _id: productId } } }
      );
    }

    if (updateDocuments?.modifiedCount) {
      return responseSender(
        res,
        true,
        "Item removed successfully from your cart."
      );
    } else {
      return responseSender(res, false, "Sorry! failed to remove.");
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.addToCartHandler = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const email: string = req.decoded.email;
    const body = req.body;

    const availableProduct = await checkProductAvailability(db, body?._id);

    if (availableProduct?.stock === "out" && availableProduct?.available <= 0) {
      return responseSender(res, false, "This product out of stock now!");
    }

    const existsProduct = await db
      .collection("users")
      .findOne(
        { email: email, "myCartProduct._id": body?._id },
        { "myCartProduct.$": 1 }
      );

    if (existsProduct) {
      return responseSender(res, false, "Product Has Already In Your Cart");
    }

    body["addedAt"] = new Date(Date.now());

    const cartRes = await saveToDBHandler(
      { email: email },
      {
        $push: { myCartProduct: body },
      }
    );

    return responseSender(
      res,
      true,
      "Product successfully added to your cart",
      cartRes
    );
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.addToBuyHandler = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userEmail = req.decoded.email;
    const body = req.body;

    const cartRes = await db
      .collection("users")
      .updateOne(
        { email: userEmail },
        { $set: { buy_product: body } },
        { upsert: true }
      );

    if (cartRes) {
      return res.status(200).send({
        success: true,
        statusCode: 200,
        message: "Product ready to buy.",
      });
    } else {
      return res
        .status(400)
        .send({ success: false, statusCode: 400, error: "Failed to buy" });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.addCartAddress = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userEmail = req.decoded.email;
    const body = req.body;
    const result = await db
      .collection("users")
      .updateOne(
        { email: userEmail },
        { $push: { address: body } },
        { upsert: true }
      );

    if (!result) {
      return res.status(400).send({
        success: false,
        statusCode: 400,
        error: "Failed to add address in this cart",
      });
    }

    res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Successfully shipping address added in your cart.",
    });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.updateCartAddress = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userEmail = req.decoded.email;
    const body = req.body;

    const result = await db.collection("users").updateOne(
      { email: userEmail },
      {
        $set: {
          "address.$[i]": body,
        },
      },
      { arrayFilters: [{ "i.addressId": body?.addressId }] }
    );

    if (result) {
      return res.status(200).send({
        success: true,
        statusCode: 200,
        message: "Shipping address updated.",
      });
    } else {
      return res.status(400).send({
        success: false,
        statusCode: 400,
        error: "Failed to update shipping address.",
      });
    }
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.selectCartAddress = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();
    const userEmail = req.decoded.email;
    const { addressId, select_address } = req.body;

    const addr = await db.collection("users").findOne({ email: userEmail });
    if (addr) {
      const addressArr = addr?.address;

      if (addressArr && addressArr.length > 0) {
        await db.collection("users").updateOne(
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

    const result = await db.collection("users").updateOne(
      { email: userEmail },
      {
        $set: {
          "address.$[i].select_address": select_address,
        },
      },
      { arrayFilters: [{ "i.addressId": addressId }] }
    );

    if (!result) {
      return res.status(400).send({
        success: false,
        statusCode: 400,
        error: "Failed to select the address",
      });
    }

    return res
      .status(200)
      .send({ success: true, statusCode: 200, message: "Saved" });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

module.exports.deleteCartAddress = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const email = req.decoded.email;
    const addressId = parseInt(req.params.addressId);
    const result = await db
      .collection("users")
      .updateOne({ email: email }, { $pull: { address: { addressId } } });
    if (result) return res.send(result);
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};
