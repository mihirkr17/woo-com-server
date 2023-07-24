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
module.exports.variationMDL = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { formType } = req.query;
        let form = ['update-variation', 'new-variation'];
        if (!form.includes(formType))
            throw new Api400Error("Invalid form type !");
        const { request } = req.body;
        if (!req.body || !req.body.hasOwnProperty("request"))
            throw new Api400Error("Required request property in body !");
        const { productID, variations } = request;
        if (!productID)
            throw new Api400Error("Required product id !");
        if (!(variations === null || variations === void 0 ? void 0 : variations.sku))
            throw new Api400Error("Required variation sku !");
        if (!(variations === null || variations === void 0 ? void 0 : variations.brandColor))
            throw new Api400Error("Required brand color !");
        if (!(variations === null || variations === void 0 ? void 0 : variations.available) === null || typeof (variations === null || variations === void 0 ? void 0 : variations.available) === "undefined")
            throw new Api400Error("Required stock, stock value should be start from 0!");
        request["formType"] = formType;
        req.body = request;
        next();
    }
    catch (error) {
        next(error);
    }
});
//"echo \"Error: no test specified\" && exit 1"
