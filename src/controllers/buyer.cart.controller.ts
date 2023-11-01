import { NextFunction, Request, Response } from "express";
const ShoppingCart = require("../model/shoppingCart.model");
const { shopping_cart_pipe } = require("../utils/pipelines");
const User = require("../model/user.model");
const Customer = require("../model/customer.model");
const { cartContextCalculation } = require("../utils/common");
const { Api400Error, Api404Error } = require("../errors/apiResponse");
const { ObjectId } = require("mongodb");
const NodeCache = require("../utils/NodeCache");
const ProductService = require("../services/ProductService");
const { isProduct } = new ProductService();

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function addToCartSystem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { _id, email }: any = req.decoded;
    const body = req.body;

    if (!body || typeof body !== "object")
      throw new Api400Error("Required body !");

    const { productId, sku, action, quantity } = body;

    if (!productId || !sku)
      throw new Api400Error(
        "Required product id, listing id, variation id in body !"
      );

    const availableProduct = await isProduct(productId, sku);

    if (!availableProduct) throw new Api404Error("Product is not available !");

    if (action !== "toCart") throw new Api400Error("Required cart operation !");

    let existsProduct = await ShoppingCart.findOne({
      $and: [
        { customerId: ObjectId(_id) },
        { sku },
        { productId: ObjectId(productId) },
      ],
    });

    if (existsProduct)
      return res.status(200).send({
        success: true,
        statusCode: 200,
        message: "This product already in your cart.",
      });

    const cart = new ShoppingCart({
      productId,
      sku,
      quantity,
      customerId: _id,
      addedAt: new Date(),
    });

    const result = await cart.save();

    NodeCache.deleteCache(`${email}_cartProducts`);

    if (!result) throw new Error("Internal Server Error !");

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Product successfully added to your cart.",
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function getCartContextSystem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, _id } = req.decoded;

    let cart: any[];

    let user = await Customer.findOne({ userId: ObjectId(_id) });

    const cartData = NodeCache.getCache(`${email}_cartProducts`);

    if (cartData) {
      cart = cartData;
    } else {
      cart = await ShoppingCart.aggregate(shopping_cart_pipe(_id));

      await NodeCache.saveCache(`${email}_cartProducts`, cart);
    }

    const {
      amount,
      totalQuantity,
      shippingCost,
      finalAmount,
      savingAmount,
      discountShippingCost,
    } = cartContextCalculation(cart);

    const defaultShippingAddress = user?.shippingAddress?.find(
      (adr: any) => adr.default_shipping_address === true
    );

    return res.status(200).send({
      success: true,
      statusCode: 200,
      data: {
        module: {
          cartItems: cart,
          cartCalculation: {
            amount,
            totalQuantity,
            finalAmount,
            shippingCost,
            savingAmount,
            discountShippingCost,
          },
          numberOfProduct: cart.length || 0,
          defaultShippingAddress,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function updateCartProductQuantitySystem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, _id } = req.decoded;

    const { type } = req?.body?.actionRequestContext;

    const { productID, sku, cartID, quantity } =
      req?.body?.upsertRequest?.cartContext;

    if (!productID || !sku || !cartID)
      throw new Api400Error("Required product id, variation id, cart id !");

    if (!quantity || typeof quantity === "undefined")
      throw new Api400Error("Required quantity !");

    if (quantity > 5 || quantity <= 0)
      throw new Api400Error(
        "Quantity can not greater than 5 and less than 1 !"
      );

    if (type !== "toCart") throw new Api404Error("Invalid cart context !");

    const productAvailability = await isProduct(productID, sku);

    if (
      !productAvailability ||
      typeof productAvailability === "undefined" ||
      productAvailability === null
    )
      throw new Api400Error("Product is available !");

    if (parseInt(quantity) >= productAvailability?.variations?.available) {
      return res.status(200).send({
        success: false,
        statusCode: 200,
        message: "Sorry ! your selected quantity out of range.",
      });
    }

    let cacheProduct = NodeCache.getCache(`${email}_cartProducts`);

    // if cart has cache then some operation
    if (cacheProduct) {
      Array.isArray(cacheProduct) &&
        cacheProduct.forEach((item: any) => {
          if (item?.sku === sku) {
            item.quantity = quantity;

            item.amount = item.sellingPrice * quantity;

            item.savingAmount = item.price - item.sellingPrice;
          }
        });

      NodeCache.saveCache(`${email}_cartProducts`, cacheProduct);
    }

    const result = await ShoppingCart.findOneAndUpdate(
      {
        $and: [
          { customerId: ObjectId(_id) },
          { productId: ObjectId(productID) },
          { sku },
        ],
      },
      {
        $set: { quantity: parseInt(quantity) },
      },
      { upsert: true }
    );

    if (result)
      return res.status(200).send({
        success: true,
        statusCode: 200,
        message: `Quantity updated to ${quantity}.`,
      });

    throw new Error("Failed to update quantity !");
  } catch (error: any) {
    next(error);
  }
}

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns
 */
async function deleteCartItemSystem(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { productID, sku, cartTypes } = req.params as {
      productID: string;
      sku: string;
      cartTypes: string;
    };

    const { email, _id } = req.decoded;

    if (!sku || !productID)
      throw new Api400Error("Required product id & sku !");

    if (!ObjectId.isValid(productID))
      throw new Api400Error("Product id is not valid !");

    if (cartTypes !== "toCart") throw new Error("Invalid cart type !");

    let deleted = await ShoppingCart.findOneAndDelete({
      $and: [
        { customerId: ObjectId(_id) },
        { productId: ObjectId(productID) },
        { sku },
      ],
    });

    if (!deleted) throw new Error(`Couldn't delete product with sku ${sku}!`);

    // getting cart items from cache
    NodeCache.deleteCache(`${email}_cartProducts`);

    return res.status(200).send({
      success: true,
      statusCode: 200,
      message: "Item removed successfully from your cart.",
    });
  } catch (error: any) {
    next(error);
  }
}

module.exports = {
  addToCartSystem,
  getCartContextSystem,
  updateCartProductQuantitySystem,
  deleteCartItemSystem,
};
