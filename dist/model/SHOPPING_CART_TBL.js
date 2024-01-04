"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
module.exports = (0, mongoose_1.model)("SHOPPING_CART_TBL", new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'PRODUCT_TBL' },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'CUSTOMER_TBL' },
    sku: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    supplierId: { type: mongoose_1.Schema.Types.ObjectId, ref: "SUPPLIER_TBL", required: [true, "Required supplier id !"] },
    addedAt: { type: Date, default: Date.now() }
}), "SHOPPING_CART_TBL");
