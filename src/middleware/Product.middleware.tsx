import { Request, Response } from "express";
const productTemplates = require("../templates/product.template");

module.exports.variationOne = async (req: Request, res: Response, next: any) => {
   try {
      const productId: String = req.headers?.authorization || "";
      const formTypes = req.query.formType || "";
      const vId = req.query.vId;
      const attrs = req.query.attr;
      const body = req.body;
      let variation = body?.request?.variations;

      let model;

      if (variation) {

         if (variation?.images.length < 2) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'Please select at least 2 images!!!' });
         }
      }

      // for new variation 
      if (formTypes === 'new-variation' && attrs === 'ProductVariations') {
         let variationId = Math.random().toString(36).toUpperCase().slice(2, 18);
         model = productTemplates.productVariation(variation);
         model['_vId'] = variationId
         req.body = model;
         next();
         return;
      }

      // update variation 
      if (formTypes === 'update-variation') {

         if (vId && attrs === 'ProductVariations') {
            model = productTemplates.productVariation(variation);
            req.body = model;
            next();
            return;
         }
      }


      //update product attributes and description
      if (formTypes === 'update') {

         if (attrs === 'ProductSpecs') {
            req.body = body;
            next();
            return;
         }

         if (attrs === 'bodyInformation') {
            req.body = body;
            next();
            return;
         }
      }

   } catch (error: any) {

   }
}