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
const { Api400Error } = require("../errors/apiResponse");
const { product_categories } = require("../properties/listing.property");
module.exports.listingMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, brand, imageUrls, categories, manufacturerOrigin, procurementSLA } = req === null || req === void 0 ? void 0 : req.body;
    if (!imageUrls)
        throw new Api400Error("Required product images !");
    if (imageUrls.length > 15 || imageUrls.length < 2)
        throw new Api400Error("Image url should be 2 to 15 items !");
    if (title === "")
        throw new Api400Error("Required product title !");
    if (!product_categories.includes(categories))
        throw new Api400Error("Invalid categories format !");
    if (!manufacturerOrigin)
        throw new Api400Error("Required manufacture origin !");
    if (!procurementSLA)
        throw new Api400Error("Required procurement sla !");
    next();
});
module.exports.variationMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { formType, variation, productId } = req.body;
        let form = ['update-variation', 'new-variation'];
        if (!form.includes(formType))
            throw new Api400Error("Invalid form type !");
        if (!productId)
            throw new Api400Error("Required product id !");
        if (!(variation === null || variation === void 0 ? void 0 : variation.sku))
            throw new Api400Error("Required variation sku !");
        if (!(variation === null || variation === void 0 ? void 0 : variation.available) === null || typeof (variation === null || variation === void 0 ? void 0 : variation.available) === "undefined")
            throw new Api400Error("Required stock, stock value should be start from 0!");
        next();
    }
    catch (error) {
        next(error);
    }
});
//"echo \"Error: no test specified\" && exit 1"
