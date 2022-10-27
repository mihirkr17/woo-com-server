import { Request, Response } from "express";
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const { cartTemplate } = require("../../templates/cart.template");

const checkProductAvailability = async (productId: string, variationId: String) => {
  const db = await dbConnection();

  let product = await db.collection('products').aggregate([
    { $match: { _id: ObjectId(productId) } },
    { $unwind: { path: "$variations" } },
    { $match: { $and: [{ 'variations.vId': variationId }, { 'variations.available': { $gte: 1 } }, { 'variations.stock': 'in' }] } }
  ]).toArray();

  product = product[0];
  return product;
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

// Show My Cart Items;
module.exports.showMyCartItemsController = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const authEmail = req.decoded.email;

    const cartItems = await db.collection('shoppingCarts').find({ customerEmail: authEmail }).toArray();

    const result = await db.collection('shoppingCarts').aggregate([
      { $match: { customerEmail: authEmail } },
      {
        $lookup: {
          from: 'products',
          localField: 'listingId',
          foreignField: "_lId",
          as: "main_product"
        }
      },
      {
        $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } }
      },
      { $project: { main_product: 0 } },
      { $unwind: { path: "$variations" } },
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$variations.vId', '$variationId'] }
            ]
          }
        }
      },
      {
        $project: {
          listingId: 1,
          productId: 1, variationId: 1, variations: 1, brand: 1, 
          quantity: 1, 
          totalAmount: { $multiply: ['$variations.pricing.sellingPrice', '$quantity'] },
          seller: 1,
          shippingCharge: "$deliveryDetails.zonalDeliveryCharge",
          paymentInfo: 1
        }
      }
    ]).toArray();

    if (cartItems) {
      return res.status(200).send({ success: true, statusCode: 200, data: { items: cartItems.length, products: result, result: result } });
    }
  } catch (error: any) {
    return res.status(500).send({ success: false, statusCode: 500, error: error?.message })
  }
}

