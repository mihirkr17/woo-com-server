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
const { dbh } = require("../../utils/db");
module.exports.manageProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield dbh.connect();
    const productsCollection = dbh.db("Products").collection("product");
    let item;
    let page;
    let seller_name = req.query.seller;
    item = req.query.items;
    page = req.query.page;
    let searchText = req.query.search;
    let filters = req.query.category;
    let cursor;
    let result;
    const searchQuery = (sTxt, seller_name = "") => {
        item = "";
        page = "";
        let findProduct = {
            $or: [
                { title: { $regex: sTxt, $options: "i" } },
                { seller: { $regex: sTxt, $options: "i" } },
            ],
        };
        if (seller_name) {
            findProduct["seller"] = seller_name;
        }
        return findProduct;
    };
    const filterQuery = (category, seller_name = "") => {
        item = "";
        page = "";
        let findProduct = {
            "genre.category": category,
        };
        if (seller_name) {
            findProduct["seller"] = seller_name;
        }
        return findProduct;
    };
    page = parseInt(page) === 1 ? 0 : parseInt(page) - 1;
    try {
        cursor =
            searchText && searchText.length > 0
                ? productsCollection.find(searchQuery(searchText, seller_name || ""))
                : filters && filters !== "all"
                    ? productsCollection.find(filterQuery(filters, seller_name || ""))
                    : productsCollection.find((seller_name && { seller: seller_name }) || {});
        if (item || page) {
            result = yield cursor
                .skip(page * parseInt(item))
                .limit(parseInt(item))
                .toArray();
        }
        else {
            result = yield cursor.toArray();
        }
        res.status(200).send(result);
    }
    catch (error) {
        res.status(500).send({ message: error === null || error === void 0 ? void 0 : error.message });
    }
});
