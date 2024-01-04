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
const { Error400 } = require("../res/response");
const { product_categories } = require("../properties/listing.property");
module.exports.listingMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, brand, imageUrls, categories, manufacturerOrigin, procurementSLA } = req === null || req === void 0 ? void 0 : req.body;
    if (!imageUrls)
        throw new Error400("Required product images !");
    if (imageUrls.length > 15 || imageUrls.length < 2)
        throw new Error400("Image url should be 2 to 15 items !");
    if (title === "")
        throw new Error400("Required product title !");
    if (!product_categories.includes(categories))
        throw new Error400("Invalid categories format !");
    if (!manufacturerOrigin)
        throw new Error400("Required manufacture origin !");
    if (!procurementSLA)
        throw new Error400("Required procurement sla !");
    next();
});
module.exports.variationMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestFor: formType } = req === null || req === void 0 ? void 0 : req.query;
        const { productId, stockQuantity, stockPrice } = req.body;
        let form = ['update-variation', 'new-variation'];
        if (!form.includes(formType))
            throw new Error400("Invalid form type !");
        if (!productId)
            throw new Error400("Required product id !");
        if (!stockPrice)
            throw new Error400("Required variation sku !");
        if (!stockQuantity || typeof stockQuantity === "undefined")
            throw new Error400("Required stock, stock value should be start from 0!");
        next();
    }
    catch (error) {
        next(error);
    }
});
//"echo \"Error: no test specified\" && exit 1"
