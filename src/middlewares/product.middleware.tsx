import { NextFunction, Request, Response } from "express";
const { Api400Error } = require("../errors/apiResponse");


module.exports.variationMDL = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { formType } = req.query as { formType: string };

      let form: string[] = ['update-variation', 'new-variation'];

      if (!form.includes(formType)) throw new Api400Error("Invalid form type !");

      const { request } = req.body;

      if (!req.body || !req.body.hasOwnProperty("request")) throw new Api400Error("Required request property in body !");

      const { productID, variations } = request;

      if (!productID) throw new Api400Error("Required product id !");

      if (!variations?.sku) throw new Api400Error("Required variation sku !");

      if (!variations?.brandColor) throw new Api400Error("Required brand color !");

      if (!variations?.available === null || typeof variations?.available === "undefined")
         throw new Api400Error("Required stock, stock value should be start from 0!");

      request["formType"] = formType;

      req.body = request;

      next();


   } catch (error: any) {
      next(error);
   }
}

//"echo \"Error: no test specified\" && exit 1"