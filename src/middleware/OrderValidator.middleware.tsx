import { Request, Response } from "express";

const orderValidator = (req: Request, res: Response, next: any) => {
  const {
    orderId,
    trackingId,
    user_email,
    ownerProfit,
    productID,
    title,
    slug,
    brand,
    image,
    sku,
    price,
    totalAmount,
    quantity,
    seller,
    payment_mode,
    shipping_address,
    package_dimension,
    delivery_service,
  } = req.body;

  const errorMessage = (msg: string) => {
    return res.status(400).send({ success: false, error: `${msg}` });
  };

  if (orderId === "" || !orderId) {
    errorMessage("Order ID Required !");
  }

  if (typeof orderId !== "number") {
    errorMessage("Invalid Order ID. Order ID must be numbers");
  }

  if (!trackingId || trackingId === "") {
    errorMessage("Tracking ID Required !");
  }

  if (typeof trackingId !== "string") {
    errorMessage("Tracking ID must be string");
  }

  next();
};

module.exports = orderValidator;
