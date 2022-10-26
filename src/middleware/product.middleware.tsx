import { Request, Response } from "express";
const productTemplates = require("../templates/product.template");

module.exports.variationOne = async (req: Request, res: Response, next: any) => {
   try {
      const productId: String = req.headers?.authorization || "";
      const formTypes = req.query.formType || "";
      const vId = req.query.vId;
      const productAttr = req.query.attr;
      const body = req.body;
      let variation = body?.request?.variations;

      let model;

      if (variation) {
         if (typeof variation?.title !== 'string') {
            return res.status(400).send({ success: false, statusCode: 400, error: 'Title should be string!!!' });
         }

         if (variation?.title.length < 10 || variation?.title.length > 50) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'Title length must be 10 to 30 characters!!!' });
         }

         if (variation?.images.length < 2) {
            return res.status(400).send({ success: false, statusCode: 400, error: 'Please select at least 2 images!!!' });
         }
      }

      if (formTypes === 'new-variation') {
         let variationId = Math.random().toString(36).toUpperCase().slice(2, 18);
         model = productTemplates.variationOneTemplate(variation);
         model['vId'] = variationId
         req.body = model;
         next();
         return;
      }


      //next condition
      if (formTypes === 'update') {
         if (vId) {
            if (productAttr === 'variationOne') {
               model = productTemplates.variationOneTemplate(variation);
               req.body = model;
               next();
               return;
            }

            if (productAttr === 'variationTwo') {
               req.body = body;
               next();
               return;
            }

            if (productAttr === 'variationThree') {
               req.body = body;
               next();
               return;
            }
         }
      }

   } catch (error: any) {

   }
}