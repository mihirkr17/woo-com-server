import { NextFunction, Request, Response } from "express";
const { Api400Error } = require("../errors/apiResponse");
const { product_categories } = require("../properties/listing.property");

module.exports.listingMDL = async (req: Request, res: Response, next: NextFunction) => {

   const { title, brand, imageUrls, categories, manufacturerOrigin, procurementSLA }: any = req?.body;

   if (!imageUrls) throw new Api400Error("Required product images !");

   if (imageUrls.length > 15 || imageUrls.length < 2) throw new Api400Error("Image url should be 2 to 15 items !");

   if (title === "") throw new Api400Error("Required product title !");

   if (!product_categories.includes(categories)) throw new Api400Error("Invalid categories format !");

   if (!manufacturerOrigin) throw new Api400Error("Required manufacture origin !");

   if (!procurementSLA) throw new Api400Error("Required procurement sla !");

   next();
}


module.exports.variationMDL = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { formType, variation, productId } = req.body as { formType: string, variation: Record<string, any>, productId: string };

      let form: string[] = ['update-variation', 'new-variation'];

      if (!form.includes(formType)) throw new Api400Error("Invalid form type !");

      if (!productId) throw new Api400Error("Required product id !");

      if (!variation?.sku) throw new Api400Error("Required variation sku !");

      if (!variation?.available === null || typeof variation?.available === "undefined")
         throw new Api400Error("Required stock, stock value should be start from 0!");

      next();


   } catch (error: any) {
      next(error);
   }
}

//"echo \"Error: no test specified\" && exit 1"