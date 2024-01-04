import { NextFunction, Request, Response } from "express";
const { Error400 } = require("../res/response");
const { product_categories } = require("../properties/listing.property");

module.exports.listingMDL = async (req: Request, res: Response, next: NextFunction) => {

   const { title, brand, imageUrls, categories, manufacturerOrigin, procurementSLA }: any = req?.body;

   if (!imageUrls) throw new Error400("Required product images !");

   if (imageUrls.length > 15 || imageUrls.length < 2) throw new Error400("Image url should be 2 to 15 items !");

   if (title === "") throw new Error400("Required product title !");

   if (!product_categories.includes(categories)) throw new Error400("Invalid categories format !");

   if (!manufacturerOrigin) throw new Error400("Required manufacture origin !");

   if (!procurementSLA) throw new Error400("Required procurement sla !");

   next();
}


module.exports.variationMDL = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { requestFor: formType }: any = req?.query;

      const { productId, stockQuantity, stockPrice } = req.body;

      let form: string[] = ['update-variation', 'new-variation'];

      if (!form.includes(formType)) throw new Error400("Invalid form type !");

      if (!productId) throw new Error400("Required product id !");

      if (!stockPrice) throw new Error400("Required variation sku !");

      if (!stockQuantity || typeof stockQuantity === "undefined")
         throw new Error400("Required stock, stock value should be start from 0!");

      next();


   } catch (error: any) {
      next(error);
   }
}

//"echo \"Error: no test specified\" && exit 1"