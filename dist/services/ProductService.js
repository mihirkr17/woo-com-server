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
const dbm = require("mongodb");
const { generateVerificationToken } = require("../utils/generator");
const Product_tbl = require("../model/PRODUCT_TBL");
const ProductVariation_tbl = require("../model/PRODUCT_VARIATION_TBL");
module.exports = class ProductService {
    isProduct(productId, sku) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const variant = yield ProductVariation_tbl.findOne({
                    productId: dbm.ObjectId(productId),
                    sku,
                });
                if (!variant)
                    throw new Error("Service unavailable!");
                return { stockQuantity: variant === null || variant === void 0 ? void 0 : variant.stockQuantity, stock: variant === null || variant === void 0 ? void 0 : variant.stock, supplierId: variant === null || variant === void 0 ? void 0 : variant.supplierId };
            }
            catch (error) {
                throw new Error(`Error in isProduct: ${error === null || error === void 0 ? void 0 : error.message}`);
            }
        });
    }
};
