import { NextFunction, Request, Response } from "express";
const ShoppingCart = require("../../model/shoppingCart.model");
const { shopping_cart_pipe } = require("../../utils/pipelines");
const { findUserByEmail, checkProductAvailability } = require("../../services/common.service");
const { calculateShippingCost } = require("../../utils/common");
const apiResponse = require("../../errors/apiResponse");
const { ObjectId } = require("mongodb");
const { cartTemplate } = require("../../templates/cart.template");
const NodeCache = require("../../utils/NodeCache");



/**
 * @apiController --> ADD PRODUCT IN CART
 * @apiMethod --> POST
 */
module.exports.addToCartHandler = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const authEmail: string = req.decoded.email;
      const body = req.body;

      if (!body || typeof body !== "object")
         throw new apiResponse.Api400Error("Required body !");


      const { productID, sku, listingID, action } = body;

      if (!productID || !sku || !listingID)
         throw new apiResponse.Api400Error("Required product id, listing id, variation id in body !");

      const availableProduct = await checkProductAvailability(productID, sku);

      if (!availableProduct) throw new apiResponse.Api404Error("Product is not available !");

      const cartTemp = cartTemplate(productID, listingID, sku);

      if (action !== "toCart") throw new apiResponse.Api400Error("Required cart operation !");

      let existsProduct = await ShoppingCart.findOne({ customerEmail: authEmail });

      if (existsProduct) {

         let items = (Array.isArray(existsProduct.items) && existsProduct.items) || [];

         let isExist = items.some((e: any) => e.sku === sku);

         if (isExist) throw new apiResponse.Api400Error("Product has already in your cart !");

         existsProduct.items = [...items, cartTemp];

         NodeCache.deleteCache(`${authEmail}_cartProducts`);

         await existsProduct.save();
         return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });

      } else {

         let shop = new ShoppingCart({
            customerEmail: authEmail,
            items: [cartTemp]
         });
         NodeCache.deleteCache(`${authEmail}_cartProducts`);
         await shop.save();

         return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });
      }


   } catch (error: any) {
      next(error);
   }
};

module.exports.getCartContext = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { email } = req.decoded;

      let cart: any[];

      let user = await findUserByEmail(email);

      if (!user || user?.role !== "BUYER") throw new apiResponse.Api401Error("Permission denied !");

      const cartData = NodeCache.getCache(`${email}_cartProducts`);
      if (cartData) {
         cart = cartData;
      } else {
         cart = await ShoppingCart.aggregate(shopping_cart_pipe(email));
         await NodeCache.saveCache(`${email}_cartProducts`, cart);
      }

      // declare cart calculation variables 
      let baseAmounts: number = 0;
      let totalQuantities: number = 0;
      let shippingFees: number = 0;
      let finalAmounts: number = 0;
      let savingAmounts: number = 0;

      const defaultShippingAddress = user?.buyer?.shippingAddress?.find((adr: any) => adr.default_shipping_address === true);

      const areaType = defaultShippingAddress?.area_type ?? "";

      if (typeof cart === "object" && cart.length >= 1) {

         cart.forEach((p: any) => {

            if (p?.shipping) {
               p["shippingCharge"] = 0;
            } else {
               p["shippingCharge"] = calculateShippingCost((p?.packaged?.volumetricWeight * p?.quantity), areaType);
            }

            baseAmounts += p?.baseAmount;
            totalQuantities += p?.quantity;
            shippingFees += p?.shippingCharge;
            finalAmounts += (parseInt(p?.baseAmount) + p?.shippingCharge);
            savingAmounts += p?.savingAmount;
         });
      }


      if (finalAmounts >= 500) {
         finalAmounts = finalAmounts - shippingFees;
         shippingFees = -shippingFees;
      }

      return res.status(200).send({
         success: true, statusCode: 200, data: {
            module: {
               products: cart,
               container_p: {
                  baseAmounts,
                  totalQuantities,
                  finalAmounts,
                  shippingFees,
                  savingAmounts
               },
               numberOfProducts: cart.length || 0,
               defaultShippingAddress
            }
         }
      });

   } catch (error: any) {
      next(error);
   }
}



module.exports.updateCartProductQuantityController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { email } = req.decoded;

      const { type } = req?.body?.actionRequestContext;

      const { productID, sku, cartID, quantity } = req?.body?.upsertRequest?.cartContext;

      if (!productID || !sku || !cartID) throw new apiResponse.Api400Error("Required product id, variation id, cart id !");

      if (!quantity || typeof quantity === "undefined") throw new apiResponse.Api400Error("Required quantity !");

      if (quantity > 5 || quantity <= 0) throw new apiResponse.Api400Error("Quantity can not greater than 5 and less than 1 !");

      if (type !== 'toCart') throw new apiResponse.Api404Error("Invalid cart context !");

      const productAvailability = await checkProductAvailability(productID, sku);

      if (!productAvailability || typeof productAvailability === "undefined" || productAvailability === null)
         throw new apiResponse.Api400Error("Product is available !");

      if (parseInt(quantity) >= productAvailability?.variations?.available) {
         return res.status(200).send({ success: false, statusCode: 200, message: "Sorry ! your selected quantity out of range." });
      }

      let getCart = NodeCache.getCache(`${email}_cartProducts`);

      // if cart has cache then some operation 
      if (getCart) {

         let product = getCart.find((e: any) => e?.sku === sku);

         let productIndex = getCart.findIndex((e: any) => e?.sku === sku);

         getCart[productIndex].quantity = quantity;

         getCart[productIndex].baseAmount = product.sellingPrice * quantity;

         getCart[productIndex].savingAmount = (product.price - product.sellingPrice);

         NodeCache.saveCache(`${email}_cartProducts`, getCart);
      }

      const result = await ShoppingCart.findOneAndUpdate({ $and: [{ customerEmail: email }, { _id: ObjectId(cartID) }] }, {
         $set: { "items.$[i].quantity": parseInt(quantity) }
      }, { arrayFilters: [{ "i.sku": sku }], upsert: true });

      if (result) return res.status(200).send({ success: true, statusCode: 200, message: `Quantity updated to ${quantity}.` });

      throw new apiResponse.Api500Error("Failed to update quantity !");
   } catch (error: any) {
      next(error);
   }
}


/**
 * @apiController --> DELETE PRODUCT FROM CART
 * @apiMethod --> DELETE
 * @apiRequired --> product id & variation id
 */
module.exports.deleteCartItem = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { productID, sku, cartTypes } = req.params as { productID: string, sku: string, cartTypes: string };

      const { email } = req.decoded;

      if (!sku || !productID) throw new apiResponse.Api400Error("Required product id & sku !");

      if (!ObjectId.isValid(productID)) throw new apiResponse.Api400Error("Product id is not valid !");

      if (cartTypes !== "toCart") throw new apiResponse.Api500Error("Invalid cart type !");

      let deleted = await ShoppingCart.findOneAndUpdate({ customerEmail: email }, {
         $pull: { items: { $and: [{ sku }, { productID }] } }
      });

      if (!deleted) throw new apiResponse.Api500Error(`Couldn't delete product with sku ${sku}!`);


      // getting cart items from cache
      let cartProductsInCache = NodeCache.getCache(`${email}_cartProducts`);

      if (cartProductsInCache) {
         NodeCache.saveCache(`${email}_cartProducts`, Array.isArray(cartProductsInCache) && cartProductsInCache.filter((e: any) => e?.sku !== sku));
      }


      return res.status(200).send({ success: true, statusCode: 200, message: "Item removed successfully from your cart." });

   } catch (error: any) {
      next(error);
   }
};
