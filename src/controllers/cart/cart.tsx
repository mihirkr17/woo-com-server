import { NextFunction, Request, Response } from "express";
const ShoppingCart = require("../../model/shoppingCart.model");
const { actualSellingPriceProject, shoppingCartProject } = require("../../utils/projection");
const { findUserByEmail, checkProductAvailability, calculateShippingCost } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const { ObjectId } = require("mongodb");
const { cartTemplate } = require("../../templates/cart.template");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 100 });


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


      const { productID, variationID, listingID, action } = body;

      if (!productID || !variationID || !listingID)
         throw new apiResponse.Api400Error("Required product id, listing id, variation id in body !");


      const availableProduct = await checkProductAvailability(productID, variationID);

      if (!availableProduct) throw new apiResponse.Api404Error("Product is not available !");

      const cartTemp = cartTemplate(productID, listingID, variationID);

      if (action !== "toCart") throw new apiResponse.Api400Error("Required cart operation !");

      let existsProduct = await ShoppingCart.findOne({ customerEmail: authEmail });

      if (existsProduct) {

         let items = (Array.isArray(existsProduct.items) && existsProduct.items) || [];

         let isExist = items.some((e: any) => e.variationID === variationID);

         if (isExist) throw new apiResponse.Api400Error("Product has already in your cart !");

         existsProduct.items = [...items, cartTemp];

         cache.del(`${authEmail}_cartProducts`);

         await existsProduct.save();
         return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });

      } else {

         let shop = new ShoppingCart({
            customerEmail: authEmail,
            items: [cartTemp]
         });
         cache.del(`${authEmail}_cartProducts`);
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
      let areaType: string;
      let defaultShippingAddress: any;

      let user = await findUserByEmail(email);

      if (!user) throw new apiResponse.Api500Error("Something wrong !");

      const cartData = cache.get(`${email}_cartProducts`);// await client.get(`${email}_cartProducts`);

      if (cartData) {
         cart = JSON.parse(cartData);
      }

      else {
         console.log("Cart Fetching...");
         defaultShippingAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
            user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

         areaType = defaultShippingAddress?.area_type || "";

         cart = await ShoppingCart.aggregate([
            { $match: { customerEmail: email } },
            { $unwind: { path: "$items" } },
            {
               $lookup: {
                  from: 'products',
                  localField: "items.listingID",
                  foreignField: "_lid",
                  as: "main_product"
               }
            },
            { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
            { $project: { main_product: 0 } },
            { $unwind: { path: "$variations" } },
            {
               $match: {
                  $expr: {
                     $and: [
                        { $eq: ['$variations._vrid', '$items.variationID'] },
                        { $eq: ["$variations.stock", "in"] },
                        { $eq: ["$variations.status", "active"] },
                        { $eq: ["$save_as", "fulfilled"] }
                     ]
                  }
               }
            },
            {
               $project: shoppingCartProject
            },
            {
               $unset: ["variations", "items"]
            }
         ]);

         await cache.set(`${email}_cartProducts`, JSON.stringify(cart), 10000);
      }


      if (typeof cart === "object") {

         cart && cart.map((p: any) => {

            if (p?.shipping?.isFree && p?.shipping?.isFree) {
               p["shippingCharge"] = 0;
            } else {
               p["shippingCharge"] = calculateShippingCost((p?.packaged?.volumetricWeight * p?.quantity), areaType);
            }

            return p;
         });


         const baseAmounts = cart && cart.map((tAmount: any) => (parseInt(tAmount?.baseAmount))).reduce((p: any, c: any) => p + c, 0);
         const totalQuantities = cart && cart.map((tQuant: any) => (parseInt(tQuant?.quantity))).reduce((p: any, c: any) => p + c, 0);
         const shippingFees = cart && cart.map((p: any) => parseInt(p?.shippingCharge)).reduce((p: any, c: any) => p + c, 0);
         const finalAmounts = cart && cart.map((fAmount: any) => (parseInt(fAmount?.baseAmount) + fAmount?.shippingCharge)).reduce((p: any, c: any) => p + c, 0);
         const savingAmounts = cart && cart.map((fAmount: any) => (parseInt(fAmount?.savingAmount))).reduce((p: any, c: any) => p + c, 0);

         let shoppingCartData = {
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

         return res.status(200).send({ success: true, statusCode: 200, data: { module: shoppingCartData } });
      }

   } catch (error: any) {
      next(error);
   }
}



module.exports.updateCartProductQuantityController = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const authEmail = req.decoded.email || "";

      const body = req.body;

      const cartType = body?.actionRequestContext?.type;

      const upsertRequest = body?.upsertRequest;

      const cartContext = upsertRequest?.cartContext;

      const { productID, variationID, cartID, quantity } = cartContext;

      if (!productID || !variationID || !cartID) throw new apiResponse.Api400Error("Required product id, variation id, cart id !");

      if (!quantity || typeof quantity === "undefined") throw new apiResponse.Api400Error("Required quantity !");

      if (quantity > 5 || quantity <= 0) throw new apiResponse.Api400Error("Quantity can not greater than 5 and less than 1 !");

      if (cartType !== 'toCart') throw new apiResponse.Api404Error("Invalid cart context !");

      const productAvailability = await checkProductAvailability(productID, variationID);

      if (!productAvailability || typeof productAvailability === "undefined" || productAvailability === null)
         throw new apiResponse.Api400Error("Product is available !");

      if (parseInt(quantity) >= productAvailability?.variations?.available) {
         return res.status(200).send({ success: false, statusCode: 200, message: "Sorry ! your selected quantity out of range." });
      }

      let getCart = cache.get(`${authEmail}_cartProducts`);

      getCart = JSON.parse(getCart);

      if (!getCart) {

         console.log("Quantity updating...");
         const result = await ShoppingCart.findOneAndUpdate({ $and: [{ customerEmail: authEmail }, { _id: ObjectId(cartID) }] }, {
            $set: { "items.$[i].quantity": parseInt(quantity) }
         }, { arrayFilters: [{ "i.variationID": variationID }], upsert: true });

         if (result) return res.status(200).send({ success: true, statusCode: 200, message: `Quantity updated to ${quantity}.` });

         throw new apiResponse.Api500Error("Failed to update quantity !");
      }

      let product = getCart.find((e: any) => e?.variationID === variationID);

      let productIndex = getCart.findIndex((e: any) => e?.variationID === variationID);

      getCart[productIndex].quantity = quantity;

      getCart[productIndex].baseAmount = product.sellingPrice * quantity;

      getCart[productIndex].savingAmount = (product.price - product.sellingPrice);

      cache.set(`${authEmail}_cartProducts`, JSON.stringify(getCart), 10000);

      return res.status(200).send({ success: true, statusCode: 200, message: `Quantity updated to ${quantity}.` });

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
      const productID = req.params.productID;
      const variationID = req.query.vr;
      const authEmail = req.decoded.email;
      const cart_types = req.params.cartTypes;


      if (!variationID || !productID) throw new apiResponse.Api400Error("Required product id & variation id !");
      if (!ObjectId.isValid(productID)) throw new apiResponse.Api400Error("Product id is not valid !");

      if (cart_types !== "toCart") throw new apiResponse.Api500Error("Invalid cart type !");

      let updateDocuments = await ShoppingCart.findOneAndUpdate({ customerEmail: authEmail }, {
         $pull: { items: { $and: [{ variationID }, { productID }] } }
      });

      let cartProducts = cache.get(`${authEmail}_cartProducts`);
      cartProducts = cartProducts && JSON.parse(cartProducts);

      cartProducts = cartProducts.filter((e: any) => e?.variationID !== variationID);

      cache.set(`${authEmail}_cartProducts`, JSON.stringify(cartProducts));

      if (updateDocuments) return res.status(200).send({ success: true, statusCode: 200, message: "Item removed successfully from your cart." });

      throw new apiResponse.Api500Error("Failed to delete product from cart !");

   } catch (error: any) {
      next(error);
   }
};
