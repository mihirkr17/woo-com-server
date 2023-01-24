import { Request, Response } from "express";
var { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");

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
module.exports.productOperationController = async (req: Request, res: Response) => {
  try {
    const db = await dbConnection();

    const productId: String = req.headers?.authorization || "";
    const formTypes = req.query.formType || "";
    const vId = req.query.vId;
    const productAttr = req.query.attr;
    let result;
    let model = req.body;

    // Update variation
    if (formTypes === 'update-variation') {
      model['_vId'] = vId;
      if (vId && productAttr === 'ProductVariations') {
        result = await db.collection('products').updateOne(
          {
            $and: [{ _id: ObjectId(productId) }, { 'variations._vId': vId }]
          },
          {
            $set: {
              'variations.$[i]': model,
            }
          },
          { arrayFilters: [{ "i._vId": vId }] }
        );
      }
    }

    // create new variation
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

      if (productAttr === 'ProductSpecs') {

        result = await db.collection('products').updateOne(
          { _id: ObjectId(productId) },
          {
            $set: { specification: model }
          },
          { upsert: true }
        );
      }

      if (productAttr === 'bodyInformation') {

        result = await db.collection('products').updateOne(
          { _id: ObjectId(productId) },
          {
            $set: { bodyInfo: model }
          },
          { upsert: true }
        );
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


module.exports.productControlController = async (req: Request, res: Response) => {
  try {

    const db = await dbConnection();

    const body = req.body;
    let product: any;

    if (body?.market_place !== 'woo-kart') {
      return res.status(403).send({ success: false, statusCode: 403, error: "Forbidden." });
    }

    if (body?.data?.vId) {

      product = await db.collection('products').updateOne(
        { $and: [{ _id: ObjectId(body?.data?.pId) }, { _lId: body?.data?.lId }, { save_as: 'fulfilled' }] },
        { $set: { 'variations.$[i].status': body?.data?.action } },
        { arrayFilters: [{ "i._vId": body?.data?.vId }] });
    } else {
      product = await db.collection('products').updateOne(
        { $and: [{ _id: ObjectId(body?.data?.pId) }, { _lId: body?.data?.lId }] },
        { $set: { save_as: body?.data?.action, "variations.$[].status": "inactive" } },
        { upsert: true, multi: true });
    }


    if (product) {
      return res.status(200).send({ success: true, statusCode: 200, message: `Request ${body?.data?.action}` });
    }


  } catch (error: any) {
    res.status(500).send({ success: false, statusCode: 500, error: error?.message });
  }
}