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
const productTemplates = require("../templates/product.template");
module.exports.variationOne = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const productID = ((_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) || "";
        const formTypes = req.query.formType || "";
        const vId = req.query.vId;
        const attrs = req.query.attr;
        const body = req.body;
        let variation = (_b = body === null || body === void 0 ? void 0 : body.request) === null || _b === void 0 ? void 0 : _b.variations;
        let model;
        // if (variation) {
        //    if (variation?.images.length < 2) {
        //       return res.status(400).send({ success: false, statusCode: 400, error: 'Please select at least 2 images!!!' });
        //    }
        // }
        // for new variation 
        if (formTypes === 'new-variation' && attrs === 'ProductVariations') {
            let variationID = Math.random().toString(36).toUpperCase().slice(2, 18);
            model = productTemplates.product_variation_template_engine(variation);
            model['_VID'] = variationID;
            req.body = model;
            next();
            return;
        }
        // update variation 
        if (formTypes === 'update-variation') {
            if (vId && attrs === 'ProductVariations') {
                model = productTemplates.product_variation_template_engine(variation);
                console.log(model);
                req.body = model;
                next();
                return;
            }
        }
        //update product attributes and description
        if (formTypes === 'update') {
            if (attrs === 'ProductSpecs') {
                req.body = body;
                next();
                return;
            }
            if (attrs === 'bodyInformation') {
                req.body = body;
                next();
                return;
            }
        }
    }
    catch (error) {
    }
});
