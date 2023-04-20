"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { update_variation_stock_available, clearCart } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const OrderTableModel = require("../../model/orderTable.model");
module.exports = function confirmOrder(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email } = req.decoded;
            const { paymentMethodID, orderPaymentID, productInfos, orderState } = req.body;
            if (!req.body || typeof req.body !== "object" || !orderPaymentID || !productInfos)
                throw new apiResponse.Api503Error("Service unavailable !");
            yield OrderTableModel.updateMany({ $and: [{ orderPaymentID }] }, {
                $set: {
                    paymentMethodID,
                    paymentStatus: "paid"
                }
            }, {});
            const orderPromises = paymentMethodID && productInfos.map((item) => __awaiter(this, void 0, void 0, function* () {
                return yield update_variation_stock_available("dec", {
                    productID: item === null || item === void 0 ? void 0 : item.productID,
                    listingID: item === null || item === void 0 ? void 0 : item.listingID,
                    variationID: item === null || item === void 0 ? void 0 : item.variationID,
                    quantity: item === null || item === void 0 ? void 0 : item.quantity
                });
            }));
            yield Promise.all(orderPromises);
            // after order confirmed then return response to the client
            orderState === "byCart" && (yield clearCart(email));
            return res.status(200).send({ message: "Order completed.", statusCode: 200, success: true });
        }
        catch (error) {
            next(error);
        }
    });
};
// module.exports = async function confirmOrder(req: Request, res: Response, next: NextFunction) {
//    try {
//       const { email } = req.decoded;
//       const { paymentIntentID, paymentMethodID, orderPaymentID, orderItems } = req.body as {
//          paymentIntentID: string;
//          paymentMethodID: string;
//          orderPaymentID: string;
//          orderItems: any[];
//       };
//       if (!req.body || typeof req.body !== "object" || !paymentIntentID || !paymentMethodID || !orderItems || !Array.isArray(orderItems) || orderItems.length <= 0) {
//          throw new apiResponse.Api503Error("Service unavailable !");
//       }
//       function separateOrdersBySeller(upRes: any[]) {
//          let newOrder: any = {};
//          for (const orderItem of upRes) {
//             const sellerEmail = orderItem?.sellerData?.sellerEmail;
//             if (!newOrder[sellerEmail]) {
//                newOrder[sellerEmail] = [];
//             }
//             newOrder[sellerEmail].push(orderItem);
//          }
//          return newOrder;
//       }
//       async function confirmOrderHandler(product: any) {
//          const { productID,
//             variationID,
//             listingID,
//             quantity,
//             areaType,
//             shipping,
//             packaged,
//             baseAmount,
//          } = product;
//          const timestamp: any = Date.now();
//          product["orderID"] = generateItemID();
//          product["trackingID"] = generateTrackingID();
//          product["orderPaymentID"] = orderPaymentID;
//          product["paymentIntentID"] = paymentIntentID;
//          product["paymentMethodID"] = paymentMethodID;
//          product["paymentStatus"] = "success";
//          product["paymentMode"] = "card";
//          product["shippingCharge"] = shipping?.isFree ? 0 : calculateShippingCost(packaged?.volumetricWeight, areaType);
//          product["baseAmount"] = parseInt(baseAmount + product?.shippingCharge);
//          product["orderAT"] = {
//             iso: new Date(timestamp),
//             time: new Date(timestamp).toLocaleTimeString(),
//             date: new Date(timestamp).toDateString(),
//             timestamp: timestamp
//          }
//          const result = await Order.findOneAndUpdate(
//             { user_email: email },
//             { $push: { orders: product } },
//             { upsert: true }
//          );
//          if (result) {
//             await update_variation_stock_available("dec", { productID, listingID, variationID, quantity });
//             return product;
//          }
//       }
//       const orderPromises: any = Array.isArray(orderItems) && orderItems.map(async (orderItem: any) => await confirmOrderHandler(orderItem));
//       const result: any = await Promise.all(orderPromises);
//       // calculating total amount of order items
//       const totalAmount: number = Array.isArray(result) ?
//          result.reduce((p: number, n: any) => p + parseInt(n?.baseAmount), 0) : 0;
//       // after calculating total amount and order succeed then email sent to the buyer
//       await email_service({
//          to: email,
//          subject: "Order confirmed",
//          html: buyer_order_email_template(result, totalAmount)
//       });
//       // after order succeed then group the order item by seller email and send email to the seller
//       const orderBySellers: any = (Array.isArray(result) && result.length >= 1) ? separateOrdersBySeller(result) : {};
//       // after successfully got order by seller as a object then loop it and trigger send email function inside for in loop
//       for (const sellerEmail in orderBySellers) {
//          const items = orderBySellers[sellerEmail];
//          await email_service({
//             to: sellerEmail,
//             subject: "New order confirmed",
//             html: seller_order_email_template(items)
//          });
//       }
//       // after order confirmed then return response to the client
//       await clearCart(email);
//       return res.status(200).send({ message: "Order completed.", statusCode: 200, success: true });
//    } catch (error: any) {
//       next(error);
//    }
// }