// update product quantity controller
module.exports.updateProductQuantity = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const userEmail: string = req.decoded.email;
    const cart_types: string = req.params.cartTypes;
    const productId = req.headers.authorization;
    const { quantity, variationId } = req.body;

    // undefined variables
    let updateDocuments: any;
    let filters: any;

    if (!productId || typeof productId === "undefined" || productId === null) {
      return responseSender(res, false, "Bad request! headers missing");
    }

    const availableProduct = await checkProductAvailability(productId, variationId);

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
      const cartProduct = cart?.shoppingCartItems || [];
      let amount;

      for (let i = 0; i < cartProduct.length; i++) {
        let items = cartProduct[i];
        if (items?._id === productId) {
          amount = items?.price * quantity;
        }
      }

      updateDocuments = {
        $set: {
          "shoppingCartItems.$.quantity": quantity,
          "shoppingCartItems.$.totalAmount": amount,
        },
      };

      filters = {
        email: userEmail,
        "shoppingCartItems._id": productId,
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


/**
 * @controller --> Delete cart items by product ID
 * @request_method --> DELETE
 * @required --> productId:req.headers.authorization & cartTypes:req.params
 */
module.exports.deleteCartItem = async (req: Request, res: Response) => {
  try {
    const productId = req.headers.authorization;
    const authEmail = req.decoded.email;
    const cart_types = req.params.cartTypes;
    let updateDocuments;

    const db = await dbConnection();

    if (!ObjectId.isValid(productId) || !productId) {
      return responseSender(res, false, "Bad request! headers missing");
    }

    if (cart_types === "buy") {
      updateDocuments = await saveToDBHandler(
        { email: authEmail },
        { $unset: { buy_product: "" } }
      );
    }

    if (cart_types === "toCart") {
      // updateDocuments = await saveToDBHandler(
      //   { email: authEmail },
      //   { $pull: { shoppingCartItems: { _id: productId } } }
      // );
      updateDocuments = await db.collection('shoppingCarts').deleteOne({ $and: [{ customerEmail: authEmail }, { productId }] })
    }

    if (updateDocuments) {
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


// add to cart controller
/**
 * @controller --> add product to cart
 * @required --> BODY [productId, variationId]
 * @request_method --> POST
 */
module.exports.addToCartHandler = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const authEmail: string = req.decoded.email;
    const body = req.body;

    const availableProduct = await checkProductAvailability(body?.productId, body?.variationId);

    if (!availableProduct) {
      return res.status(503).send({ success: false, statusCode: 503, error: "Sorry! This product is out of stock now!" });
    }

    const existsProduct = await db.collection("shoppingCarts").findOne(
      { $and: [{ customerEmail: authEmail }, { variationId: body?.variationId }] }
    );

    if (existsProduct) {
      return res.status(400).send({ success: false, statusCode: 400, error: "Product Has Already In Your Cart" });
    }

    const cartTemp = cartTemplate(availableProduct, authEmail, body?.productId, body?.listingId, body?.variationId);

    const result = await db.collection('shoppingCarts').insertOne(cartTemp);

    if (result) {
      return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart" });
    }

  } catch (error: any) {
    return res.status(500).send({ success: false, statusCode: 500, error: error?.message });
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
        { $push: { shippingAddress: body } },
        { upsert: true }
      );

    if (!result) {
      return res.status(400).send({
        success: false,
        statusCode: 400,
        error: "Failed to add address in this cart",
      });
    }

    return res.status(200).send({
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
          "shippingAddress.$[i]": body,
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

    const user = await db.collection("users").findOne({ email: userEmail });

    if (!user) {
      return res.status(404).send({ success: false, statusCode: 404, error: 'User not found !!!' });
    }

    const shippingAddress = user?.shippingAddress || [];

    if (shippingAddress && shippingAddress.length > 0) {

      await db.collection("users").updateOne(
        { email: userEmail },
        {
          $set: {
            "shippingAddress.$[j].select_address": false,
          },
        },
        {
          arrayFilters: [{ "j.addressId": { $ne: addressId } }],
          multi: true,
        }
      );

      const result = await db.collection("users").updateOne(
        { email: userEmail },
        {
          $set: {
            "shippingAddress.$[i].select_address": select_address,
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

      return res.status(200).send({ success: true, statusCode: 200, message: "Shipping address Saved." });
    }
  } catch (error: any) {
    res.status(500).send({ success: false, statusCode: 500, error: error?.message });
  }
};

module.exports.deleteCartAddress = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const email = req.decoded.email;
    const addressId = parseInt(req.params.addressId);
    const result = await db
      .collection("users")
      .updateOne({ email: email }, { $pull: { shippingAddress: { addressId } } });
    if (result) return res.send(result);
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};


module.exports.checkCartItemExpirationController = async (req: Request, res: Response) => {
  try {
    let authEmail = req.decoded.email;
    let productId = req.params.productId;
    const db = await dbConnection();

    const product = await db.collection('users').updateOne(
      { email: authEmail },
      { $pull: { shoppingCartItems: { _id: productId } } },
      { upsert: true }
    );

    if (product) {
      return res.status(200).send({ success: true, statusCode: 200, message: "Deleted Expired product from your cart" });
    }


  } catch (error: any) {
    return res.status(500).send({ success: false, statusCode: 500, error: error?.message });
  }
}

module.exports.updateCartProductQuantityController = async (req: Request, res: Response) => {
  try {

    const db = await dbConnection();

    const authEmail = req.decoded.email || "";

    const body = req.body;

    const upsertRequest = body?.upsertRequest;

    const cartContext = upsertRequest?.cartContext;

    const { productId, variationId, cartId, quantity } = cartContext;

    const cartProduct = await db.collection('shoppingCarts').findOne({ $and: [{ customerEmail: authEmail }, { productId }, { _id: ObjectId(cartId) }] });

    if (!cartProduct) {
      return res.status(404).send({ success: false, statusCode: 404, error: 'product not found !!!' });
    }

    const availableProduct = await checkProductAvailability(productId, variationId);

    if (!availableProduct || typeof availableProduct === "undefined" || availableProduct === null) {
      return res.status(400).send({ success: false, statusCode: 400, error: "Product not available" });
    }

    if (parseInt(quantity) >= availableProduct?.variations?.available) {
      return res.status(400).send({ success: false, statusCode: 400, error: "Sorry ! your selected quantity out of range." });
    }


    // let price = parseFloat(cartProduct?.price) || 0;

    // let amount = (price * quantity);

    const result = await db.collection('shoppingCarts').updateOne(
      {
        $and: [{ customerEmail: authEmail }, { productId }, { _id: ObjectId(cartId) }]
      },
      {
        $set: {
          quantity,
          // totalAmount: amount
        }
      },
      {
        upsert: true,
      }
    );


    if (result) {
      return res.status(200).send({ success: true, statusCode: 200, message: 'Quantity updated.' });
    }

  } catch (error: any) {
    return res.status(500).send({ success: false, statusCode: 500, error: error?.message });
  }
}