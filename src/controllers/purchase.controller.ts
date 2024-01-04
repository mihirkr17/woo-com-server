// src/controllers/purchase.controller.ts

import { NextFunction, Request, Response } from "express";
const {
  single_purchase_pipe,
  shopping_cart_pipe,
} = require("../utils/pipelines");
const { cartContextCalculation } = require("../utils/common");
const { startSession } = require("mongoose");
const { ORDER_TABLE, ORDER_ITEMS_TABLE } = require("../model/ORDER_TBL");
const ShoppingCart = require("../model/SHOPPING_CART_TBL");
const {
  findUserByEmail,
  createPaymentIntents,
  clearCart,
  productStockUpdater,
} = require("../services/common.service");

const smtpSender = require("../services/email.service");
const {
  Error400,
  Error500,
  Error503,
} = require("../res/response");

const Product = require("../model/PRODUCT_TBL");
const Customer = require("../model/CUSTOMER_TBL");
const { ObjectId } = require("mongodb");

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
    const { email, _id: userId } = req.decoded;

    // initialized current time stamp
    const timestamp: any = Date.now();

    if (!req.body || typeof req.body === "undefined")
      throw new Error400("Required body !");

    // get state by body
    const { state, paymentMethodId, session: paymentSessionId } = req.body;

    if (state !== "CART") throw new Error400("Invalid state !");

    if (!paymentMethodId) throw new Error400("Required payment method id !");

    // finding customer by userId;
    const customer = await Customer.findOne({ userId: ObjectId(userId) });

    if (!customer)
      throw new Error400(`Sorry, User not found with this ${email}`);

    // getting default shipping address from user data;
    const shippingAddress = customer?.shippingAddress?.find(
      (adr: any) => adr?.active === true
    );

    if (!shippingAddress) throw new Error400("Required shipping address !");

    // finding cart items from Shopping cart table
    let cartItems = await ShoppingCart.aggregate(
      shopping_cart_pipe(customer?._id, "purchasing")
    );

    if (!cartItems || cartItems.length <= 0 || !Array.isArray(cartItems))
      throw new Error400(
        "Nothing for purchase ! Please add product in your cart."
      );

    // Generate final amount from cart context calculation
    const { finalAmount } = cartContextCalculation(cartItems);

    // Creating order instance
    let order = new ORDER_TABLE({
      customerId: customer?._id,
      customerContactEmail: customer?.contactEmail,
      totalItems: cartItems?.length || 0,
      shippingAddress,
      state,
      orderPlacedAt: new Date(timestamp),
      paymentMode: "card",
      paymentStatus: "pending",
      totalAmount: finalAmount,
    });

    // Saving order into db
    const result = await order.save();

    // if order not saved to db
    if (!result?._id) throw new Error("Sorry! order not placed.");

    // Creating payment throw payment intent
    const intent = await createPaymentIntents(
      finalAmount,
      result?._id.toString(),
      paymentMethodId,
      paymentSessionId,
      req?.ip,
      req.get("user-agent")
    );

    // Product Infos
    const productInfos: any[] = [];

    const groupOrdersBySeller: any = {};

    // Assigning some value to cart items for order...
    cartItems.forEach((item: any) => {
      let status: any[] = [];

      status.push({
        name: "pending",
        msg: "Thank you for shopping at WooKart! Your order is being pending.",
        time: new Date(timestamp),
      });

      item["_id"] = new ObjectId();
      item["orderId"] = result?._id;

      item["customerId"] = customer?._id;

      productInfos.push({
        productId: item?.productId,
        sku: item?.sku,
        quantity: item?.quantity,
        productType: item?.productType,
      });

      if (intent?.id) {
        status.push({
          name: "placed",
          msg: "Your order has been verified and placed.",
          time: new Date(timestamp),
        });
      }

      if (!groupOrdersBySeller[item?.supplierEmail]) {
        groupOrdersBySeller[item?.supplierEmail] = { items: [] };
      }

      groupOrdersBySeller[item?.supplierEmail].items.push(item);
      item["status"] = status;
    });

    // if payment success then update the order payment status and save
    if (intent?.id) {
      order.paymentIntentId = intent?.id;
      order.paymentStatus = "paid";
      await order.save();
      await productStockUpdater("dec", productInfos);
    }

    // Clearing current cart
    await clearCart(customer?._id, email);

    // Inserting items to the order items table...
    await ORDER_ITEMS_TABLE.insertMany(cartItems);

    // If all operation success then commit the transaction...
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

    if (!req.body) throw new Error503("Service unavailable !");

    const {
      sku,
      productId,
      quantity,
      session: paymentSessionId,
      paymentMethodId,
    } = req.body;

    if (!sku || !productId || !quantity || !paymentMethodId)
      throw new Error400(
        "Required sku, product id, quantity, paymentMethodId"
      );

    const user = await findUserByEmail(email);

    if (!user) throw new Error503("Service unavailable !");

    const defaultAddress = user?.shippingAddress?.find(
      (adr: any) => adr?.default_shipping_address === true
    );

    let item = await Product.aggregate(
      single_purchase_pipe(productId, sku, quantity)
    );

    if (typeof item === "undefined" || !Array.isArray(item))
      throw new Error503("Service unavailable !");

    const { finalAmount } = cartContextCalculation(item);

    let order = new ORDER_TABLE({
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

    if (!orderResult) throw new Error500("Internal server error !");

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
