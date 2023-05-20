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
const Product = require("../../model/product.model");
const { home_store_product_pipe } = require("../../utils/pipelines");
module.exports.getStore = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { storeName } = req === null || req === void 0 ? void 0 : req.params;
        const { limit } = req === null || req === void 0 ? void 0 : req.query;
        let totalLimit = typeof limit === "string" && parseInt(limit);
        const allProducts = yield Product.aggregate(home_store_product_pipe(totalLimit));
        const products = yield Product.aggregate([
            { $match: { $and: [{ "supplier.store_name": storeName }, { status: "active" }] } },
            {
                $addFields: {}
            }
        ]);
        return res.status(200).send({ success: true, statusCode: 200, data: { allProducts, } });
    }
    catch (error) {
        next(error);
    }
});
