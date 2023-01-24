import { Request, Response } from "express";
var { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");


// Delete product by inventory management
module.exports.deleteProductController = async (
   req: Request,
   res: Response
) => {
   try {
      const db = await dbConnection();
      const user = req.decoded;

      const productId: String = req.headers.authorization || "";

      const deletedProduct = await db
         .collection("products")
         .deleteOne({ _id: ObjectId(productId) }); //return --> "acknowledged" : true, "deletedCount" : 1

      if (!deletedProduct.deletedCount) {
         return res.status(503).send({
            success: false,
            statusCode: 503,
            error: "Service unavailable",
         });
      }

      await db
         .collection("users")
         .updateMany(
            { "shoppingCartItems._id": productId },
            { $pull: { shoppingCartItems: { _id: productId } } }
         );

      return res.status(200).send({
         success: true,
         statusCode: 200,
         message: "Product deleted successfully.",
      });
   } catch (error: any) {
      return res
         .status(500)
         .send({ success: false, statusCode: 500, error: error?.message });
   }
};




// delete product variation controller
module.exports.deleteProductVariationController = async (req: Request, res: Response) => {
   try {
      const db = await dbConnection();

      const productId = req.params.productId;
      const vId = req.params.vId;

      const product = await db.collection('products').findOne({ _id: ObjectId(productId) });

      if (!product) {
         return res.status(404).send({ success: false, statusCode: 404, error: 'Sorry! Product not found!!!' });
      }

      if (product && Array.isArray(product?.variations) && product?.variations.length <= 1) {
         return res.status(200).send({success: false, statusCode: 200, message: "Please create another variation before delete this variation !"});
      }

      const result = await db.collection('products').updateOne(
         { $and: [{ _id: ObjectId(productId) }, { 'variations.vId': vId }] },
         { $pull: { variations: { vId: vId } } }
      );

      if (result) {
         return res.status(200).send({ success: true, statusCode: 200, message: 'Variation deleted successfully.' });
      }

      return res.status(500).send({ success: false, statusCode: 500, message: 'Failed to delete!!!' });

   } catch (error: any) {
      return res.status(500).send({ success: false, statusCode: 500, error: error?.message });
   }
}