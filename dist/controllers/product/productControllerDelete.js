"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
var { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
// Delete product by inventory management
module.exports.deleteProductController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const user = req.decoded;
        const productId = req.headers.authorization || "";
        const deletedProduct = yield db
            .collection("products")
            .deleteOne({ _id: ObjectId(productId) }); //return --> "acknowledged" : true, "deletedCount" : 1
        if (!deletedProduct.deletedCount) {
            return res.status(503).send({
                success: false,
                statusCode: 503,
                error: "Service unavailable",
            });
        }
        yield db
            .collection("users")
            .updateMany({ "shoppingCartItems._id": productId }, { $pull: { shoppingCartItems: { _id: productId } } });
        return res.status(200).send({
            success: true,
            statusCode: 200,
            message: "Product deleted successfully.",
        });
    }
    catch (error) {
        return res
            .status(500)
            .send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
// delete product variation controller
module.exports.deleteProductVariationController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const productId = req.params.productId;
        const vId = req.params.vId;
        const product = yield db.collection('products').findOne({ _id: ObjectId(productId) });
        if (!product) {
            return res.status(404).send({ success: false, statusCode: 404, error: 'Sorry! Product not found!!!' });
        }
        if (product && Array.isArray(product === null || product === void 0 ? void 0 : product.variations) && (product === null || product === void 0 ? void 0 : product.variations.length) <= 1) {
            return res.status(200).send({ success: false, statusCode: 200, message: "Please create another variation before delete this variation !" });
        }
        const result = yield db.collection('products').updateOne({ $and: [{ _id: ObjectId(productId) }, { 'variations.vId': vId }] }, { $pull: { variations: { vId: vId } } });
        if (result) {
            return res.status(200).send({ success: true, statusCode: 200, message: 'Variation deleted successfully.' });
        }
        return res.status(500).send({ success: false, statusCode: 500, message: 'Failed to delete!!!' });
    }
    catch (error) {
        return res.status(500).send({ success: false, statusCode: 500, error: error === null || error === void 0 ? void 0 : error.message });
    }
});
