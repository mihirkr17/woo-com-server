import { NextFunction, Request, Response } from "express";
const ShoppingCart = require("../../model/shoppingCart.model");
const { findUserByEmail, checkProductAvailability, actualSellingPrice, calculateShippingCost } = require("../../services/common.service");
const apiResponse = require("../../errors/apiResponse");
const { ObjectId } = require("mongodb");
const { cartTemplate } = require("../../templates/cart.template");
const Product = require("../../model/product.model");


/**
 * @apiController --> ADD PRODUCT IN CART
 * @apiMethod --> POST
 */
module.exports.addToCartHandler = async (req: Request, res: Response, next: NextFunction) => {
   try {

      const authEmail: string = req.decoded.email;
      const body = req.body;
      let cart: any;

      if (!body || typeof body !== "object")
         throw new apiResponse.Api400Error("Required body !");


      const { productID, variationID, listingID, action } = body;

      if (!productID || !variationID || !listingID)
         throw new apiResponse.Api400Error("Required product id, listing id, variation id in body !");


      const availableProduct = await checkProductAvailability(productID, variationID);

      if (!availableProduct) throw new apiResponse.Api404Error("Product is not available !");

      const cartTemp = cartTemplate(authEmail, productID, listingID, variationID);

      if (action === "toCart") {

         const existsProduct = await ShoppingCart.countDocuments(
            { $and: [{ customerEmail: authEmail }, { variationID: variationID }] }
         );

         if (existsProduct >= 1) throw new apiResponse.Api400Error("Product has already in your cart !");

         cart = new ShoppingCart(cartTemp);

         let result = await cart.save();

         if (result?._id) {
            return res.status(200).send({ success: true, statusCode: 200, message: "Product successfully added to your cart." });
         }

         throw new apiResponse.Api500Error("Something wrong !");
      }

   } catch (error: any) {
      next(error);
   }
};

