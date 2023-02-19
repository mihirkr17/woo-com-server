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
const { dbConnection } = require("../../utils/db");
const { ObjectId } = require("mongodb");
module.exports.addProductRating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield dbConnection();
        const productID = req.params.productID;
        const email = req.decoded.email;
        const body = req.body;
        const orderId = parseInt(body === null || body === void 0 ? void 0 : body.orderId);
        yield db.collection("orders").updateOne({ user_email: email }, {
            $set: {
                "orders.$[i].isRating": true,
            },
        }, { upsert: true, arrayFilters: [{ "i.orderId": orderId }] });
        const products = yield db.collection("products").findOne({
            _id: ObjectId(productID),
            status: "active",
        });
        const point = parseInt(body === null || body === void 0 ? void 0 : body.rating_point);
        let ratingPoints = (products === null || products === void 0 ? void 0 : products.rating) && (products === null || products === void 0 ? void 0 : products.rating.length) > 0
            ? products === null || products === void 0 ? void 0 : products.rating
            : [
                { weight: 5, count: 0 },
                { weight: 4, count: 0 },
                { weight: 3, count: 0 },
                { weight: 2, count: 0 },
                { weight: 1, count: 0 },
            ];
        let counter = 0;
        let newRatingArray = [];
        for (let i = 0; i < ratingPoints.length; i++) {
            let count = ratingPoints[i].count;
            let weight = ratingPoints[i].weight;
            if (point === weight) {
                counter = count;
                count += 1;
            }
            newRatingArray.push({ weight, count: count });
        }
        let weightVal = 0;
        let countValue = 0;
        newRatingArray &&
            newRatingArray.length > 0 &&
            newRatingArray.forEach((rat) => {
                const multiWeight = parseInt(rat === null || rat === void 0 ? void 0 : rat.weight) * parseInt(rat === null || rat === void 0 ? void 0 : rat.count);
                weightVal += multiWeight;
                countValue += rat === null || rat === void 0 ? void 0 : rat.count;
            });
        const ava = weightVal / countValue;
        const average = parseFloat(ava.toFixed(1));
        let filters;
        let options;
        if ((products === null || products === void 0 ? void 0 : products.rating) && (products === null || products === void 0 ? void 0 : products.rating.length) > 0) {
            filters = {
                $set: {
                    "rating.$[i].count": counter + 1,
                    ratingAverage: average,
                },
                $push: { reviews: body },
            };
            options = { upsert: true, arrayFilters: [{ "i.weight": point }] };
        }
        else {
            filters = {
                $set: {
                    rating: newRatingArray,
                    ratingAverage: average,
                },
                $push: { reviews: body },
            };
            options = { upsert: true };
        }
        const result = yield db.collection("products").updateOne({ _id: ObjectId(productID) }, filters, options);
        if (result) {
            return res.status(200).send({ message: "Thanks for your review !" });
        }
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
