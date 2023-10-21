// src/controllers/purchase.controller.ts

import { NextFunction, Request, Response } from "express";
const {
  single_purchase_pipe,
  shopping_cart_pipe,
} = require("../utils/pipelines");
const { cartContextCalculation } = require("../utils/common");
const { startSession } = require("mongoose");
const Order = require("../model/order.model");
const ShoppingCart = require("../model/shoppingCart.model");
const {
  findUserByEmail,
  createPaymentIntents,
  clearCart,
  productStockUpdater,
} = require("../services/common.service");

const smtpSender = require("../services/email.service");
const {
  Api400Error,
  Api500Error,
  Api503Error,
} = require("../errors/apiResponse");

const Product = require("../model/product.model");

async function initializedOneForPurchase(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, _id } = req.decoded;

    let user = await findUserByEmail(email);

    const { sku, quantity, productId } = req?.body;

    let defaultShippingAddress =
      Array.isArray(user?.buyer?.shippingAddress) &&
      user?.buyer?.shippingAddress.filter(
        (adr: any) => adr?.default_shipping_address === true
      )[0];

    let newQuantity = parseInt(quantity);

    let product = await Product.aggregate(
      single_purchase_pipe(productId, sku, newQuantity)
    );

    const {
      amount,
      totalQuantity,
      shippingCost,
      finalAmount,
      savingAmount,
      discountShippingCost,
    } = cartContextCalculation(product);

    return res.status(200).send({
      success: true,
      statusCode: 200,
      data: {
        module: {
          cartItems: product,
          cartCalculation: {
            amount,
            totalQuantity,
            finalAmount,
            shippingCost,
            savingAmount,
            discountShippingCost,
          },
          numberOfProduct: product.length || 0,
          defaultShippingAddress,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
}

async function purchaseCart(req: Request, res: Response, next: NextFunction) {
  const session = await startSession();
  session.startTransaction();

  try {
    const { email, _id } = req.decoded;

    // initialized current time stamp
    const timestamp: any = Date.now();

    if (!req.body || typeof req.body === "undefined")
      throw new Api400Error("Required body !");

    // get state by body
    const { state, paymentMethodId, session: paymentSessionId } = req.body;

    if (!paymentMethodId) throw new Api500Error("Required payment method id !");

    // finding user by email;
    const user = await findUserByEmail(email);

    if (!user)
      throw new Api400Error(`Sorry, User not found with this ${email}`);

    // getting default shipping address from user data;
    const defaultAddress = user?.shippingAddress?.find(
      (adr: any) => adr?.default_shipping_address === true
    );

    if (!defaultAddress) throw new Api400Error("Required shipping address !");

    let cartItems = await ShoppingCart.aggregate(shopping_cart_pipe(_id));

    if (!cartItems || cartItems.length <= 0 || !Array.isArray(cartItems))
      throw new Api400Error(
        "Nothing for purchase ! Please add product in your cart."
      );

    const { finalAmount } = cartContextCalculation(cartItems);

    const productInfos: any[] = [];

    const groupOrdersBySeller: any = {};

    // generating item id
    let itemId = Math.round(Math.random() * 9999999999);

    // assigning some value to items
    cartItems.forEach((item: any) => {
      itemId++;

      item["itemId"] = itemId;

      productInfos.push({
        productId: item?.productId,
        sku: item?.sku,
        quantity: item?.quantity,
      });

      if (!groupOrdersBySeller[item?.supplierEmail]) {
        groupOrdersBySeller[item?.supplierEmail] = { items: [] };
      }

      groupOrdersBySeller[item?.supplierEmail].items.push(item);
    });

    // creating order instance
    let order = new Order({
      customerId: _id,
      shippingAddress: defaultAddress,
      orderStatus: "placed",
      state,
      orderPlacedAt: new Date(timestamp),
      paymentMode: "card",
      paymentStatus: "pending",
      items: cartItems,
      totalAmount: finalAmount,
    });

    // saving order into db
    const result = await order.save();

    if (!result?._id) throw new Api500Error("Sorry! Order not placed.");

    // creating payment throw payment intent
    const intent = await createPaymentIntents(
      finalAmount,
      result?._id.toString(),
      paymentMethodId,
      paymentSessionId,
      req?.ip,
      req.get("user-agent")
    );

    // if payment success then change order payment status and save
    if (intent?.id) {
      order.paymentIntentId = intent?.id;
      order.paymentStatus = "paid";
    }

    const [clearCartResult, orderResult, updateInventoryResult] =
      await Promise.all([
        clearCart(_id, email),
        order.save(),
        productStockUpdater("dec", productInfos),
      ]);

    if (!orderResult) throw new Api500Error("Internal server error !");

    await session.commitTransaction();
    session.endSession();
    // after success return the response to the client
    return res.status(200).send({
      success: true,
      statusCode: 200,
      status: intent?.status,
      paymentIntentId: intent?.id,
      clientSecret: intent?.client_secret,
      message: "Payment succeed and order has been placed.",
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
}

async function purchaseOne(req: Request, res: Response, next: NextFunction) {
  const session = await startSession();
  session.startTransaction();

  try {
    const { email, _id } = req.decoded;
    const timestamp: any = Date.now();

    if (!req.body) throw new Api503Error("Service unavailable !");

    const {
      sku,
      productId,
      quantity,
      session: paymentSessionId,
      paymentMethodId,
    } = req.body;

    if (!sku || !productId || !quantity || !paymentMethodId)
      throw new Api400Error(
        "Required sku, product id, quantity, paymentMethodId"
      );

    const user = await findUserByEmail(email);

    if (!user) throw new Api503Error("Service unavailable !");

    const defaultAddress = user?.shippingAddress?.find(
      (adr: any) => adr?.default_shipping_address === true
    );

    let item = await Product.aggregate(
      single_purchase_pipe(productId, sku, quantity)
    );

    if (typeof item === "undefined" || !Array.isArray(item))
      throw new Api503Error("Service unavailable !");

    const { finalAmount } = cartContextCalculation(item);

    let order = new Order({
      state: "buy",
      customerId: _id,
      shippingAddress: defaultAddress,
      orderStatus: "placed",
      orderPlacedAt: new Date(timestamp),
      paymentMode: "card",
      paymentStatus: "pending",
      items: item,
      totalAmount: finalAmount,
    });

    const result = await order.save();

    const intent = await createPaymentIntents(
      finalAmount,
      result?._id.toString(),
      paymentMethodId,
      paymentSessionId,
      req?.ip,
      req.get("user-agent")
    );

    // if payment success then change order payment status and save
    if (intent?.id) {
      order.paymentIntentId = intent?.id;
      order.paymentStatus = "paid";
    }

    const [orderResult, updateInventoryResult] = await Promise.all([
      order.save(),
      productStockUpdater("dec", item),
    ]);

    if (!orderResult) throw new Api500Error("Internal server error !");

    await session.commitTransaction();
    session.endSession();

    // after success return the response to the client
    return res.status(200).send({
      success: true,
      statusCode: 200,
      status: intent?.status,
      paymentIntentId: intent?.id,
      clientSecret: intent?.client_secret,
      message: "Payment succeed and order has been placed.",
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
}

module.exports = { purchaseOne, purchaseCart, initializedOneForPurchase };
