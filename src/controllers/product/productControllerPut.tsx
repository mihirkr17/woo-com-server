import { Request, Response } from "express";
var { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
const {
  productUpdateModel,
  productImagesModel,
} = require("../../templates/product.template");


module.exports.updateProductController = async (
  req: Request,
  res: Response
) => {
  try {
    const db = await dbConnection();

    const productId: String = req.headers?.authorization || "";
    const body = req.body;
    let model;

    if (body?.images) {
      model = productImagesModel(body);
    } else {
      model = productUpdateModel(body);
    }

    const exists =
      (await db
        .collection("users")
        .find({ "shoppingCartItems._id": productId })
        .toArray()) || [];

    if (exists && exists.length > 0) {
      await db.collection("users").updateMany(
        { "shoppingCartItems._id": productId },
        {
          $pull: { shoppingCartItems: { _id: productId } },
        }
      );
    }

    const result = await db
      .collection("products")
      .updateOne(
        { _id: ObjectId(productId) },
        { $set: model },
        { upsert: true }
      );

    res.status(200).send(result && { message: "Product updated successfully" });
  } catch (error: any) {
    res.status(500).send({ message: error?.message });
  }
};

// Update Product Stock Controller
module.exports.updateStockController = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const productId: String = req.headers.authorization || "";
    const body = req.body;

    if (productId && body) {
      let stock = body?.available <= 1 ? "out" : "in";

      const result = await db.collection("products").updateOne(
        { _id: ObjectId(productId) },
        {
          $set: {
            "stockInfo.available": body?.available,
            "stockInfo.stock": stock,
          },
        },
        { upsert: true }
      );

      if (!result) {
        return res.status(503).send({
          success: false,
          statusCode: 503,
          error: "Failed to update stock quantity !!!",
        });
      }

      return res.status(200).send({
        success: true,
        statusCode: 200,
        message: "Product stock updated successfully.",
      });
    }
  } catch (error: any) {
    res
      .status(500)
      .send({ success: false, statusCode: 500, error: error?.message });
  }
};



// product variation controller
module.exports.productVariationController = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();
    const productId: String = req.headers?.authorization || "";
    const formTypes = req.query.formType || "";
    const vId = req.query.vId;
    const productAttr = req.query.attr;
    let result;
    let model = req.body;

    if (formTypes === 'new-variation') {
      result = await db.collection('products').updateOne(
        {
          _id: ObjectId(productId)
        },
        {
          $push: { variations: model }
        },
        { upsert: true }
      );
    }

    // next condition
    else if (formTypes === 'update') {

      if (vId) {

        if (productAttr === 'variationOne') {
          result = await db.collection('products').updateOne(
            {
              $and: [{ _id: ObjectId(productId) }, { 'variations.vId': vId }]
            },
            {
              $set: {
                'variations.$[i].title': model.title,
                'variations.$[i].slug': model.slug,
                'variations.$[i].images': model.images,
                'variations.$[i].sku': model.sku,
                'variations.$[i].pricing': model.pricing,
                'variations.$[i].stock': model.stock,
                'variations.$[i].available': model.available,
                'variations.$[i].status': model.status,
              }
            },
            { arrayFilters: [{ "i.vId": vId }] }
          );
        }

        if (productAttr === 'variationTwo') {

          result = await db.collection('products').updateOne(
            {
              $and: [{ _id: ObjectId(productId) }, { 'variations.vId': vId }]
            },
            {
              $set: { 'variations.$[i].attributes': model }
            },
            { arrayFilters: [{ "i.vId": vId }] }
          );
        }

        if (productAttr === 'variationThree') {

          result = await db.collection('products').updateOne(
            { _id: ObjectId(productId) },
            {
              $set: { bodyInfo: model }
            },
            { upsert: true }
          );
        }
      }
    }

    if (result) {
      return res.status(200).send({ success: true, statusCode: 200, message: "Data Saved" });
    }
    return res.status(500).send({ success: false, statusCode: 500, error: "Failed" });

  } catch (error: any) {
    return res.status(500).send({ success: false, statusCode: 500, error: error?.message });
  }
}
