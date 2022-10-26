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
        const productId = ((_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) || "";
        const formTypes = req.query.formType || "";
        const vId = req.query.vId;
        const productAttr = req.query.attr;
        const body = req.body;
        let variation = (_b = body === null || body === void 0 ? void 0 : body.request) === null || _b === void 0 ? void 0 : _b.variations;
        let model;
        if (variation) {
            if (typeof (variation === null || variation === void 0 ? void 0 : variation.title) !== 'string') {
                return res.status(400).send({ success: false, statusCode: 400, error: 'Title should be string!!!' });
            }
            if ((variation === null || variation === void 0 ? void 0 : variation.title.length) < 10 || (variation === null || variation === void 0 ? void 0 : variation.title.length) > 50) {
                return res.status(400).send({ success: false, statusCode: 400, error: 'Title length must be 10 to 30 characters!!!' });
            }
            if ((variation === null || variation === void 0 ? void 0 : variation.images.length) < 2) {
                return res.status(400).send({ success: false, statusCode: 400, error: 'Please select at least 2 images!!!' });
            }
        }
        if (formTypes === 'new-variation') {
            let variationId = Math.random().toString(36).toUpperCase().slice(2, 18);
            model = productTemplates.variationOneTemplate(variation);
            model['vId'] = variationId;
            req.body = model;
            next();
            return;
        }
        //next condition
        if (formTypes === 'update') {
            if (vId) {
                if (productAttr === 'variationOne') {
                    model = productTemplates.variationOneTemplate(variation);
                    req.body = model;
                    next();
                    return;
                }
                if (productAttr === 'variationTwo') {
                    req.body = body;
                    next();
                    return;
                }
                if (productAttr === 'variationThree') {
                    req.body = body;
                    next();
                    return;
                }
            }
        }
    }
    catch (error) {
    }
});