module.exports.getCartContext = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const authEmail = req.decoded.email;

      const body = req.body;

      // const { cart_data } = req.cookies;

      // let cartData = cart_data && JSON.parse(cart_data);

      let user = await findUserByEmail(authEmail);

      if (!user) throw new apiResponse.Api500Error("Something wrong !");

      let defaultShippingAddress = (Array.isArray(user?.buyer?.shippingAddress) &&
         user?.buyer?.shippingAddress.filter((adr: any) => adr?.default_shipping_address === true)[0]);

      let areaType = defaultShippingAddress?.area_type || "";

      async function getCart(e: any) {
         try {
            const { productID, variationID, listingID, quantity } = e;

            let p = await Product.aggregate([
               { $match: { $and: [{ _id: ObjectId(productID) }, { _lid: listingID }] } },
               { $unwind: { path: "$variations" } },
               {
                  $match: {
                     $expr: {
                        $and: [
                           { $eq: ['$variations._vrid', variationID] },
                           { $eq: ["$variations.stock", "in"] },
                           { $eq: ["$variations.status", "active"] },
                           { $eq: ["$save_as", "fulfilled"] }
                        ]
                     }
                  }
               },
               {
                  $project: {
                     _id: 0,
                     title: "$variations.vTitle",
                     slug: 1,
                     packaged: 1,
                     shipping: 1,
                     brand: 1,
                     image: { $first: "$images" },
                     sku: "$variations.sku",
                     sellerData: 1,
                     quantity: 1,
                     savingAmount: { $multiply: [{ $subtract: ["$pricing.price", actualSellingPrice] }, parseInt(quantity)] },
                     baseAmount: { $multiply: [actualSellingPrice, parseInt(quantity)] },
                     paymentInfo: 1,
                     sellingPrice: actualSellingPrice,
                     variant: "$variations.variant",
                     available: "$variations.available",
                     stock: "$variations.stock"
                  }
               },
               {
                  $set: {
                     listingID,
                     productID,
                     customerEmail: authEmail,
                     variationID,
                     quantity: parseInt(quantity),
                  }
               },
               {
                  $unset: ["variations"]
               }
            ]);

            p = p[0];

            if (p?.shipping?.isFree && p?.shipping?.isFree) {
               p["shippingCharge"] = 0;
            } else {
               p["shippingCharge"] = calculateShippingCost(p?.packaged?.volumetricWeight, areaType);
            }

            let amountNew = p?.baseAmount + p?.shippingCharge;

            p["baseAmount"] = parseInt(amountNew);


            return p;

         } catch (error: any) {
            next(error);
         }
      }



      let c: any = Array.isArray(body) && body.map(async (e: any) => await getCart(e));

      let cart = await Promise.all(c);

      //  cart = await ShoppingCart.aggregate([
      //    { $match: { customerEmail: authEmail } },
      //    {
      //       $lookup: {
      //          from: 'products',
      //          localField: 'listingID',
      //          foreignField: "_lid",
      //          as: "main_product"
      //       }
      //    },
      //    { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$main_product", 0] }, "$$ROOT"] } } },
      //    { $project: { main_product: 0 } },
      //    { $unwind: { path: "$variations" } },
      //    {
      //       $match: {
      //          $expr: {
      //             $and: [
      //                { $eq: ['$variations._vrid', '$variationID'] },
      //                { $eq: ["$variations.stock", "in"] },
      //                { $eq: ["$variations.status", "active"] },
      //                { $eq: ["$save_as", "fulfilled"] }
      //             ]
      //          }
      //       }
      //    },
      //    {
      //       $project: {
      //          cartID: "$_id",
      //          dim: 1,
      //          _id: 0,
      //          title: "$variations.vTitle",
      //          slug: 1,
      //          packaged: 1,
      //          listingID: 1,
      //          productID: 1,
      //          customerEmail: 1,
      //          variationID: 1,
      //          variations: 1,
      //          shipping: 1,
      //          brand: 1,
      //          image: { $first: "$images" },
      //          sku: "$variations.sku",
      //          sellerData: 1,
      //          quantity: 1,
      //          savingAmount: { $multiply: [{ $subtract: ["$pricing.price", actualSellingPrice] }, '$quantity'] },
      //          baseAmount: { $multiply: [actualSellingPrice, '$quantity'] },
      //          paymentInfo: 1,
      //          sellingPrice: actualSellingPrice,
      //          variant: "$variations.variant",
      //          available: "$variations.available",
      //          stock: "$variations.stock"
      //       }
      //    },
      //    {
      //       $unset: ["variations"]
      //    }
      // ]);



      if (typeof cart === "object") {

         // cart && cart.map((p: any) => {

         //    if (p?.shipping?.isFree && p?.shipping?.isFree) {
         //       p["shippingCharge"] = 0;
         //    } else {
         //       p["shippingCharge"] = calculateShippingCost(p?.packaged?.volumetricWeight, areaType);
         //    }

         //    return p;
         // });

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

      if (cartType !== 'toCart') throw new apiResponse.Api404Error("Required cart context !");

      let cartProduct = await ShoppingCart.findOne({ $and: [{ customerEmail: authEmail }, { productID }, { _id: ObjectId(cartID) }] });

      if (!cartProduct) throw new apiResponse.Api404Error("Sorry product not found !");

      const productAvailability = await checkProductAvailability(productID, variationID);

      if (!productAvailability || typeof productAvailability === "undefined" || productAvailability === null)
         throw new apiResponse.Api400Error("Product is available !");

      if (parseInt(quantity) >= productAvailability?.variations?.available) {
         return res.status(200).send({ success: false, statusCode: 200, message: "Sorry ! your selected quantity out of range." });
      }

      cartProduct.quantity = parseInt(quantity);

      await cartProduct.save();

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
      const productID = req.headers.authorization;
      const variationID = req.query.vr;
      const authEmail = req.decoded.email;
      const cart_types = req.params.cartTypes;
      let updateDocuments;

      if (!variationID || !productID) throw new apiResponse.Api400Error("Required product id & variation id !");
      if (!ObjectId.isValid(productID)) throw new apiResponse.Api400Error("Product id is not valid !");

      if (cart_types === "toCart") {
         updateDocuments = await ShoppingCart.deleteOne({ $and: [{ customerEmail: authEmail }, { productID }, { variationID }] })
      }

      if (updateDocuments) {
         return res.status(200).send({ success: true, statusCode: 200, message: "Item removed successfully from your cart." });
      }

      throw new apiResponse.Api500Error("Failed to delete product from cart !");

   } catch (error: any) {
      next(error);
   }
};
